"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { ReactNode } from "react";

import { usePrefersReducedMotion } from "../use-media-query";
import { CONTAINER_COLORS, INK } from "../palette";
import { GantryTop, PlaneSilhouette, QuayCraneTop, TopContainer, TopPlane, Trolley } from "./pieces";
import { LiftBox } from "./volume";
import { Box, lift, SUN } from "./volume-static";
import {
  Car3D,
  CHASSIS_DECK,
  Container3D,
  CONTAINER_H,
  DECK,
  DryVan3D,
  Locomotive3D,
  Pallets3D,
  Ship3D,
  ShipSilhouette,
  Truck3D,
  WELL_UPPER,
  WellCar3D,
  type Cab,
} from "./vehicles3d";
import {
  BORDER_Y,
  BOX,
  CAR_PITCH,
  CRANES_Y,
  DC,
  DOCK_Y,
  ease,
  EXPORT,
  follow,
  GATE_Y,
  HIGHWAY,
  LANE_X,
  lerp,
  progress,
  PULL,
  RAMP_1,
  RAMP_2,
  SHIP_BERTH,
  SHIP_SLOT,
  SHIP_START,
  SHIP_X,
  T,
  TRACK_X,
  WORLD,
  YARD,
} from "./world";

const PICK_X = SHIP_X + SHIP_SLOT.dx;
const PICK_Y = SHIP_BERTH + SHIP_SLOT.dy;
const HOOK = 110; // how high a crane carries a box mid-move (≈ 37 ft)
const STS_TROLLEY_Z = 150; // quay crane trolley height (≈ 50 ft)
const RMG_TROLLEY_Z = 100;
const DOCK_APPROACH = T.dock[0] + 60;
// Trucks pivot on their cargo centre, so a box keeps its place while a truck turns.
const DOCKED = { x: 785, y: DOCK_Y };

/** A vehicle that waits at `stop` until `go`, pulls away to `hold.at`, dwells there while c
 *  advances `hold.for` (a gate / border check), then pulls away again to `until`. */
function followHold(c: number, stop: number, go: number, hold: { at: number; for: number }, until: number) {
  const arrive = Math.max(hold.at, go + (hold.at - stop) / PULL);
  if (c < arrive) return follow(c, stop, go, hold.at);
  if (c < arrive + hold.for) return hold.at;
  return follow(c, hold.at, arrive + hold.for, until);
}
const GATE_HOLD = { at: GATE_Y - 115, for: 110 };
const BORDER_HOLD = { at: BORDER_Y - 95, for: 100 };
const gateArrive = Math.max(GATE_HOLD.at, T.lift1[1] + (GATE_HOLD.at - PICK_Y) / PULL);

const ship = (c: number) => follow(c, SHIP_START, -1e9, SHIP_BERTH);
const truck1 = (c: number) => followHold(c, PICK_Y, T.lift1[1], GATE_HOLD, RAMP_1);
const train = (c: number) => follow(c, RAMP_1, T.lift2[1], RAMP_2);
const truck2 = (c: number) => {
  const d = ease(progress(c, T.dock));
  if (d <= 0)
    return {
      x: LANE_X,
      y: followHold(c, RAMP_2, T.lift3[1], BORDER_HOLD, DOCK_APPROACH),
      rot: 0,
      docking: false,
    };
  return { x: lerp(LANE_X, DOCKED.x, d), y: lerp(DOCK_APPROACH, DOCKED.y, d), rot: 90 * d, docking: true };
};

type Phase = "ship" | "lift1" | "truck1" | "lift2" | "train" | "lift3" | "truck2";
function phase(c: number): Phase {
  if (c < T.lift1[0]) return "ship";
  if (c < T.lift1[1]) return "lift1";
  if (c < T.lift2[0]) return "truck1";
  if (c < T.lift2[1]) return "lift2";
  if (c < T.lift3[0]) return "train";
  if (c < T.lift3[1]) return "lift3";
  return "truck2";
}

/** Our container while on a crane hook: from one carrier's deck to the next. */
function hook(c: number) {
  const move = (
    range: readonly [number, number],
    x0: number,
    x1: number,
    y: number,
    z0: number,
    z1: number,
    craneZ: number,
  ) => {
    const t = ease(progress(c, range));
    return { x: lerp(x0, x1, t), y, z: lerp(z0, z1, t) + Math.sin(Math.PI * t) * HOOK, craneZ };
  };
  if (c < T.lift1[1]) return move(T.lift1, PICK_X, LANE_X, PICK_Y, DECK, CHASSIS_DECK, STS_TROLLEY_Z);
  if (c < T.lift2[1]) return move(T.lift2, LANE_X, TRACK_X, RAMP_1, CHASSIS_DECK, WELL_UPPER, RMG_TROLLEY_Z);
  return move(T.lift3, TRACK_X, LANE_X, RAMP_2, WELL_UPPER, CHASSIS_DECK, RMG_TROLLEY_Z);
}

// Export truck (port-to-port): highway west lane → branch → export quay crane.
const ROUTE: [number, number][] = [
  [700, 6040],
  [700, EXPORT.split],
  [EXPORT.laneX, EXPORT.split + 160],
  [EXPORT.laneX, EXPORT.craneY],
];
const SEGMENTS = ROUTE.slice(1).map(([x, y], i) => {
  const [px, py] = ROUTE[i]!;
  return { x0: px, y0: py, dx: x - px, dy: y - py, len: Math.hypot(x - px, y - py) };
});
const ROUTE_LEN = SEGMENTS.reduce((sum, s) => sum + s.len, 0);
function along(s: number) {
  let rest = Math.min(ROUTE_LEN, Math.max(0, s));
  for (const seg of SEGMENTS) {
    if (rest <= seg.len)
      return { x: seg.x0 + (seg.dx * rest) / seg.len, y: seg.y0 + (seg.dy * rest) / seg.len };
    rest -= seg.len;
  }
  const last = ROUTE[ROUTE.length - 1]!;
  return { x: last[0], y: last[1] };
}
const exportS = (c: number) => Math.min(ROUTE_LEN, Math.max(0, (c - 5950) * 1.25));
function exportTruck(c: number) {
  const s = exportS(c);
  const a = along(s - 25);
  const b = along(s + 25);
  const heading = b.y === a.y && b.x === a.x ? 0 : (Math.atan2(-(b.x - a.x), b.y - a.y) * 180) / Math.PI;
  return { ...along(s), heading };
}

/** Background traffic loops along a stretch using scroll distance travelled (never c),
 *  so it always moves forward — scrolling up never makes it reverse. */
const loop = (odo: number, from: number, span: number, rate: number, offset: number) =>
  from + ((((odo * rate + offset) % span) + span) % span);
const edgeFade = (y: number, from: number, span: number) =>
  Math.min(1, Math.max(0, (y - from) / 60), Math.max(0, (from + span - y) / 60));

/** Spring-smoothed heading: 0 = facing south (down the page), 180 = turned around. */
function useHeading() {
  const target = useMotionValue(0);
  const angle = useSpring(target, { stiffness: 80, damping: 17, restDelta: 0.05 });
  return { target, angle };
}

/** Hoist cable endpoint (screen) for one side of the spreader. */
function cableEnd(c: number, side: -1 | 1, end: "trolley" | "box") {
  const h = hook(c);
  const [lx, ly] = lift(end === "trolley" ? h.craneZ : h.z + CONTAINER_H, 0);
  return { x: h.x + lx + side * 7, y: h.y + ly };
}

export function AerialActors({ c }: { c: MotionValue<number> }) {
  const reduce = usePrefersReducedMotion();

  // ── Headings: each story vehicle faces the way it is actually moving ──
  const shipH = useHeading();
  const t1H = useHeading();
  const t2H = useHeading();
  const exH = useHeading();
  const odo = useMotionValue(0);
  useMotionValueEvent(c, "change", (v) => {
    const prev = c.getPrevious() ?? v;
    const delta = v - prev;
    if (Math.abs(delta) < 1e-6) return;
    odo.set(odo.get() + Math.min(400, Math.abs(delta)));
    const face = (h: ReturnType<typeof useHeading>, now: number, before: number) => {
      if (Math.abs(now - before) > 0.02) h.target.set(now > before ? 0 : 180);
    };
    face(shipH, ship(v), ship(prev));
    face(t1H, truck1(v), truck1(prev));
    if (!truck2(v).docking) face(t2H, truck2(v).y, truck2(prev).y);
    face(exH, exportS(v), exportS(prev));
    if (reduce) [shipH, t1H, t2H, exH].forEach((h) => h.angle.jump(h.target.get()));
  });

  // Ship + wake
  const shipY = useTransform(c, ship);
  const shipShadowY = useTransform(shipY, (y) => y + 30);
  const wake = useTransform(c, (v) => Math.min(1, Math.max(0, (SHIP_BERTH - 40 - v) / 160)));

  // Carriers
  const t1 = useTransform(c, truck1);
  const trainY = useTransform(c, train);
  const t2x = useTransform(c, (v) => truck2(v).x);
  const t2y = useTransform(c, (v) => truck2(v).y);
  const t2dock = useTransform(c, (v) => truck2(v).rot);
  const t2r = useTransform([t2dock, t2H.angle], ([d, h]: number[]) => d! + h!);
  const exX = useTransform(c, (v) => exportTruck(v).x);
  const exY = useTransform(c, (v) => exportTruck(v).y);
  const exPath = useTransform(c, (v) => exportTruck(v).heading);
  const exR = useTransform([exPath, exH.angle], ([p, h]: number[]) => p! + h!);

  // Exactly one copy of our container is shown: on a carrier, or on the hook.
  const on =
    (p: Phase) =>
    (v: number): number =>
      phase(v) === p ? 1 : 0;
  const onShip = useTransform(c, on("ship"));
  const onTruck1 = useTransform(c, on("truck1"));
  const onTrain = useTransform(c, on("train"));
  const onTruck2 = useTransform(c, on("truck2"));
  const onHook = useTransform(c, (v): number => (phase(v).startsWith("lift") ? 1 : 0));
  const hx = useTransform(c, (v) => hook(v).x);
  const hy = useTransform(c, (v) => hook(v).y);
  const hz = useTransform(c, (v) => hook(v).z);
  const hShadowX = useTransform([hx, hz], ([x, z]: number[]) => x! + SUN.x * (z! + CONTAINER_H / 2));
  const hShadowY = useTransform([hy, hz], ([y, z]: number[]) => y! + SUN.y * (z! + CONTAINER_H / 2));
  const hShadowO = useTransform(hz, (z) => Math.max(0.08, 0.24 - z * 0.0012));
  // Hoist cables: trolley (up on the crane) → spreader on the box roof.
  const lx1 = useTransform(c, (v) => cableEnd(v, -1, "trolley").x);
  const ly1 = useTransform(c, (v) => cableEnd(v, -1, "trolley").y);
  const lx2 = useTransform(c, (v) => cableEnd(v, -1, "box").x);
  const ly2 = useTransform(c, (v) => cableEnd(v, -1, "box").y);
  const rx1 = useTransform(c, (v) => cableEnd(v, 1, "trolley").x);
  const rx2 = useTransform(c, (v) => cableEnd(v, 1, "box").x);

  // Crane trolleys follow the box while it is on the hook.
  const trolley1 = useTransform(c, (v) => (v < T.lift1[0] ? PICK_X : v < T.lift1[1] ? hook(v).x : LANE_X));
  const trolley2 = useTransform(c, (v) => (v < T.lift2[0] ? LANE_X : v < T.lift2[1] ? hook(v).x : TRACK_X));
  const trolley3 = useTransform(c, (v) => (v < T.lift3[0] ? TRACK_X : v < T.lift3[1] ? hook(v).x : LANE_X));

  // Gate: the truck stops at the barrier, it lifts, the truck pulls through, it drops.
  const barrier = useTransform(c, (v) => {
    const opening = Math.min(1, Math.max(0, (v - gateArrive - 30) / 50));
    const closing = Math.min(1, Math.max(0, (gateArrive + GATE_HOLD.for + 260 - v) / 60));
    return -82 * Math.min(opening, closing);
  });

  // ── Background traffic (always forward) ──
  const planeY = useTransform(odo, (o) => loop(o, -700, 3000, 2.15, 180));
  const planeX = useTransform(planeY, (y) => 930 - (y + 700) * 0.05);
  const planeShadowX = useTransform(planeX, (x) => x + 170);
  const planeShadowY = useTransform(planeY, (y) => y + 230);
  const outbound = useTransform(odo, (o) => 1350 - loop(o, 0, 1700, 0.42, 100));
  const outboundO = useTransform(outbound, (y) => edgeFade(y, -350, 1700));
  const HW = { from: HIGHWAY.from + 40, span: BORDER_Y - 200 - HIGHWAY.from };
  const ftlY = useTransform(odo, (o) => loop(o, HW.from, HW.span, 0.55, 160));
  const ltlY = useTransform(odo, (o) => loop(o, HW.from, HW.span, 0.6, 420));
  const carY = useTransform(ltlY, (y) => y - 150);
  const car2Y = useTransform(ftlY, (y) => y - 160);
  const ftlO = useTransform(ftlY, (y) => edgeFade(y, HW.from, HW.span));
  const ltlO = useTransform(ltlY, (y) => edgeFade(y, HW.from, HW.span));
  const carO = useTransform(carY, (y) => edgeFade(y, HW.from, HW.span));
  const car2O = useTransform(car2Y, (y) => edgeFade(y, HW.from, HW.span));
  const FARM = { from: 3600, span: 1950 };
  const farmSouth = useTransform(odo, (o) => loop(o, FARM.from, FARM.span, 0.42, 0));
  const farmCar = useTransform(odo, (o) => loop(o, FARM.from, FARM.span, 0.52, 900));
  const farmNorth = useTransform(odo, (o) => FARM.from + FARM.span - loop(o, 0, FARM.span, 0.38, 500));
  const farmNorthCar = useTransform(odo, (o) => FARM.from + FARM.span - loop(o, 0, FARM.span, 0.5, 1300));
  const fade = (y: number) => edgeFade(y, FARM.from, FARM.span);
  const farmSouthO = useTransform(farmSouth, fade);
  const farmCarO = useTransform(farmCar, fade);
  const farmNorthO = useTransform(farmNorth, fade);
  const farmNorthCarO = useTransform(farmNorthCar, fade);

  const delivered = useTransform(c, (v) => Math.min(1, Math.max(0, (v - T.delivered) / 80)));
  const deliveredScale = useTransform(delivered, (d) => 0.6 + d * 0.4);

  const ours = (opacity: MotionValue<number>, z0: number, deg?: MotionValue<number>) => (
    <motion.g style={{ opacity }}>
      <Container3D label="DRAY-WORLD" z0={z0} deg={deg} />
    </motion.g>
  );

  return (
    <svg
      viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
      className="absolute inset-0 block h-full w-full overflow-visible"
      role="img"
      aria-label="Aerial journey: a container ship arrives from a global origin; a quay crane lifts the DRAY-WORLD container onto a truck chassis; the truck checks out at the terminal gate and drives through the container yard to an intermodal ramp; a gantry lifts the box onto a double-stack train, which crosses a river to an inland ramp; it returns to a truck, runs the highway alongside full-truckload and less-than-truckload freight, stops at the USA–Canada border booth and backs into a distribution centre (door to door), while a second DRAY-WORLD truck takes the branch to an export terminal (port to port)."
    >
      {/* ── Ocean ── */}
      <motion.g style={{ x: 180, y: outbound, opacity: outboundO }}>
        <g transform="scale(0.62)">
          <path
            d={SHIP_OUTLINE_UP}
            fill="#0b1a33"
            opacity={0.25}
            filter="url(#aw-soft)"
            transform="translate(16 24)"
          />
          <Ship3D heading="up" />
        </g>
      </motion.g>
      <motion.g style={{ x: planeShadowX, y: planeShadowY }}>
        <g transform="scale(0.8)" opacity={0.16} fill="#0b1a33" filter="url(#aw-soft)">
          <PlaneSilhouette />
        </g>
      </motion.g>

      {/* our ship: world-aligned shadow, then the hull turning with its heading */}
      <motion.g style={{ x: SHIP_X + 22, y: shipShadowY }}>
        <motion.g style={{ rotate: shipH.angle }}>
          <rect x={-270} y={-830} width={540} height={1660} fill="none" />
          <g opacity={0.3} fill="#0b1a33" filter="url(#aw-soft)">
            <ShipSilhouette />
          </g>
        </motion.g>
      </motion.g>
      <motion.g style={{ x: SHIP_X, y: shipY }}>
        <motion.g style={{ rotate: shipH.angle }}>
          <rect x={-270} y={-830} width={540} height={1660} fill="none" />
          <motion.g style={{ opacity: wake }}>
            {/* propeller wash + diverging wake astern, bow wave ahead */}
            <path d="M-46,-362 L-130,-820 L130,-820 L46,-362 Z" fill="url(#aw-foam)" opacity={0.9} />
            <path
              d="M-30,-362 C-36,-520 -20,-640 -10,-800 L10,-800 C20,-640 36,-520 30,-362 Z"
              fill="#fff"
              opacity={0.22}
            />
            <path
              d="M-70,-330 Q-150,-560 -260,-820 M70,-330 Q150,-560 260,-820"
              stroke="#fff"
              strokeOpacity={0.45}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M-84,250 Q-60,330 0,378 Q60,330 84,250"
              stroke="#fff"
              strokeOpacity={0.7}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
            />
          </motion.g>
          <Ship3D ours={ours(onShip, DECK, shipH.angle)} deg={shipH.angle} />
        </motion.g>
      </motion.g>

      {/* ── Rail: locomotives at both ends (distributed power), so it runs either way ── */}
      <motion.g style={{ x: TRACK_X, y: trainY }}>
        <g transform={`translate(0 ${-4 * CAR_PITCH - 6}) rotate(180)`}>
          <Locomotive3D deg={180} />
        </g>
        {[-3, -2, -1].map((i) => (
          <g key={i} transform={`translate(0 ${i * CAR_PITCH})`}>
            <WellCar3D
              lower={CONTAINER_COLORS[(i + 7) % CONTAINER_COLORS.length]}
              upper={
                <Container3D color={CONTAINER_COLORS[(i + 9) % CONTAINER_COLORS.length]} z0={WELL_UPPER} />
              }
            />
          </g>
        ))}
        <WellCar3D lower="#6b7c93" upper={ours(onTrain, WELL_UPPER)} />
        <g transform={`translate(0 ${CAR_PITCH + 6})`}>
          <Locomotive3D />
        </g>
      </motion.g>

      {/* ── Roads: background traffic ── */}
      <Rig x={945} y={farmSouth} opacity={farmSouthO} cab="navy" load={<DryVan3D label="FTL" />} />
      <motion.g style={{ x: 985, y: farmCar, opacity: farmCarO }}>
        <Car3D color="#c8d3e0" />
      </motion.g>
      <motion.g style={{ x: 1025, y: farmNorthCar, opacity: farmNorthCarO }}>
        <g transform="rotate(180)">
          <Car3D color="#9a4d63" deg={180} />
        </g>
      </motion.g>
      <Rig
        x={1025}
        y={farmNorth}
        opacity={farmNorthO}
        cab="steel"
        north
        load={<Container3D color="#b45a3c" z0={CHASSIS_DECK} deg={180} />}
      />

      <Rig x={880} y={ftlY} opacity={ftlO} cab="navy" load={<DryVan3D label="FTL" />} />
      <motion.g style={{ x: 880, y: car2Y, opacity: car2O }}>
        <Car3D color="#e2e8f0" />
      </motion.g>
      <Rig x={820} y={ltlY} opacity={ltlO} cab="steel" load={<Pallets3D label="LTL" />} />
      <motion.g style={{ x: 820, y: carY, opacity: carO }}>
        <Car3D color="#64748b" />
      </motion.g>

      {/* ── Our trucks and the export truck (turning with their heading) ── */}
      <TurningRig x={LANE_X} y={t1} angle={t1H.angle} load={ours(onTruck1, CHASSIS_DECK, t1H.angle)} />
      <TurningRig
        x={exX}
        y={exY}
        angle={exR}
        load={<Container3D color={INK.navy} label="EXPORT" z0={CHASSIS_DECK} deg={exR} />}
      />
      <TurningRig x={t2x} y={t2y} angle={t2r} load={ours(onTruck2, CHASSIS_DECK, t2r)} />

      {/* ── Our container on a crane hook: spreader, cables, stretched shadow ── */}
      <motion.g style={{ opacity: onHook }}>
        <motion.g style={{ x: hShadowX, y: hShadowY, opacity: hShadowO }}>
          <rect
            x={-BOX.w / 2}
            y={-BOX.h / 2}
            width={BOX.w}
            height={BOX.h}
            rx={2}
            fill="#0b1a33"
            filter="url(#aw-soft)"
          />
        </motion.g>
        <motion.g style={{ x: hx, y: hy }}>
          <LiftBox
            w={BOX.w}
            h={BOX.h}
            H={CONTAINER_H}
            z0={hz}
            color={INK.cyan}
            roof={
              <g>
                <TopContainer label="DRAY-WORLD" />
                <Spreader />
              </g>
            }
          />
        </motion.g>
        <motion.line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="#1b2230" strokeWidth={1.6} />
        <motion.line x1={rx1} y1={ly1} x2={rx2} y2={ly2} stroke="#1b2230" strokeWidth={1.6} />
      </motion.g>

      {/* ── Overhead: cranes, gate and plaza canopies ── */}
      {CRANES_Y.map((y) => (
        <QuayCraneTop key={y} y={y} x0={400} x1={905} legA={655} legB={865} />
      ))}
      <motion.g style={{ x: trolley1 }}>
        <Trolley x={0} y={CRANES_Y[1]} />
      </motion.g>
      <Trolley x={PICK_X - 125} y={CRANES_Y[0]} />
      <Trolley x={LANE_X + 60} y={CRANES_Y[2]} />

      {[0, 1].map((i) => (
        <motion.rect
          key={i}
          x={727 + i * 64}
          y={GATE_Y + 18}
          width={58}
          height={5}
          rx={2}
          fill="#fff"
          stroke={INK.red}
          strokeWidth={1.5}
          style={{ rotate: barrier, originX: 0, originY: 0.5 }}
        />
      ))}
      <Canopy x={790} y={GATE_Y - 21} w={190} label="TERMINAL GATE" />

      <YardHandler animate={!reduce} />

      <GantryTop y={RAMP_1} x0={560} x1={830} label="INTERMODAL" />
      <motion.g style={{ x: trolley2 }}>
        <Trolley x={0} y={RAMP_1} />
      </motion.g>
      <GantryTop y={RAMP_2} x0={560} x1={830} label="INLAND RAMP" />
      <motion.g style={{ x: trolley3 }}>
        <Trolley x={0} y={RAMP_2} />
      </motion.g>

      <Canopy x={790} y={BORDER_Y - 7} w={270} label="USA · CANADA" accent />
      <QuayCraneTop y={EXPORT.craneY} x0={260} x1={700} legA={480} legB={660} />

      {/* dock door light turns green on delivery, then the POD check */}
      <motion.rect
        x={DC.x - 9}
        y={DOCK_Y - 22}
        width={5}
        height={10}
        rx={1.5}
        fill="#34d399"
        style={{ opacity: delivered }}
      />
      <motion.g style={{ x: 690, y: DOCK_Y - 130, opacity: delivered, scale: deliveredScale }}>
        <circle r={24} fill={INK.success} />
        <circle r={24} fill="none" stroke="#fff" strokeWidth={3} />
        <path
          d="M-10,0 L-3,7 L11,-8"
          stroke="#fff"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.g>

      {/* the freighter flies above everything */}
      <motion.g style={{ x: planeX, y: planeY }}>
        <g transform="scale(0.95)">
          <TopPlane />
        </g>
      </motion.g>
    </svg>
  );
}

// Northbound ship's outline for its water shadow (mirror of the hull).
const SHIP_OUTLINE_UP =
  "M-78,352 Q-80,362 -66,362 H66 Q80,362 78,352 L80,-230 Q80,-292 22,-348 Q0,-366 -22,-348 Q-80,-292 -80,-230 Z";

/** Invisible symmetric box: rotation pivots on the rig's cargo centre. */
const PivotBox = () => <rect x={-40} y={-135} width={80} height={270} fill="none" />;

/** Container spreader seen from above: yellow frame with twist-lock corners. */
function Spreader() {
  return (
    <g>
      <rect
        x={-BOX.w / 2 - 2}
        y={-BOX.h / 2 - 2}
        width={BOX.w + 4}
        height={BOX.h + 4}
        rx={1}
        fill="none"
        stroke="#f2c94c"
        strokeWidth={2.2}
      />
      <rect x={-5} y={-12} width={10} height={24} rx={1} fill="#f2c94c" />
      {[
        [-BOX.w / 2 - 3, -BOX.h / 2 - 3],
        [BOX.w / 2 - 1, -BOX.h / 2 - 3],
        [-BOX.w / 2 - 3, BOX.h / 2 - 1],
        [BOX.w / 2 - 1, BOX.h / 2 - 1],
      ].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x} y={y} width={4} height={4} fill="#b8860b" />
      ))}
    </g>
  );
}

/** A truck that turns around (spring) to face the way it moves; its shadow stays sun-aligned. */
function TurningRig({
  x,
  y,
  angle,
  load,
  cab = "brand",
}: {
  x: number | MotionValue<number>;
  y: MotionValue<number>;
  angle: MotionValue<number>;
  load: ReactNode;
  cab?: Cab;
}) {
  return (
    <>
      <motion.g style={{ x, y }}>
        <g transform={`translate(${SUN.x * 16} ${SUN.y * 16})`}>
          <motion.g style={{ rotate: angle }}>
            <PivotBox />
            <rect
              x={-13}
              y={-66}
              width={26}
              height={193}
              rx={3}
              fill="#0b1a33"
              opacity={0.22}
              filter="url(#aw-soft)"
            />
          </motion.g>
        </g>
      </motion.g>
      <motion.g style={{ x, y }}>
        <motion.g style={{ rotate: angle }}>
          <PivotBox />
          <Truck3D cab={cab} deg={angle} shadow={false} load={load} />
        </motion.g>
      </motion.g>
    </>
  );
}

/** Rubber-tyred gantry in the yard shuffling a box across the stacks (ambient, time-based). */
function YardHandler({ animate }: { animate: boolean }) {
  const y = YARD.from + 460;
  const z = 84;
  const [lx, ly] = lift(z, 0);
  const [tx, ty] = lift(120, 0);
  return (
    <motion.g
      initial={{ x: 900 }}
      animate={animate ? { x: [900, 1110, 1110, 900, 900] } : { x: 1000 }}
      transition={
        animate
          ? { duration: 11, times: [0, 0.4, 0.5, 0.9, 1], ease: "easeInOut", repeat: Infinity }
          : undefined
      }
    >
      <rect
        x={-BOX.w / 2 + SUN.x * z}
        y={y - BOX.h / 2 + SUN.y * z}
        width={BOX.w}
        height={BOX.h}
        fill="#0b1a33"
        opacity={0.12}
        filter="url(#aw-soft)"
      />
      <line x1={tx} y1={y + ty} x2={lx} y2={y + ly} stroke="#1b2230" strokeWidth={1.4} />
      <g transform={`translate(0 ${y})`}>
        <Box
          w={BOX.w}
          h={BOX.h}
          H={CONTAINER_H}
          z0={z}
          color="#4f7f6a"
          roof={
            <g>
              <TopContainer color="#4f7f6a" />
              <Spreader />
            </g>
          }
        />
      </g>
      <Trolley x={0} y={y} />
    </motion.g>
  );
}

/** Canopy roof over the road (gate / border plaza): 18 ft up, with its shadow. */
function Canopy({
  x,
  y,
  w,
  label,
  accent = false,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={-w / 2 + SUN.x * 60}
        y={-15 + SUN.y * 60}
        width={w}
        height={30}
        fill="#0b1a33"
        opacity={0.12}
        filter="url(#aw-soft)"
      />
      <Box
        w={w}
        h={30}
        H={6}
        z0={54}
        color={INK.navy}
        roof={
          <g>
            <rect x={-w / 2} y={-15} width={w} height={30} rx={3} fill={INK.navy} />
            {accent ? <rect x={-w / 2} y={9} width={w} height={4} fill={INK.cyan} /> : null}
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontSize={11}
              fontWeight={800}
              letterSpacing={3}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {label}
            </text>
          </g>
        }
      />
    </g>
  );
}

function Rig({
  x,
  y,
  opacity,
  cab,
  load,
  north = false,
}: {
  x: number;
  y: MotionValue<number>;
  opacity?: MotionValue<number>;
  cab: Cab;
  load: ReactNode;
  north?: boolean;
}) {
  return (
    <motion.g style={{ x, y, opacity }}>
      <g transform={north ? "rotate(180)" : undefined}>
        <Truck3D cab={cab} load={load} empty={false} deg={north ? 180 : undefined} />
      </g>
    </motion.g>
  );
}
