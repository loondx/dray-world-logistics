// 2.5D for the aerial map. A fixed oblique camera (looking north-west from the south-east)
// lifts every surface of height z by OFFSET(z) on screen, so solids show their roof plus
// their south and east faces. The sun is top-left, so shadows fall down-right with length
// proportional to height. Scale: 3 world units = 1 ft.
import type { ReactNode } from "react";

export const LEAN = { x: 0.12, y: 0.42 } as const; // screen offset per unit of height (up-left)
export const SUN = { x: 0.32, y: 0.42 } as const; // shadow offset per unit of height (down-right)

const SHADOW = "#0b1a33";
const RAD = Math.PI / 180;

type Pt = [number, number];

/** Screen offset of height z, expressed in a frame rotated by `deg`. */
export function lift(z: number, deg: number): Pt {
  const t = deg * RAD;
  const px = -LEAN.x * z;
  const py = -LEAN.y * z;
  return [Math.cos(t) * px + Math.sin(t) * py, -Math.sin(t) * px + Math.cos(t) * py];
}

/** Hex colour darkened by k (0–1). */
export function shade(hex: string, k: number) {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * (1 - k));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

export type Face = { d: string; fill: string };

/**
 * Side faces of a w×h box (centred on the origin) spanning heights z0 → z0+H, in a frame
 * rotated by `deg` from world axes. Only faces turned toward the camera are returned.
 */
export function prismFaces(
  w: number,
  h: number,
  z0: number,
  H: number,
  deg: number,
  color: string,
  side?: string,
): Face[] {
  const [bx, by] = lift(z0, deg);
  const [tx, ty] = lift(z0 + H, deg);
  const x0 = -w / 2;
  const x1 = w / 2;
  const y0 = -h / 2;
  const y1 = h / 2;
  const t = deg * RAD;
  const edges: { a: Pt; b: Pt; n: Pt }[] = [
    { a: [x1, y0], b: [x1, y1], n: [1, 0] },
    { a: [x0, y1], b: [x1, y1], n: [0, 1] },
    { a: [x0, y0], b: [x0, y1], n: [-1, 0] },
    { a: [x0, y0], b: [x1, y0], n: [0, -1] },
  ];
  const dir: Pt = [tx - bx, ty - by];
  const faces: Face[] = [];
  for (const { a, b, n } of edges) {
    if (n[0] * dir[0] + n[1] * dir[1] >= -1e-6) continue; // faces away from the camera
    // world-space normal decides the light: east faces darkest, south faces mid
    const wx = Math.cos(t) * n[0] - Math.sin(t) * n[1];
    const wy = Math.sin(t) * n[0] + Math.cos(t) * n[1];
    const k = 0.16 + 0.2 * Math.max(0, wx) + 0.06 * Math.max(0, wy) - 0.06 * Math.max(0, -wx);
    const p = (q: Pt, ox: number, oy: number) => `${(q[0] + ox).toFixed(2)},${(q[1] + oy).toFixed(2)}`;
    faces.push({
      d: `M${p(a, bx, by)} L${p(b, bx, by)} L${p(b, tx, ty)} L${p(a, tx, ty)} Z`,
      fill: side ? shade(side, Math.max(0, k - 0.16)) : shade(color, k),
    });
  }
  return faces;
}

/** Shadow of a w×h footprint standing H tall, in a frame rotated by `deg` (sun stays fixed). */
export function prismShadow(w: number, h: number, H: number, deg = 0) {
  const t = deg * RAD;
  // world sun offset expressed in the local (rotated) frame
  const sx = Math.cos(t) * SUN.x * H + Math.sin(t) * SUN.y * H;
  const sy = -Math.sin(t) * SUN.x * H + Math.cos(t) * SUN.y * H;
  const corners: Pt[] = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ];
  const pts = [...corners, ...corners.map(([x, y]) => [x + sx, y + sy] as Pt)].sort(
    (a, b) => a[0] - b[0] || a[1] - b[1],
  );
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: Pt[]) => {
    const out: Pt[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  const hull = [...half(pts), ...half([...pts].reverse())];
  return `M${hull.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")} Z`;
}

export type BoxProps = {
  w: number;
  h: number;
  /** Height of the box. */
  H: number;
  /** Height of its base above ground. */
  z0?: number;
  color: string;
  /** Override side colour (e.g. when the roof uses a gradient). */
  side?: string;
  /** Roof drawing, in local coordinates (centred). Defaults to a flat roof. */
  roof?: ReactNode;
  rx?: number;
};

/** A box at a fixed rotation `deg` (its parent group must be rotated by the same angle). */
export function Box({ w, h, H, z0 = 0, color, side, roof, rx = 1, deg = 0 }: BoxProps & { deg?: number }) {
  const [tx, ty] = lift(z0 + H, deg);
  return (
    <g>
      {prismFaces(w, h, z0, H, deg, color, side).map((face, i) => (
        <path key={i} d={face.d} fill={face.fill} />
      ))}
      <g transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)})`}>
        {roof ?? <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={rx} fill={color} />}
      </g>
    </g>
  );
}

/** Footprint shadow for a solid of height H (soft, for vehicles). */
export function SolidShadow({
  w,
  h,
  H,
  opacity = 0.22,
  soft = true,
  deg = 0,
}: {
  w: number;
  h: number;
  H: number;
  opacity?: number;
  soft?: boolean;
  /** Rotation of the parent frame; the shadow still falls with the (fixed) sun. */
  deg?: number;
}) {
  return (
    <path
      d={prismShadow(w, h, H, deg)}
      fill={SHADOW}
      opacity={opacity}
      filter={soft ? "url(#aw-soft)" : undefined}
      aria-hidden="true"
    />
  );
}
