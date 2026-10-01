import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import * as tx from "./textures";

// Shared materials and geometry helpers for the 3D journey.

export type Kit = ReturnType<typeof createKit>;

export function createKit() {
  const textures = {
    side: tx.containerSide(),
    doors: tx.containerDoors(),
    heroSide: tx.heroSide(),
    heroDoors: tx.heroDoors(),
    grass: tx.noise(3, 0.35),
    asphalt: tx.noise(9, 0.25, 900),
    slabs: tx.slabs(),
    crops: tx.crops(),
    water: tx.waterNormals(),
    blob: tx.blob("rgba(0,0,0,.55)", "rgba(0,0,0,0)"),
    wake: tx.wake(),
    facade: tx.facade(3),
    office: tx.facade(5, "#dfe6ee"),
  };

  const std = (
    color: string,
    roughness = 0.6,
    metalness = 0,
    extra: THREE.MeshStandardMaterialParameters = {},
  ) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

  const m = {
    white: std("#eef2f6", 0.38, 0.15),
    navy: std("#1a2650", 0.36, 0.35),
    cyan: std("#1aa6d6", 0.38, 0.25),
    steel: std("#8b97a6", 0.42, 0.65),
    darkSteel: std("#39424f", 0.6, 0.5),
    black: std("#1b2029", 0.7, 0.2),
    rubber: std("#15181e", 0.95, 0),
    chrome: std("#e3e9f0", 0.16, 1),
    aluminium: std("#c3cad3", 0.3, 0.85),
    glass: std("#17283a", 0.06, 0.4, { envMapIntensity: 2 }),
    headlight: new THREE.MeshStandardMaterial({
      color: "#fffaf0",
      emissive: "#fff2cc",
      emissiveIntensity: 1.4,
    }),
    taillight: new THREE.MeshStandardMaterial({
      color: "#b0101e",
      emissive: "#e0142c",
      emissiveIntensity: 0.9,
    }),
    yellow: std("#e3b23c", 0.5, 0.25),
    red: std("#b8222c", 0.6, 0.1),
    orange: std("#e0782f", 0.55, 0.1),
    craneBlue: std("#2c7fb8", 0.45, 0.4),
    craneWhite: std("#eef2f5", 0.45, 0.3),
    hull: std("#1d2a4f", 0.5, 0.35),
    hullRed: std("#8f2a24", 0.75, 0.1),
    deck: std("#5c6774", 0.85, 0.2),
    house: std("#f4f6f8", 0.5, 0.05),
    loco: std("#2b3340", 0.45, 0.4),
    wellCar: std("#5b4a3e", 0.75, 0.3),
    concrete: std("#c7cdd4", 0.92, 0, { map: textures.slabs }),
    quayWall: std("#8a9099", 0.95),
    asphalt: std("#4d5560", 0.95, 0, { map: textures.asphalt }),
    yardAsphalt: std("#5d6570", 0.95, 0, { map: textures.asphalt }),
    grass: std("#8fb07a", 1, 0, { map: textures.grass }),
    bank: std("#7b9468", 1, 0, { map: textures.grass }),
    ballast: std("#8f877d", 1, 0, { map: textures.asphalt }),
    sleeper: std("#5e5045", 0.9),
    rail: std("#a3aab3", 0.3, 0.9),
    marking: std("#f4f4ef", 0.7),
    markingYellow: std("#efc24a", 0.7),
    jersey: std("#d7dbe0", 0.85),
    foliage: std("#4f7d4c", 0.9, 0, { flatShading: true }),
    conifer: std("#3f6a46", 0.9, 0, { flatShading: true }),
    trunk: std("#6b4f3a", 0.95),
    wall: std("#e4e8ed", 0.8, 0, { map: textures.facade }),
    office: std("#e9eef3", 0.6, 0.1, { map: textures.office }),
    plainWall: std("#dfe4ea", 0.85),
    roof: std("#a5aeb9", 0.7, 0.3),
    barn: std("#9c3b2e", 0.85),
    silo: std("#c9ced4", 0.4, 0.7),
    dockDoor: std("#56606d", 0.55, 0.45),
    seal: std("#22262d", 0.9),
    container: std("#ffffff", 0.62, 0.35, { map: textures.side }),
    van: std("#f2f4f7", 0.5, 0.2, { map: textures.side }),
    water: std("#245f86", 0.3, 0.05, {
      normalMap: textures.water,
      normalScale: new THREE.Vector2(0.2, 0.2),
      envMapIntensity: 1.3,
    }),
    shadowBlob: new THREE.MeshBasicMaterial({
      map: textures.blob,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    }),
    wake: new THREE.MeshBasicMaterial({
      color: "#ffffff",
      alphaMap: textures.wake,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    }),
  };

  const heroTop = std("#1aa6d6", 0.5, 0.3);
  const heroSide = std("#ffffff", 0.45, 0.3, { map: textures.heroSide });
  const heroDoors = std("#ffffff", 0.45, 0.3, { map: textures.heroDoors });
  const heroMaterials = [heroSide, heroSide, heroTop, heroTop, heroDoors, heroDoors];

  // Per-colour clones of the corrugated container material (for baked stacks).
  const tinted = new Map<string, THREE.MeshStandardMaterial>();
  const containerTint = (color: string) => {
    let mat = tinted.get(color);
    if (!mat) {
      mat = m.container.clone();
      mat.color.set(color);
      tinted.set(color, mat);
    }
    return mat;
  };

  const owned: THREE.BufferGeometry[] = [];
  const extraMaterials: THREE.Material[] = [];
  const track = <G extends THREE.BufferGeometry>(g: G) => {
    owned.push(g);
    return g;
  };

  return {
    m,
    textures,
    heroMaterials,
    containerTint,
    track,
    sign(lines: string[], options?: Parameters<typeof tx.sign>[1]) {
      const map = tx.sign(lines, options);
      const mat = new THREE.MeshStandardMaterial({
        map,
        roughness: 0.5,
        emissive: "#ffffff",
        emissiveMap: map,
        emissiveIntensity: 0.18,
      });
      extraMaterials.push(mat);
      return mat;
    },
    dispose() {
      for (const t of Object.values(textures)) t.dispose();
      for (const mat of [...Object.values(m), ...heroMaterials, ...tinted.values(), ...extraMaterials]) {
        (mat as THREE.MeshStandardMaterial).map?.dispose();
        mat.dispose();
      }
      for (const g of owned) g.dispose();
    },
  };
}

// ── Geometry helpers ──

export function box(w: number, h: number, l: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

/** Cylinder; axis "y" (upright), "x" (across, wheels) or "z" (along). */
export function cyl(
  r: number,
  len: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  axis: "x" | "y" | "z" = "y",
  segments = 16,
  r2 = r,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, len, segments), mat);
  mesh.position.set(x, y, z);
  if (axis === "x") mesh.rotation.z = Math.PI / 2;
  if (axis === "z") mesh.rotation.x = Math.PI / 2;
  return mesh;
}

/** A square-section member between two points (truss, stays, braces). */
export function beam(from: THREE.Vector3Tuple, to: THREE.Vector3Tuple, size: number, mat: THREE.Material) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, len, size), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  return mesh;
}

/** Horizontal rectangle at height y with UVs tiled every `tile` metres. */
export function flat(w: number, l: number, mat: THREE.Material, x: number, y: number, z: number, tile = 0) {
  const g = new THREE.PlaneGeometry(w, l);
  g.rotateX(-Math.PI / 2);
  if (tile) scaleUv(g, w / tile, l / tile);
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

export function scaleUv(g: THREE.BufferGeometry, u: number, v: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  uv.needsUpdate = true;
}

/** A flat strip following (x, z) points — roads, ballast, rivers. */
export function ribbon(points: { x: number; z: number }[], width: number, y: number, tile = 0) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let run = 0;
  points.forEach((p, i) => {
    const a = points[Math.max(0, i - 1)]!;
    const b = points[Math.min(points.length - 1, i + 1)]!;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;
    if (i) run += Math.hypot(p.x - points[i - 1]!.x, p.z - points[i - 1]!.z);
    pos.push(
      p.x + (nx * width) / 2,
      y,
      p.z + (nz * width) / 2,
      p.x - (nx * width) / 2,
      y,
      p.z - (nz * width) / 2,
    );
    const v = tile ? run / tile : i;
    uv.push(0, v, tile ? width / tile : 1, v);
    if (i) {
      const k = i * 2;
      idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // Face up regardless of travel direction: flip the winding if the first triangle faces down.
  const [a, b, c] = [idx[0]!, idx[1]!, idx[2]!].map(
    (k) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]),
  );
  if (new THREE.Vector3().subVectors(b!, a!).cross(new THREE.Vector3().subVectors(c!, a!)).y < 0) {
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2]!, idx[i + 1]!];
    g.setIndex(idx);
  }
  g.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill([0, 1, 0]).flat(), 3),
  );
  return g;
}

/**
 * Merges every mesh under `root` into one mesh per material — one draw call per material
 * for a whole vehicle or building. Shadow flags are applied to the result.
 */
export function bake(root: THREE.Object3D, { cast = true, receive = true } = {}) {
  root.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || (obj as THREE.InstancedMesh).isInstancedMesh || Array.isArray(mesh.material)) return;
    const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld));
    for (const name of Object.keys(g.attributes))
      if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
    if (!g.attributes.uv)
      g.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position!.count * 2), 2),
      );
    g.clearGroups();
    const list = buckets.get(mesh.material as THREE.Material) ?? [];
    list.push(g);
    buckets.set(mesh.material as THREE.Material, list);
  });
  const out = new THREE.Group();
  for (const [mat, list] of buckets) {
    const merged = mergeGeometries(list, false);
    list.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    out.add(mesh);
  }
  // Keep instanced / multi-material children as they are.
  const keep: THREE.Object3D[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if ((obj as THREE.InstancedMesh).isInstancedMesh || (mesh.isMesh && Array.isArray(mesh.material)))
      keep.push(obj);
  });
  for (const obj of keep) {
    obj.updateMatrixWorld(true);
    const local = new THREE.Matrix4().multiplyMatrices(inverse, obj.matrixWorld);
    obj.removeFromParent();
    local.decompose(obj.position, obj.quaternion, obj.scale);
    out.add(obj);
  }
  disposeTree(root);
  return out;
}

/** Disposes geometries under a node (materials are shared and owned by the kit). */
export function disposeTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) mesh.geometry.dispose();
  });
}

export function shadows(root: THREE.Object3D, cast = true, receive = true) {
  root.traverse((obj) => {
    obj.castShadow = cast;
    obj.receiveShadow = receive;
  });
  return root;
}
