// Vehicles as true volumes (2.5D, see volume-static.tsx). Real proportions at 3 units/ft.
// Everything faces DOWN (south = direction of travel), so the camera sees fronts.
// Draw order inside each vehicle runs north → south so nearer parts overlap farther ones.
import type { MotionValue } from "motion/react";
import type { ReactNode } from "react";

import { CONTAINER_COLORS, INK } from "../palette";
import { FrontFace, Lifted, SpinBox } from "./volume";
import { Box, lift, SolidShadow } from "./volume-static";
import { TopContainer } from "./pieces";
import { BOX } from "./world";

/** Screen point of local (x, y) at height z (unrotated vehicles). */
const P = (x: number, y: number, z: number) => {
  const [dx, dy] = lift(z, 0);
  return `${(x + dx).toFixed(2)},${(y + dy).toFixed(2)}`;
};
/** A flat quad painted on a south-facing wall at y, spanning x0..x1 and z0..z1. */
const southPanel = (x0: number, x1: number, y: number, z0: number, z1: number) =>
  `M${P(x0, y, z0)} L${P(x1, y, z0)} L${P(x1, y, z1)} L${P(x0, y, z1)} Z`;

type Deg = MotionValue<number> | number | undefined;

/** Box that turns with a rotating parent (MotionValue), or sits at a fixed angle. */
function Solid(props: Omit<Parameters<typeof Box>[0], "deg"> & { deg?: Deg }) {
  const { deg, ...rest } = props;
  return typeof deg === "object" ? <SpinBox {...rest} deg={deg} /> : <Box {...rest} deg={deg ?? 0} />;
}

/** Front-face paint: always for south-facing static vehicles, faded while turning. */
function Front({ deg, children }: { deg?: Deg; children: ReactNode }) {
  if (typeof deg === "object") return <FrontFace deg={deg}>{children}</FrontFace>;
  return deg ? null : <>{children}</>;
}

// ── Container ──────────────────────────────────────────────

export const CONTAINER_H = 26; // 8.5 ft

export function Container3D({
  color = INK.cyan,
  label,
  z0 = 0,
  deg,
}: {
  color?: string;
  label?: string;
  z0?: number;
  deg?: Deg;
}) {
  return (
    <Solid
      w={BOX.w}
      h={BOX.h}
      H={CONTAINER_H}
      z0={z0}
      color={color}
      deg={deg}
      roof={<TopContainer color={color} label={label} />}
    />
  );
}

// ── Tractor-trailer ────────────────────────────────────────
// Origin: centre of the 40ft cargo slot. Chassis deck at 4 ft (z 12).

export const CHASSIS_DECK = 12;
const CABS = {
  brand: { body: "#f4f7fa", trim: INK.navy, stripe: INK.cyan, roof: "url(#aw-fairing)" },
  navy: { body: "#22305c", trim: "#0b1226", stripe: INK.cyan, roof: "#2a3a6e" },
  steel: { body: "#7b8ea9", trim: "#33425a", stripe: "#e2e8f0", roof: "#93a4bc" },
} as const;
export type Cab = keyof typeof CABS;

function Tyres({ y, x = 12.5, deg }: { y: number; x?: number; deg?: Deg }) {
  return (
    <>
      {[-x, x].map((tx) => (
        <g key={tx} transform={`translate(${tx} ${y})`}>
          <Solid
            w={6}
            h={12}
            H={10}
            color="#161c28"
            deg={deg}
            roof={<rect x={-3} y={-6} width={6} height={12} rx={2} fill="#2a3240" />}
          />
        </g>
      ))}
    </>
  );
}

export function Truck3D({
  cab = "brand",
  load,
  deg,
  empty = true,
  shadow = true,
}: {
  cab?: Cab;
  load?: ReactNode;
  deg?: Deg;
  empty?: boolean;
  /** Turning trucks draw a world-aligned shadow outside their rotating group instead. */
  shadow?: boolean;
}) {
  const c = CABS[cab];
  return (
    <g>
      {shadow ? (
        <SolidShadow w={26} h={194} H={30} opacity={0.2} deg={typeof deg === "number" ? deg : 0} />
      ) : null}
      {/* chassis: rear tandem, frame, landing gear */}
      <Tyres y={-52} deg={deg} />
      <Tyres y={-38} deg={deg} />
      <Solid
        w={22}
        h={128}
        H={3}
        z0={8}
        color="#273041"
        deg={deg}
        roof={
          <g>
            <rect x={-11} y={-64} width={22} height={128} fill="#273041" />
            {empty
              ? [-58, -40, -20, 0, 20, 40, 58].map((y) => (
                  <rect key={y} x={-11} y={y - 1} width={22} height={2} fill="#3b4658" />
                ))
              : null}
            {empty
              ? [
                  [-11, -63],
                  [8.5, -63],
                  [-11, 60.5],
                  [8.5, 60.5],
                ].map(([x, y]) => (
                  <rect key={`${x}${y}`} x={x} y={y} width={2.5} height={2.5} fill="#f2c94c" />
                ))
              : null}
            <rect x={-11} y={-64} width={4} height={2} fill={INK.red} />
            <rect x={7} y={-64} width={4} height={2} fill={INK.red} />
          </g>
        }
      />
      {load}
      {/* tractor: drive tandem, tanks, stacks */}
      <Tyres y={51} x={13} deg={deg} />
      <Tyres y={64} x={13} deg={deg} />
      {[-13.3, 13.3].map((x) => (
        <g key={x} transform={`translate(${x} 82)`}>
          <Solid
            w={4.5}
            h={18}
            H={6}
            z0={5}
            color="#aab4c2"
            side="#c9d1dc"
            deg={deg}
            roof={<rect x={-2.25} y={-9} width={4.5} height={18} rx={2.2} fill="url(#aw-chrome)" />}
          />
        </g>
      ))}
      {[-10.5, 10.5].map((x) => (
        <g key={x} transform={`translate(${x} 64)`}>
          <Solid
            w={2.6}
            h={2.6}
            H={36}
            z0={6}
            color="#b9c3cf"
            deg={deg}
            roof={<circle r={1.5} fill="#2b3446" />}
          />
        </g>
      ))}
      {/* sleeper + cab (13.5 ft roof with aero fairing) */}
      <g transform="translate(0 84)">
        <Solid
          w={25}
          h={40}
          H={36}
          z0={5}
          color={c.body}
          deg={deg}
          roof={
            <g>
              <rect x={-12.5} y={-20} width={25} height={40} rx={4} fill={c.roof} />
              <path d="M-9,-17 h6 v26 h-6 Z" fill="#fff" opacity={0.5} />
              <rect x={-12.5} y={-6} width={2} height={18} fill={c.stripe} />
              <rect x={10.5} y={-6} width={2} height={18} fill={c.stripe} />
              <rect x={-10} y={13} width={20} height={6} rx={1} fill={c.trim} opacity={0.85} />
            </g>
          }
        />
      </g>
      <Front deg={deg}>
        {/* windscreen + cab stripe on the front (south) face */}
        <path d={southPanel(-10.5, 10.5, 104, 26, 37)} fill="url(#aw-glass)" />
        <path d={southPanel(-0.4, 0.4, 104, 26, 37)} fill={c.trim} />
        <path d={southPanel(-12.5, 12.5, 104, 18, 20.5)} fill={c.stripe} />
      </Front>
      {/* door mirrors */}
      {[-16.5, 16.5].map((x) => (
        <g key={x} transform={`translate(${x} 101)`}>
          <Solid w={2.4} h={4} H={6} z0={24} color="#2b3446" deg={deg} />
        </g>
      ))}
      {/* steer axle + long hood (6 ft) with grille and bumper */}
      <Tyres y={112} deg={deg} />
      <g transform="translate(0 115.5)">
        <Solid
          w={21}
          h={23}
          H={13}
          z0={5}
          color={c.body}
          deg={deg}
          roof={
            <g>
              <path d="M-10.5,-11.5 h21 l-1.2,21 q-0.3,2 -2.3,2 h-14 q-2,0 -2.3,-2 Z" fill={c.body} />
              <path d="M0,-10 V9" stroke="#000" strokeOpacity={0.12} strokeWidth={0.8} />
              <path d="M-8,-10 h3.5 l-0.8,18 h-2.2 Z" fill="#fff" opacity={0.55} />
            </g>
          }
        />
      </g>
      <Front deg={deg}>
        <>
          <path d={southPanel(-6.5, 6.5, 127, 7, 16)} fill="url(#aw-chrome)" />
          <path d={southPanel(-6.5, 6.5, 127, 9, 14)} fill="url(#aw-grille)" opacity={0.8} />
          <path d={southPanel(-10, -7.5, 127, 11, 13.5)} fill="#fef3c7" />
          <path d={southPanel(7.5, 10, 127, 11, 13.5)} fill="#fef3c7" />
          <path d={southPanel(-11, 11, 127.5, 4, 7)} fill="url(#aw-chrome)" />
        </>
      </Front>
    </g>
  );
}

/** Full truckload: 53' dry van (13 ft). */
export function DryVan3D({ label }: { label: string }) {
  return (
    <Solid
      w={26}
      h={134}
      H={30}
      z0={CHASSIS_DECK}
      color="#eef2f7"
      roof={
        <g>
          <rect x={-13} y={-67} width={26} height={134} rx={1.5} fill="#f6f8fb" />
          <rect x={-13} y={-67} width={26} height={134} fill="url(#aw-ribs)" opacity={0.5} />
          <text
            transform="rotate(-90)"
            textAnchor="middle"
            dominantBaseline="central"
            fill={INK.navy}
            fontSize={11}
            fontWeight={800}
            letterSpacing={2}
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {label}
          </text>
        </g>
      }
    />
  );
}

/** Less-than-truckload: mixed pallets on a flatbed. */
export function Pallets3D({ label }: { label: string }) {
  const loads = [
    { y: -46, h: 22, H: 14, c: "#d6b07a" },
    { y: -18, h: 20, H: 10, c: "#c79f68" },
    { y: 10, h: 24, H: 17, c: "#dcbb88" },
    { y: 40, h: 18, H: 12, c: "#cda46d" },
  ];
  return (
    <g>
      <Solid w={26} h={128} H={3} z0={9} color="#7b6a58" />
      {loads.map((p) => (
        <g key={p.y} transform={`translate(0 ${p.y})`}>
          <Solid
            w={20}
            h={p.h}
            H={p.H}
            z0={12}
            color={p.c}
            roof={
              <g>
                <rect x={-10} y={-p.h / 2} width={20} height={p.h} rx={1} fill={p.c} />
                <line x1={-10} x2={10} y1={0} y2={0} stroke={INK.navy} strokeWidth={1.4} />
              </g>
            }
          />
        </g>
      ))}
      <g transform="translate(0 -30)">
        <Solid
          w={22}
          h={12}
          H={2}
          z0={30}
          color={INK.navy}
          roof={
            <g>
              <rect x={-11} y={-6} width={22} height={12} rx={2} fill={INK.navy} />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={8}
                fontWeight={800}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {label}
              </text>
            </g>
          }
        />
      </g>
    </g>
  );
}

// ── Rail ───────────────────────────────────────────────────

export const WELL_LOWER = 5; // container floor in the well
export const WELL_UPPER = WELL_LOWER + CONTAINER_H; // double-stack upper tier

export function WellCar3D({ lower, upper }: { lower?: string; upper?: ReactNode }) {
  return (
    <g>
      <SolidShadow w={30} h={144} H={upper ? 57 : 31} opacity={0.2} />
      {[-58, 58].map((y) => (
        <g key={y} transform={`translate(0 ${y})`}>
          <Solid w={34} h={24} H={7} color="#141a26" />
        </g>
      ))}
      <Solid
        w={30}
        h={144}
        H={8}
        z0={3}
        color="#2f3949"
        roof={
          <g>
            <rect x={-15} y={-72} width={30} height={144} rx={2} fill="#2f3949" />
            <rect x={-13.5} y={-66} width={27} height={132} fill="#1b2230" />
            <rect x={-15} y={-72} width={30} height={7} fill="#4b586e" />
            <rect x={-15} y={65} width={30} height={7} fill="#4b586e" />
          </g>
        }
      />
      {lower ? <Container3D color={lower} z0={WELL_LOWER} /> : null}
      {upper}
      <rect x={-3} y={71} width={6} height={9} fill="#2b3446" />
    </g>
  );
}

export function Locomotive3D({ deg = 0 }: { deg?: number }) {
  return (
    <g>
      <SolidShadow w={32} h={160} H={44} opacity={0.22} deg={deg} />
      {[-58, 58].map((y) => (
        <g key={y} transform={`translate(0 ${y})`}>
          <Solid deg={deg} w={34} h={30} H={9} color="#141a26" />
        </g>
      ))}
      <Solid deg={deg} w={32} h={160} H={4} z0={8} color="#9aa6b6" />
      <Solid
        deg={deg}
        w={26}
        h={154}
        H={36}
        z0={12}
        color="#1f2b55"
        side="#2a3a6e"
        roof={
          <g>
            <rect x={-13} y={-77} width={26} height={154} rx={3} fill="url(#aw-loco)" />
            {[-60, -42].map((y) => (
              <g key={y}>
                <circle cx={0} cy={y} r={8.5} fill="url(#aw-fan)" />
                <circle cx={0} cy={y} r={8.5} fill="none" stroke="#6b7fb3" strokeWidth={1} />
                <path
                  d={`M-6,${y} h12 M0,${y - 6} v12 M-4.2,${y - 4.2} l8.4,8.4 M4.2,${y - 4.2} l-8.4,8.4`}
                  stroke="#6b7fb3"
                  strokeWidth={0.7}
                />
              </g>
            ))}
            <rect x={-9} y={-26} width={18} height={20} rx={1} fill="url(#aw-grille)" />
            <rect x={-3} y={-1} width={6} height={9} rx={1} fill="#0b1226" />
            <rect x={-13} y={18} width={26} height={4} fill={INK.cyan} />
            <rect x={-8} y={46} width={16} height={10} rx={1.5} fill="#8a99ad" />
          </g>
        }
      />
      <Front deg={deg}>
        <path d={southPanel(-11, 11, 77, 32, 42)} fill="url(#aw-glass)" />
        <path d={southPanel(-13, 13, 77, 18, 22)} fill={INK.cyan} />
        <path d={southPanel(-9, -6, 77, 14, 16)} fill="#fef3c7" />
        <path d={southPanel(6, 9, 77, 14, 16)} fill="#fef3c7" />
      </Front>
    </g>
  );
}

// ── Container ship ─────────────────────────────────────────
// Origin: ship centre; bow points down (`up` mirrors it for northbound traffic).

export const SHIP_ROWS = 6;
export const SHIP_BAYS = 4;
export const DECK = 36; // freeboard, 12 ft
export const shipBay = (j: number) => -185 + j * 125;
export const shipRow = (i: number) => (i - (SHIP_ROWS - 1) / 2) * 25;
const HULL =
  "M-78,-352 Q-80,-362 -66,-362 H66 Q80,-362 78,-352 L80,230 Q80,292 22,348 Q0,366 -22,348 Q-80,292 -80,230 Z";

export function ShipSilhouette() {
  return <path d={HULL} />;
}

export function Ship3D({
  ours,
  heading = "down",
  deg,
}: {
  ours?: ReactNode;
  heading?: "down" | "up";
  /** Turning angle (MotionValue) for a ship that can come about; static otherwise. */
  deg?: MotionValue<number>;
}) {
  const f = heading === "up" ? -1 : 1;
  const [dx, dy] = lift(DECK, 0);
  const flip = heading === "up" ? "scale(1 -1)" : undefined;
  const bays = Array.from({ length: SHIP_BAYS }, (_, j) => j);
  const ordered = heading === "up" ? [...bays].reverse() : bays;

  const superstructure = (
    <g key="house" transform={`translate(0 ${-305 * f})`}>
      <Solid
        deg={deg}
        w={124}
        h={66}
        H={120}
        z0={DECK}
        color="#eef2f7"
        roof={
          <g transform={flip}>
            <rect x={-62} y={-33} width={124} height={66} rx={3} fill="#f7f9fc" />
            <rect x={-48} y={-25} width={96} height={44} rx={2} fill="#ffffff" stroke="#d5dde8" />
            <rect x={-2} y={-22} width={4} height={30} fill="#8a99ad" />
            <rect x={-12} y={-6} width={24} height={3} rx={1} fill="#5b6b80" />
          </g>
        }
      />
      <g transform={`translate(0 ${30 * f})`}>
        <Solid deg={deg} w={184} h={12} H={10} z0={DECK + 110} color="#f4f7fb" />
      </g>
      <g transform={`translate(0 ${-26 * f})`}>
        <Solid
          deg={deg}
          w={28}
          h={20}
          H={34}
          z0={DECK + 120}
          color={INK.navy}
          roof={
            <g>
              <rect x={-14} y={-10} width={28} height={20} rx={3} fill={INK.navy} />
              <rect x={-14} y={-3} width={28} height={5} fill={INK.cyan} />
              <ellipse rx={7} ry={3} fill="#0b1226" />
            </g>
          }
        />
      </g>
      <g transform={`translate(58 ${-24 * f})`}>
        <Solid deg={deg} w={11} h={24} H={10} z0={DECK + 20} color="#f97316" />
      </g>
    </g>
  );

  const bayStacks = (j: number) => (
    <g key={j}>
      {Array.from({ length: SHIP_ROWS }, (_, i) => {
        const x = shipRow(i);
        const y = shipBay(j) * f;
        if (ours && i === 5 && j === 1) {
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              {ours}
            </g>
          );
        }
        if ((i * 7 + j * 5) % 11 === 3) return null;
        const tiers = 1 + ((i * 3 + j * 2) % 3);
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <Solid
              deg={deg}
              w={BOX.w}
              h={BOX.h}
              H={CONTAINER_H * tiers}
              z0={DECK}
              color={CONTAINER_COLORS[(i * 3 + j * 5) % CONTAINER_COLORS.length]!}
              roof={<TopContainer color={CONTAINER_COLORS[(i * 3 + j * 5) % CONTAINER_COLORS.length]} />}
            />
          </g>
        );
      })}
    </g>
  );

  return (
    <g>
      {/* hull: waterline copy peeks out below the deck copy as the ship's side */}
      <g transform={flip}>
        <path d={HULL} fill="#0f1631" />
        <DeckLevel deg={deg} shift={[dx, dy * f]}>
          <path d={HULL} fill="url(#aw-deck)" />
          <path d={HULL} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={1.8} />
          <path d="M-62,262 H62 Q58,298 20,330 Q0,344 -20,330 Q-58,298 -62,262 Z" fill="#6b7990" />
          <path d="M-66,246 Q0,214 66,246" stroke="#c9d3df" strokeWidth={5} fill="none" />
          {[
            [-24, 282],
            [24, 282],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={5.5} fill="#3f4d63" />
          ))}
          {bays.map((j) => (
            <g key={j}>
              <rect x={-72} y={shipBay(j) - 63} width={144} height={126} fill="#56657d" />
              <rect x={-74} y={shipBay(j) + 63} width={148} height={4} fill="#c9d3df" />
            </g>
          ))}
        </DeckLevel>
      </g>
      {heading === "down" ? superstructure : null}
      {ordered.map(bayStacks)}
      {heading === "up" ? superstructure : null}
    </g>
  );
}

/** Deck-height shift for the hull's deck copy: static, or re-solved as the ship turns. */
function DeckLevel({
  deg,
  shift,
  children,
}: {
  deg?: MotionValue<number>;
  shift: [number, number];
  children: ReactNode;
}) {
  if (deg)
    return (
      <Lifted z={DECK} deg={deg}>
        {children}
      </Lifted>
    );
  return <g transform={`translate(${shift[0]} ${shift[1]})`}>{children}</g>;
}

// ── Cars ───────────────────────────────────────────────────

export function Car3D({ color, deg = 0 }: { color: string; deg?: number }) {
  return (
    <g>
      <SolidShadow w={16} h={36} H={14} opacity={0.2} deg={deg} />
      <Box
        w={16}
        h={36}
        H={8}
        z0={2}
        deg={deg}
        color={color}
        rx={5}
        roof={<rect x={-8} y={-18} width={16} height={36} rx={5} fill={color} />}
      />
      <g transform="translate(0 1)">
        <Box
          w={13}
          h={17}
          H={6}
          z0={10}
          deg={deg}
          color="#3b4658"
          roof={<rect x={-6.5} y={-8.5} width={13} height={17} rx={3} fill="#4b586e" />}
        />
      </g>
    </g>
  );
}
