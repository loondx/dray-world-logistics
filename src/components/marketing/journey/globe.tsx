"use client";

import { useEffect, useRef } from "react";

import { landDots } from "./world-land";

// Hero globe (canvas): dotted continents, ocean lanes, air routes and a road leg converging
// on the Greater Toronto Area, with a ship, a freighter and a truck travelling them — the
// world / ship / plane / truck of the DRAY-WORLD logo, in motion.

type Vec = [number, number, number];
type Route = { kind: "sea" | "air" | "road"; points: Vec[]; period: number; phase: number };

const RAD = Math.PI / 180;
const TILT = 24 * RAD;
const BASE_LON = -48;
const SWAY = 26; // degrees of gentle back-and-forth rotation

const PLACES = {
  rotterdam: [4.4, 51.9],
  hamburg: [10, 53.5],
  santos: [-46.3, -24],
  frankfurt: [8.7, 50],
  dubai: [55.3, 25.2],
  saoPaulo: [-46.6, -23.5],
  halifax: [-63.6, 44.6],
  newYork: [-74, 40.7],
  montreal: [-73.6, 45.5],
  toronto: [-79.4, 43.7],
  chicago: [-87.6, 41.9],
  savannah: [-81.1, 32.1],
} as const;

function vec([lon, lat]: readonly [number, number]): Vec {
  const la = lat * RAD;
  const lo = lon * RAD;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

// Great-circle path, optionally lifted (air routes arc above the surface).
function arc(a: readonly [number, number], b: readonly [number, number], lift: number, n = 72): Vec[] {
  const p = vec(a);
  const q = vec(b);
  const dot = Math.min(1, Math.max(-1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
  const omega = Math.acos(dot);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const s = Math.sin(omega) || 1;
    const k1 = Math.sin((1 - t) * omega) / s;
    const k2 = Math.sin(t * omega) / s;
    const h = 1 + lift * Math.sin(Math.PI * t);
    return [(k1 * p[0] + k2 * q[0]) * h, (k1 * p[1] + k2 * q[1]) * h, (k1 * p[2] + k2 * q[2]) * h];
  });
}

const ROUTES: Route[] = [
  { kind: "sea", points: arc(PLACES.rotterdam, PLACES.halifax, 0.01), period: 16, phase: 0 },
  { kind: "sea", points: arc(PLACES.santos, PLACES.savannah, 0.01), period: 18, phase: 0.45 },
  { kind: "air", points: arc(PLACES.frankfurt, PLACES.toronto, 0.16), period: 9, phase: 0.2 },
  { kind: "air", points: arc(PLACES.dubai, PLACES.chicago, 0.24), period: 12, phase: 0.7 },
  { kind: "road", points: arc(PLACES.halifax, PLACES.montreal, 0.004), period: 10, phase: 0.1 },
  { kind: "road", points: arc(PLACES.montreal, PLACES.toronto, 0.004), period: 7, phase: 0.5 },
  { kind: "road", points: arc(PLACES.toronto, PLACES.chicago, 0.004), period: 8, phase: 0.8 },
];

const HUB = vec(PLACES.toronto);

export function HeroGlobe({ animate, className }: { animate: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dots = landDots();
    let size = 0;
    let frame = 0;
    let visible = true;
    const start = performance.now();

    const draw = (now: number) => {
      if (!size) return;
      const time = (now - start) / 1000;
      const lon0 = (BASE_LON + Math.sin(time * 0.09) * SWAY) * RAD;
      const cosL = Math.cos(lon0);
      const sinL = Math.sin(lon0);
      const cosT = Math.cos(TILT);
      const sinT = Math.sin(TILT);
      const r = size * 0.42;
      const cx = size / 2;
      const cy = size / 2;
      // world vector → view (x right, y up, z toward viewer)
      const view = ([X, Y, Z]: Vec): Vec => {
        const x = X * cosL - Z * sinL;
        const z1 = X * sinL + Z * cosL;
        return [x, Y * cosT - z1 * sinT, Y * sinT + z1 * cosT];
      };
      const seen = ([x, y, z]: Vec) => z > 0 || x * x + y * y > 1;

      ctx.clearRect(0, 0, size, size);

      // atmosphere + sphere
      const halo = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.22);
      halo.addColorStop(0, "rgba(26,166,214,0.22)");
      halo.addColorStop(1, "rgba(26,166,214,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
      ctx.fill();
      const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
      body.addColorStop(0, "#ffffff");
      body.addColorStop(0.7, "#eef7fb");
      body.addColorStop(1, "#d5ebf5");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // graticule
      ctx.strokeStyle = "rgba(13,116,168,0.09)";
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let pen = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          const [x, y, z] = view(vec([lon, lat]));
          if (z <= 0) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(cx + x * r, cy - y * r);
          else ctx.moveTo(cx + x * r, cy - y * r);
          pen = true;
        }
        ctx.stroke();
      }
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let pen = false;
        for (let lat = -88; lat <= 88; lat += 4) {
          const [x, y, z] = view(vec([lon, lat]));
          if (z <= 0) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(cx + x * r, cy - y * r);
          else ctx.moveTo(cx + x * r, cy - y * r);
          pen = true;
        }
        ctx.stroke();
      }

      // land dots, shaded by facing
      const dotR = Math.max(1, size * 0.0042);
      for (let i = 0; i < dots.length; i += 2) {
        const lat = dots[i]!;
        const lon = dots[i + 1]!;
        const [x, y, z] = view([Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]);
        if (z <= 0.02) continue;
        ctx.globalAlpha = 0.25 + z * 0.75;
        ctx.fillStyle = z > 0.55 ? "#0f86b4" : "#1aa6d6";
        ctx.beginPath();
        ctx.arc(cx + x * r, cy - y * r, dotR * (0.7 + z * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // routes
      for (const route of ROUTES) {
        const pts = route.points.map(view);
        ctx.beginPath();
        let pen = false;
        for (const p of pts) {
          if (!seen(p)) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(cx + p[0] * r, cy - p[1] * r);
          else ctx.moveTo(cx + p[0] * r, cy - p[1] * r);
          pen = true;
        }
        ctx.setLineDash(route.kind === "sea" ? [2, 5] : route.kind === "air" ? [] : []);
        ctx.strokeStyle =
          route.kind === "air"
            ? "rgba(26,166,214,0.85)"
            : route.kind === "sea"
              ? "rgba(24,35,74,0.55)"
              : "#18234a";
        ctx.lineWidth = route.kind === "road" ? 2.4 : 1.6;
        ctx.stroke();
        ctx.setLineDash([]);

        // travelling glyph
        const t = ((((animate ? time : 0) / route.period + route.phase) % 1) + 1) % 1;
        const f = t * (pts.length - 1);
        const i = Math.min(pts.length - 2, Math.floor(f));
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const k = f - i;
        const p: Vec = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
        if (!seen(p)) continue;
        const heading = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
        glyph(ctx, route.kind, cx + p[0] * r, cy - p[1] * r, heading, size / 520);
      }

      // destination: Greater Toronto Area
      const [hx, hy, hz] = view(HUB);
      if (hz > 0) {
        const pulse = animate ? (time % 2.4) / 2.4 : 0.4;
        ctx.strokeStyle = `rgba(26,166,214,${0.7 * (1 - pulse)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx + hx * r, cy - hy * r, 5 + pulse * 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#18234a";
        ctx.beginPath();
        ctx.arc(cx + hx * r, cy - hy * r, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      draw(now);
      if (animate && visible) frame = requestAnimationFrame(loop);
    };
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size = canvas.clientWidth;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };
    const sizer = new ResizeObserver(resize);
    sizer.observe(canvas);
    const watcher = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible && animate) frame = requestAnimationFrame(loop);
    });
    watcher.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      sizer.disconnect();
      watcher.disconnect();
    };
  }, [animate]);

  return (
    <canvas
      ref={ref}
      className={className}
      role="img"
      aria-label="Globe with ocean, air and road routes from Europe, the Middle East and South America converging on the Greater Toronto Area."
    />
  );
}

function glyph(
  ctx: CanvasRenderingContext2D,
  kind: Route["kind"],
  x: number,
  y: number,
  heading: number,
  s: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.scale(Math.max(0.7, s), Math.max(0.7, s));
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (kind === "air") {
    // freighter, nose along +x
    ctx.moveTo(9, 0);
    ctx.lineTo(3, -1.6);
    ctx.lineTo(-1, -8);
    ctx.lineTo(-3.5, -8);
    ctx.lineTo(-1.5, -1.6);
    ctx.lineTo(-6, -1.6);
    ctx.lineTo(-8, -4.5);
    ctx.lineTo(-9.5, -4.5);
    ctx.lineTo(-8.5, 0);
    ctx.lineTo(-9.5, 4.5);
    ctx.lineTo(-8, 4.5);
    ctx.lineTo(-6, 1.6);
    ctx.lineTo(-1.5, 1.6);
    ctx.lineTo(-3.5, 8);
    ctx.lineTo(-1, 8);
    ctx.lineTo(3, 1.6);
    ctx.closePath();
    ctx.fillStyle = "#1aa6d6";
  } else if (kind === "sea") {
    ctx.moveTo(10, 0);
    ctx.lineTo(5, -3.5);
    ctx.lineTo(-8, -3.5);
    ctx.lineTo(-8, 3.5);
    ctx.lineTo(5, 3.5);
    ctx.closePath();
    ctx.fillStyle = "#18234a";
  } else {
    ctx.rect(-8, -3, 11, 6);
    ctx.rect(4, -2.6, 4.5, 5.2);
    ctx.fillStyle = "#0d74a8";
  }
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}
