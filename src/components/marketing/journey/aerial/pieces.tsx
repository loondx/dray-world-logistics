// Top-down (aerial) primitives. Vehicles face DOWN (+y = direction of travel) and are
// centred on their cargo. The sun is top-left, so shadows fall down-right; taller things
// cast longer shadows — that offset is what gives the flat map its depth.
import type { ReactNode } from "react";

import { CONTAINER_COLORS, INK } from "../palette";
import { Box, lift, prismShadow, SUN } from "./volume-static";
import { BOX } from "./world";

const SHADOW = "#0b1a33";
const SANS = { fontFamily: "var(--font-sans)" } as const;

export function Shadow({
  dx,
  dy,
  opacity = 0.2,
  soft = true,
  children,
}: {
  dx: number;
  dy: number;
  opacity?: number;
  soft?: boolean;
  children: ReactNode;
}) {
  return (
    <g
      transform={`translate(${dx} ${dy})`}
      fill={SHADOW}
      opacity={opacity}
      filter={soft ? "url(#aw-soft)" : undefined}
      aria-hidden="true"
    >
      {children}
    </g>
  );
}

// ── Container (roof view) ──────────────────────────────────

export function TopContainer({
  color = INK.cyan,
  label,
  w = BOX.w,
  h = BOX.h,
}: {
  color?: string;
  label?: string;
  w?: number;
  h?: number;
}) {
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={1} fill={color} />
      {/* roof curvature: lit west edge, shaded east edge; corrugation via shared pattern */}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="url(#aw-box)" />
      <rect x={-w / 2 + 1.5} y={-h / 2 + 1} width={w - 3} height={h - 2} fill="url(#aw-ribs)" />
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={1}
        fill="none"
        stroke="#000"
        strokeOpacity={0.25}
        strokeWidth={0.8}
      />
      {[
        [-w / 2, -h / 2],
        [w / 2 - 3, -h / 2],
        [-w / 2, h / 2 - 4],
        [w / 2 - 3, h / 2 - 4],
      ].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x} y={y} width={3} height={4} fill="#0b1226" opacity={0.55} />
      ))}
      {label ? (
        <text
          transform="rotate(-90)"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={w * 0.42}
          fontWeight={800}
          letterSpacing={w * 0.06}
          style={SANS}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

// ── Freighter aircraft (top view, nose down) ───────────────

const PLANE =
  "M0,150 C9,140 12,120 12,100 L12,30 L150,-40 L150,-56 L12,-20 L12,-110 L54,-140 L54,-152 L6,-140 L0,-150 L-6,-140 L-54,-152 L-54,-140 L-12,-110 L-12,-20 L-150,-56 L-150,-40 L-12,30 L-12,100 C-12,120 -9,140 0,150 Z";

export function PlaneSilhouette() {
  return <path d={PLANE} />;
}

export function TopPlane() {
  return (
    <g>
      {[-96, -52, 52, 96].map((x) => (
        <rect key={x} x={x - 6} y={-6 + Math.abs(x) * -0.28} width={12} height={34} rx={6} fill="#aeb9c8" />
      ))}
      <path d={PLANE} fill="url(#aw-cab)" />
      <path d={PLANE} fill="none" stroke="#b9c5d4" />
      <path d="M0,150 C9,140 12,120 12,100 L12,-110 L6,-140 L0,-150 Z" fill="#000" opacity={0.05} />
      <path d="M-9,124 Q0,138 9,124 L8,118 Q0,128 -8,118 Z" fill={INK.navy} />
      <rect x={-1.5} y={-150} width={3} height={58} fill={INK.navy} />
      <path d="M12,10 L150,-48 L150,-40 L12,30 Z" fill={INK.cyan} opacity={0.35} />
      <path d="M-12,10 L-150,-48 L-150,-40 L-12,30 Z" fill={INK.cyan} opacity={0.35} />
    </g>
  );
}

// ── Cranes (static structure; drawn above vehicles) ────────

/** Ship-to-shore crane: boom spanning x0→x1 at y; legs at legA/legB. */
export function QuayCraneTop({
  y,
  x0,
  x1,
  legA,
  legB,
}: {
  y: number;
  x0: number;
  x1: number;
  legA: number;
  legB: number;
}) {
  const girders = (
    <>
      <rect x={x0} y={y - 13} width={x1 - x0} height={6} />
      <rect x={x0} y={y + 7} width={x1 - x0} height={6} />
    </>
  );
  return (
    <g>
      <Shadow dx={46} dy={64} opacity={0.12}>
        {girders}
        <rect x={x1 - 110} y={y - 22} width={80} height={44} />
      </Shadow>
      {[legA, legB].map((x) => (
        <g key={x}>
          <rect x={x - 5} y={y - 26} width={10} height={52} fill={INK.navyDark} opacity={0.9} />
          <rect x={x - 7} y={y - 30} width={14} height={8} fill={INK.navy} />
          <rect x={x - 7} y={y + 22} width={14} height={8} fill={INK.navy} />
        </g>
      ))}
      <g fill={INK.navy}>{girders}</g>
      {Array.from({ length: Math.floor((x1 - x0) / 28) }, (_, i) => (
        <line
          key={i}
          x1={x0 + 14 + i * 28}
          x2={x0 + 28 + i * 28}
          y1={y - 7}
          y2={y + 7}
          stroke={INK.navy}
          strokeWidth={2}
        />
      ))}
      <rect x={x1 - 110} y={y - 22} width={80} height={44} rx={3} fill={INK.navyDark} />
      <rect x={x1 - 104} y={y - 16} width={34} height={12} rx={1} fill={INK.glass} opacity={0.6} />
      <circle cx={x0 + 6} cy={y} r={3} fill={INK.red} />
    </g>
  );
}

/** Rail-mounted gantry over the track and the truck lane. */
export function GantryTop({ y, x0, x1, label }: { y: number; x0: number; x1: number; label?: string }) {
  return (
    <g>
      <Shadow dx={30} dy={42} opacity={0.12}>
        <rect x={x0} y={y - 14} width={x1 - x0} height={28} />
      </Shadow>
      {[x0, x1 - 12].map((x) => (
        <rect key={x} x={x} y={y - 30} width={12} height={60} fill={INK.navyDark} />
      ))}
      <rect x={x0} y={y - 14} width={x1 - x0} height={6} fill={INK.navy} />
      <rect x={x0} y={y + 8} width={x1 - x0} height={6} fill={INK.navy} />
      {label ? (
        <text
          x={(x0 + x1) / 2}
          y={y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fill={INK.navy}
          fontSize={9}
          fontWeight={800}
          letterSpacing={2}
          style={SANS}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** Trolley riding the crane girders at (x, y). */
export function Trolley({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 16} y={y - 16} width={32} height={32} rx={2} fill={INK.steelDark} />
      <rect x={x - 12} y={y - 12} width={24} height={24} rx={1} fill="#7d8ca3" />
      <circle cx={x} cy={y} r={3} fill={INK.red} />
    </g>
  );
}

// ── Scenery (volumetric) ───────────────────────────────────

/** Tree: trunk height lifts the canopy; shadow falls down-right. */
export function Tree({ x, y, r = 16 }: { x: number; y: number; r?: number }) {
  const H = r * 2.4;
  const [dx, dy] = lift(H, 0);
  return (
    <g>
      <ellipse cx={x + SUN.x * H} cy={y + SUN.y * H} rx={r} ry={r * 0.9} fill={SHADOW} opacity={0.16} />
      <line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke="#6b5a48" strokeWidth={Math.max(2, r * 0.18)} />
      <circle cx={x + dx} cy={y + dy} r={r} fill={INK.treeDark} />
      <circle cx={x + dx - r * 0.22} cy={y + dy - r * 0.22} r={r * 0.72} fill={INK.tree} />
      <circle cx={x + dx - r * 0.4} cy={y + dy - r * 0.42} r={r * 0.32} fill="#b6d3bf" opacity={0.75} />
    </g>
  );
}

/** Flat-roofed building; `height` in world units (3 = 1 ft). */
export function Building({
  x,
  y,
  w,
  h,
  height = 36,
  roof = "#e7ecf2",
  wall = "#c9d3df",
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  height?: number;
  roof?: string;
  wall?: string;
  children?: ReactNode;
}) {
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2})`}>
      <path d={prismShadow(w, h, height)} fill={SHADOW} opacity={0.14} />
      <Box
        w={w}
        h={h}
        H={height}
        color={wall}
        roof={
          <g>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={2} fill={roof} />
            <rect
              x={-w / 2 + 3}
              y={-h / 2 + 3}
              width={w - 6}
              height={h - 6}
              rx={1}
              fill="none"
              stroke="#000"
              strokeOpacity={0.08}
              strokeWidth={2}
            />
            <g transform={`translate(${-x - w / 2} ${-y - h / 2})`}>{children}</g>
          </g>
        }
      />
    </g>
  );
}

/** Container stack block: rows × cols of 40ft boxes, stacked 1–4 high (drawn back to front). */
export function StackBlock({
  x,
  y,
  cols,
  rows,
  seed = 0,
}: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  seed?: number;
}) {
  const stacks = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      stacks.push({ col, row, tier: 1 + ((seed + col * 3 + row * 5) % 4) });
    }
  }
  return (
    <g>
      {stacks.map(({ col, row, tier }) => (
        <path
          key={`s${col}-${row}`}
          transform={`translate(${x + col * 27 + BOX.w / 2} ${y + row * 126 + BOX.h / 2})`}
          d={prismShadow(BOX.w, BOX.h, tier * 26)}
          fill={SHADOW}
          opacity={0.12}
        />
      ))}
      {stacks.map(({ col, row, tier }) => {
        const color = CONTAINER_COLORS[(seed + col * 2 + row * 3 + tier) % CONTAINER_COLORS.length]!;
        return (
          <g
            key={`c${col}-${row}`}
            transform={`translate(${x + col * 27 + BOX.w / 2} ${y + row * 126 + BOX.h / 2})`}
          >
            <Box w={BOX.w} h={BOX.h} H={tier * 26} color={color} roof={<TopContainer color={color} />} />
          </g>
        );
      })}
    </g>
  );
}

/** Street light: a 30 ft pole with its long shadow and the lamp head. */
export function LightPole({ x, y }: { x: number; y: number }) {
  const H = 90;
  const [dx, dy] = lift(H, 0);
  return (
    <g>
      <line
        x1={x}
        y1={y}
        x2={x + SUN.x * H}
        y2={y + SUN.y * H}
        stroke={SHADOW}
        strokeOpacity={0.14}
        strokeWidth={2.5}
      />
      <line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke="#8a99ad" strokeWidth={2.5} />
      <rect x={x + dx - 6} y={y + dy - 2} width={12} height={4} rx={1.5} fill="#5b6b80" />
      <rect x={x + dx - 4} y={y + dy - 1} width={8} height={2} rx={1} fill="#fef9c3" />
    </g>
  );
}

/** Overhead sign gantry spanning a road at y: green panels you can read from above. */
export function SignGantry({
  y,
  x0,
  x1,
  signs,
}: {
  y: number;
  x0: number;
  x1: number;
  signs: { x: number; text: string; sub?: string }[];
}) {
  const H = 60;
  const [dx, dy] = lift(H, 0);
  return (
    <g>
      <rect
        x={x0 + SUN.x * H}
        y={y + SUN.y * H - 3}
        width={x1 - x0}
        height={6}
        fill={SHADOW}
        opacity={0.12}
      />
      {[x0, x1].map((px) => (
        <line key={px} x1={px} y1={y} x2={px + dx} y2={y + dy} stroke="#8a99ad" strokeWidth={3} />
      ))}
      <rect x={x0 + dx} y={y + dy - 3} width={x1 - x0} height={6} fill="#9aa6b6" />
      {signs.map((sign) => (
        <g key={sign.text} transform={`translate(${sign.x + dx} ${y + dy})`}>
          <rect
            x={-46}
            y={-16}
            width={92}
            height={32}
            rx={4}
            fill="#0f6b3a"
            stroke="#fff"
            strokeWidth={1.5}
          />
          <text
            y={sign.sub ? -3 : 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize={10}
            fontWeight={800}
            letterSpacing={0.5}
            style={SANS}
          >
            {sign.text}
          </text>
          {sign.sub ? (
            <text
              y={9}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#dcfce7"
              fontSize={7}
              fontWeight={700}
              style={SANS}
            >
              {sign.sub}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
}
