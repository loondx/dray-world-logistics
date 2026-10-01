import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { createKit } from "./kit";
import { disposePaints } from "./models";
import { BOX, cameraAt, FOCUS } from "./timeline";
import { buildWorld } from "./world";

export type EngineOptions = {
  /** Raw scroll progress of the journey section (0–1). */
  progress: () => number;
  reducedMotion: boolean;
  mobile: boolean;
  /** Screen position of the "your container" tag, in CSS px of the canvas. */
  onTag?: (x: number, y: number, visible: boolean) => void;
  /** Smoothed progress actually shown (drives captions in sync with the picture). */
  onProgress?: (s: number) => void;
  onReady?: () => void;
  onLost?: () => void;
};

export type Engine = { start(): void; stop(): void; dispose(): void };

const SKY_TOP = new THREE.Color("#6fa9d6");
const HORIZON = new THREE.Color("#dce8f1");
/** How quickly the picture catches up with the scroll position (1/s). */
const CATCH_UP = 5.5;

export function createEngine(canvas: HTMLCanvasElement, opts: EngineOptions): Engine {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  let pixelRatio = Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HORIZON, opts.mobile ? 240 : 280, opts.mobile ? 1000 : 1150);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.45;

  // Sky dome (gradient, follows the camera).
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: SKY_TOP }, horizon: { value: HORIZON } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 top;
      uniform vec3 horizon;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        gl_FragColor = vec4(mix(horizon, top, pow(h, 0.6)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2200, 32, 16), skyMat);
  sky.renderOrder = -1;
  scene.add(sky);

  const hemi = new THREE.HemisphereLight("#e4f1ff", "#7f8f6c", 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff3df", 2.7);
  const SUN_DIR = new THREE.Vector3(0.48, 0.78, 0.4).normalize();
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(opts.mobile ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.35;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 700;
  scene.add(sun, sun.target);

  const kit = createKit();
  const world = buildWorld(kit, scene, { mobile: opts.mobile, trees: opts.mobile ? 520 : 1150 });

  const camera = new THREE.PerspectiveCamera(38, 1, 1, 4000);
  let width = 0;
  let height = 0;
  let distanceScale = 1;

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    // Portrait: keep a ~62° horizontal field so the scene isn't cropped to a sliver.
    camera.fov =
      aspect >= 1.2
        ? 36
        : Math.min(72, (2 * Math.atan(Math.tan((31 * Math.PI) / 180) / aspect) * 180) / Math.PI);
    distanceScale = aspect >= 1.2 ? 1 : 1.12;
    // Frame the container away from the caption: right of centre on desktop, lower on phones.
    const [fx, fy] = w >= 1024 ? [-0.13, -0.02] : aspect < 1 ? [0, -0.12] : [-0.06, -0.06];
    camera.setViewOffset(w, h, fx * w, fy * h, w, h);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  // ── Frame loop ──
  let s = opts.progress();
  let targetY: number | null = null;
  let frame = 0;
  let last = 0;
  let running = false;
  let ready = false;
  let slowFrames = 0;
  let sampled = 0;
  let shadowSize = 0;
  const target = new THREE.Vector3();
  const focus = new THREE.Vector3(FOCUS.x, FOCUS.y, FOCUS.z);
  const tag = new THREE.Vector3();

  const render = (now: number) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    const goal = opts.progress();
    s = opts.reducedMotion ? goal : s + (goal - s) * (1 - Math.exp(-dt * CATCH_UP));
    if (Math.abs(goal - s) < 1e-5) s = goal;
    const t = opts.reducedMotion ? 0 : now / 1000;

    const h = world.update(s, t, opts.reducedMotion ? 0 : dt);
    const cam = cameraAt(s);
    target.set(h.x, h.y + BOX.h / 2, h.z).lerp(focus, cam.focus);
    // Soften vertical bobbing while the box is on a crane hook.
    targetY =
      targetY === null || opts.reducedMotion
        ? target.y
        : targetY + (target.y - targetY) * (1 - Math.exp(-dt * 4));
    target.y = targetY;

    const el = (cam.elevation * Math.PI) / 180;
    const az = (cam.azimuth * Math.PI) / 180;
    const d = cam.distance * distanceScale;
    camera.position.set(
      target.x + d * Math.cos(el) * Math.sin(az),
      Math.max(3, target.y + d * Math.sin(el)),
      target.z + d * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(target);
    sky.position.copy(camera.position);

    // Sun + shadow frustum follow the action.
    const size = Math.min(150, Math.max(55, d * 0.85));
    if (Math.abs(size - shadowSize) > 4) {
      shadowSize = size;
      const c = sun.shadow.camera;
      c.left = c.bottom = -size;
      c.right = c.top = size;
      c.updateProjectionMatrix();
    }
    sun.target.position.copy(target);
    sun.position.copy(target).addScaledVector(SUN_DIR, 300);

    renderer.render(scene, camera);
    opts.onProgress?.(s);

    if (opts.onTag) {
      tag.set(h.x, h.y + BOX.h + 1.6, h.z).project(camera);
      const visible = tag.z < 1 && Math.abs(tag.x) < 0.95 && Math.abs(tag.y) < 0.95;
      opts.onTag(((tag.x + 1) / 2) * width, ((1 - tag.y) / 2) * height, visible);
    }

    if (!ready) {
      ready = true;
      opts.onReady?.();
    }
    // Adaptive quality: drop resolution on devices that can't keep ~35 fps.
    if (sampled < 120 && dt < 0.1) {
      sampled++;
      if (dt > 1 / 35) slowFrames++;
      if (sampled === 120 && slowFrames > 50 && pixelRatio > 1) {
        pixelRatio = 1;
        renderer.setPixelRatio(1);
        width = 0;
        resize();
      }
    }
  };

  const tick = (now: number) => {
    if (!running) return;
    render(now);
    frame = requestAnimationFrame(tick);
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    running = false;
    cancelAnimationFrame(frame);
    opts.onLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      world.dispose();
      disposePaints(kit);
      kit.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) mesh.geometry.dispose();
      });
      skyMat.dispose();
      envMap.dispose();
      room.dispose();
      pmrem.dispose();
      sun.shadow.map?.dispose();
      renderer.dispose();
    },
  };
}
