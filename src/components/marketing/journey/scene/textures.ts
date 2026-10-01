import * as THREE from "three";

// Procedural canvas textures — no image downloads, crisp at any size.

function canvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  draw(el.getContext("2d")!);
  return el;
}

function texture(el: HTMLCanvasElement, { srgb = true, repeat = false, aniso = 4 } = {}) {
  const tex = new THREE.CanvasTexture(el);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = aniso;
  return tex;
}

/** Seeded PRNG so the scenery is identical on every visit. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ribs(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, alpha = 0.22) {
  for (let i = 0; i < count; i++) {
    const x = (i / count) * w;
    const grad = ctx.createLinearGradient(x, 0, x + w / count, 0);
    grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
    grad.addColorStop(0.35, `rgba(255,255,255,${alpha * 0.6})`);
    grad.addColorStop(0.7, `rgba(0,0,0,${alpha * 0.4})`);
    grad.addColorStop(1, `rgba(0,0,0,${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w / count, h);
  }
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.fillRect(0, 0, w, h * 0.05);
  ctx.fillRect(0, h * 0.95, w, h * 0.05);
}

/** White corrugated side panel; tinted per container by the material / instance colour. */
export function containerSide() {
  return texture(
    canvas(512, 128, (ctx) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 512, 128);
      ribs(ctx, 512, 128, 48);
      // weathering
      const r = rng(7);
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = `rgba(60,40,30,${r() * 0.06})`;
        ctx.fillRect(r() * 512, r() * 128, 2 + r() * 20, 1 + r() * 6);
      }
    }),
  );
}

export function containerDoors() {
  return texture(
    canvas(128, 128, (ctx) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 128, 128);
      ribs(ctx, 128, 128, 8, 0.16);
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(63, 0, 2, 128);
      ctx.fillStyle = "rgba(40,40,40,.55)";
      for (const x of [22, 46, 82, 106]) ctx.fillRect(x, 6, 3, 116);
    }),
  );
}

/** Our container: DRAY-WORLD cyan with the wordmark. */
export function heroSide() {
  return texture(
    canvas(1024, 256, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, "#22b3e2");
      grad.addColorStop(1, "#1592c4");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 256);
      ribs(ctx, 1024, 256, 64, 0.16);
      ctx.fillStyle = "#18234a";
      ctx.fillRect(0, 196, 1024, 18);
      ctx.fillStyle = "#fff";
      ctx.font = "800 104px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("DRAY-WORLD", 512, 104);
      ctx.font = "700 30px Arial, Helvetica, sans-serif";
      ctx.fillText("L O G I S T I C S", 512, 166);
    }),
    { aniso: 8 },
  );
}

export function heroDoors() {
  return texture(
    canvas(256, 256, (ctx) => {
      ctx.fillStyle = "#1aa6d6";
      ctx.fillRect(0, 0, 256, 256);
      ribs(ctx, 256, 256, 10, 0.14);
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(127, 0, 3, 256);
      ctx.fillStyle = "rgba(20,30,50,.6)";
      for (const x of [44, 92, 164, 212]) ctx.fillRect(x, 12, 5, 232);
    }),
  );
}

/** Mottled tile for large ground areas (multiplied with the material colour). */
export function noise(seed: number, strength: number, speckle = 0) {
  return texture(
    canvas(256, 256, (ctx) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 256, 256);
      const r = rng(seed);
      for (let i = 0; i < 2600; i++) {
        const v = Math.floor(255 - r() * 255 * strength);
        ctx.fillStyle = `rgba(${v},${v},${v},${0.15 + r() * 0.25})`;
        const size = 2 + r() * 14;
        ctx.beginPath();
        ctx.arc(r() * 256, r() * 256, size, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < speckle; i++) {
        const v = Math.floor(120 + r() * 120);
        ctx.fillStyle = `rgba(${v},${v},${v},.5)`;
        ctx.fillRect(r() * 256, r() * 256, 1, 1);
      }
    }),
    { repeat: true, aniso: 8 },
  );
}

/** Concrete apron with expansion joints. */
export function slabs() {
  return texture(
    canvas(256, 256, (ctx) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 256, 256);
      const r = rng(11);
      for (let i = 0; i < 1400; i++) {
        const v = Math.floor(200 + r() * 55);
        ctx.fillStyle = `rgba(${v},${v},${v},.35)`;
        ctx.fillRect(r() * 256, r() * 256, 1 + r() * 6, 1 + r() * 6);
      }
      ctx.strokeStyle = "rgba(90,96,110,.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 254, 254);
      ctx.beginPath();
      ctx.moveTo(128, 0);
      ctx.lineTo(128, 256);
      ctx.moveTo(0, 128);
      ctx.lineTo(256, 128);
      ctx.stroke();
    }),
    { repeat: true, aniso: 8 },
  );
}

/** Crop rows for farmland. */
export function crops() {
  return texture(
    canvas(64, 64, (ctx) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "rgba(0,0,0,.16)";
      for (let x = 0; x < 64; x += 8) ctx.fillRect(x, 0, 3, 64);
    }),
    { repeat: true },
  );
}

/** Tangent-space normal map of overlapping swells (for water). */
export function waterNormals() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const waves = [
    [1, 2, 0.6],
    [3, -1, 0.35],
    [-2, 5, 0.22],
    [6, 3, 0.14],
    [-7, -4, 0.1],
  ] as const;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let nx = 0;
      let ny = 0;
      for (const [kx, ky, a] of waves) {
        const phase = ((kx * x + ky * y) / size) * Math.PI * 2;
        const d = Math.cos(phase) * a;
        nx += d * kx * 0.12;
        ny += d * ky * 0.12;
      }
      const len = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/** Road / gantry sign: white text on a coloured panel, optional arrows. */
export function sign(lines: string[], { bg = "#0f6b3c", w = 512, h = 160, arrow = "" } = {}) {
  return texture(
    canvas(w, h, (ctx) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const size = Math.min(54, (h - 30) / lines.length - 6);
      ctx.font = `700 ${size}px Arial, Helvetica, sans-serif`;
      lines.forEach((line, i) =>
        ctx.fillText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * (size + 8)),
      );
      if (arrow) {
        ctx.font = `700 ${size * 1.3}px Arial, sans-serif`;
        ctx.fillText(arrow, arrow === "←" ? 44 : w - 44, h / 2);
      }
    }),
    { aniso: 8 },
  );
}

/** Soft radial blob (contact shadows, foam, glow). */
export function blob(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  return texture(
    canvas(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      g.addColorStop(0, inner);
      g.addColorStop(1, outer);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }),
  );
}

/** V-shaped wake for the moving vessel (alpha in the red channel). */
export function wake() {
  return texture(
    canvas(128, 512, (ctx) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 128, 512);
      const r = rng(5);
      for (let i = 0; i < 1600; i++) {
        const y = r() * 512;
        const spread = 8 + (y / 512) * 56;
        const side = r() < 0.5 ? -1 : 1;
        const edge = 64 + side * spread * (0.75 + r() * 0.3);
        const centre = 64 + (r() - 0.5) * spread * 0.6;
        const x = r() < 0.6 ? edge : centre;
        const a = (1 - y / 512) * (0.25 + r() * 0.5);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, 1 + r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }),
    { srgb: false },
  );
}

/** Building facade: window bands. */
export function facade(bands = 4, bg = "#e6eaef") {
  return texture(
    canvas(256, 256, (ctx) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#4b5d74";
      for (let i = 0; i < bands; i++) {
        const y = 30 + (i * 200) / bands;
        for (let x = 10; x < 246; x += 20) ctx.fillRect(x, y, 14, 200 / bands - 22);
      }
    }),
    { repeat: true },
  );
}
