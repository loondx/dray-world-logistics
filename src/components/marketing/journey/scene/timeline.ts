// Scroll-driven timeline of the 3D freight journey. Pure (no three.js) so it is unit-tested.
//
// World units are metres, y is up and the shipment travels towards −z. Every pose is a
// function of scroll progress s ∈ [0, 1] (plus wall-clock time for ambient motion only), so
// scrolling back up replays the journey exactly in reverse — nothing is accumulated.

export type V2 = readonly [number, number];
export type Pose = { x: number; z: number; yaw: number };
export type Pose3 = Pose & { y: number };

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const span = (s: number, a: number, b: number) => clamp01((s - a) / (b - a));
const easeOut = (t: number) => 1 - (1 - clamp01(t)) ** 3;

/** Yaw for a model whose nose points along local −z, heading along (hx, hz). */
export const yawOf = (hx: number, hz: number) => Math.atan2(-hx, -hz);

function lerpAngle(a: number, b: number, t: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

/** Piecewise value through [s, v] keys; eased between keys, held outside them. */
export function keyed(s: number, keys: readonly (readonly [number, number])[]) {
  if (s <= keys[0]![0]) return keys[0]![1];
  for (let i = 1; i < keys.length; i++) {
    const [s1, v1] = keys[i]!;
    if (s <= s1) {
      const [s0, v0] = keys[i - 1]!;
      return lerp(v0, v1, smooth((s - s0) / (s1 - s0)));
    }
  }
  return keys[keys.length - 1]![1];
}

// ── Tracks: arc-length parameterised polylines (roads, rails) ──

export class Track {
  readonly length: number;
  private constructor(
    private readonly xs: number[],
    private readonly zs: number[],
    private readonly cum: number[],
  ) {
    this.length = cum[cum.length - 1]!;
  }

  static from(points: V2[]): Track {
    const xs: number[] = [];
    const zs: number[] = [];
    const cum: number[] = [];
    for (const [x, z] of points) {
      const n = xs.length;
      if (n && Math.hypot(x - xs[n - 1]!, z - zs[n - 1]!) < 1e-6) continue;
      cum.push(n ? cum[n - 1]! + Math.hypot(x - xs[n - 1]!, z - zs[n - 1]!) : 0);
      xs.push(x);
      zs.push(z);
    }
    return new Track(xs, zs, cum);
  }

  /** Pose at arc length d; extrapolates straight beyond either end. */
  at(d: number): Pose {
    const last = this.xs.length - 1;
    let i = 0;
    if (d >= this.length) i = last - 1;
    else if (d > 0) {
      let lo = 0;
      let hi = last;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (this.cum[mid]! <= d) lo = mid;
        else hi = mid;
      }
      i = lo;
    }
    const x0 = this.xs[i]!;
    const z0 = this.zs[i]!;
    const dx = this.xs[i + 1]! - x0;
    const dz = this.zs[i + 1]! - z0;
    const seg = this.cum[i + 1]! - this.cum[i]!;
    const t = (d - this.cum[i]!) / seg;
    return { x: x0 + dx * t, z: z0 + dz * t, yaw: yawOf(dx, dz) };
  }

  /** Arc length of the sample nearest to (x, z) — for placing stops on a track. */
  nearest(x: number, z: number): number {
    let best = 0;
    let bestDist = Infinity;
    for (let d = 0; d <= this.length; d += 0.1) {
      const p = this.at(d);
      const dist = Math.hypot(p.x - x, p.z - z);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  /** Evenly spaced samples (for building road and rail geometry). */
  samples(step: number): Pose[] {
    const out: Pose[] = [];
    for (let d = 0; d < this.length; d += step) out.push(this.at(d));
    out.push(this.at(this.length - 1e-6));
    return out;
  }
}

/** Lines and cubic Béziers, sampled densely. */
export function path(x: number, z: number) {
  const pts: [number, number][] = [[x, z]];
  const api = {
    line(x1: number, z1: number) {
      pts.push([x1, z1]);
      return api;
    },
    bezier(c1: V2, c2: V2, x1: number, z1: number, n = 32) {
      const [x0, z0] = pts[pts.length - 1]!;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const u = 1 - t;
        pts.push([
          u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x1,
          u * u * u * z0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * z1,
        ]);
      }
      return api;
    },
    build: () => Track.from(pts),
  };
  return api;
}

/** Centripetal Catmull-Rom through the points (straight wherever four points are collinear). */
export function catmull(points: V2[], perSegment = 40): Track {
  const p = [points[0]!, ...points, points[points.length - 1]!];
  const out: V2[] = [];
  const knot = (a: V2, b: V2) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1]!, p[i]!, p[i + 1]!, p[i + 2]!];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    for (let k = 0; k < perSegment; k++) {
      const t = t1 + ((t2 - t1) * k) / perSegment;
      const mix = (a: V2, b: V2, ta: number, tb: number): V2 => {
        const w = (t - ta) / (tb - ta);
        return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
      };
      const a1 = mix(p0, p1, 0, t1);
      const a2 = mix(p1, p2, t1, t2);
      const a3 = mix(p2, p3, t2, t3);
      const b1 = mix(a1, a2, 0, t2);
      const b2 = mix(a2, a3, t1, t3);
      out.push(mix(b1, b2, t1, t2));
    }
  }
  out.push(points[points.length - 1]!);
  return Track.from(out);
}

// ── Layout ──

export const WATER_Y = -1.6;
export const BOX = { l: 12.19, w: 2.44, h: 2.59 } as const; // 40 ft container
export const CHASSIS_DECK = 1.4;
export const WELL_UPPER = 0.75 + BOX.h; // upper box of a double stack
/** Trailer centre → tractor centre, along the road (follow-the-leader articulation). */
export const TRACTOR_LEAD = 7.4;
const TRACTOR_FRONT = 3.4;

export const SHIP = {
  x: -27,
  berthZ: 70,
  startZ: 470,
  length: 150,
  beam: 26,
  deckY: 4,
  slot: { x: 6.25, z: -15, tier: 3 },
} as const;
export const QUAY_X = -12;
export const STS_Z = [28, 55, 84] as const; // the middle crane works our box
export const STS_HOOK = SHIP.slot.z + SHIP.berthZ;
export const LANE_X = 4;
export const GATE_Z = -60;
export const YARD = { z0: -88, z1: -200 } as const;

export const RAIL_X = 22;
export const RAIL_2_X = 27;
export const RAMP_X = 12; // truck lane under the rail gantries
export const RAMP_A = -230;
export const RAMP_B = -900;
export const RIVER_Z = -610;

export const BORDER_Z = -1120;
export const JUNCTION_Z = -1360;
export const DC = { x0: 30, x1: 124, z0: -1462, z1: -1400, h: 12, door: 62 } as const;
export const DOCK_DOORS = [38, 50, 62, 74, 86, 98, 110] as const;

export const EXPORT = {
  quayX: -50,
  laneX: -40,
  craneZ: -1416, // = ship.z + slot.z
  ship: { x: -66, z: -1440, length: 120, beam: 22, deckY: 3.5 },
  slot: { x: 3.75, z: 24, tier: 2 },
} as const;

// Routes (trailer / container centre lines).
export const TRUCK1 = path(LANE_X, 90)
  .line(LANE_X, -110)
  .bezier([LANE_X, -140], [RAMP_X, -145], RAMP_X, -175)
  .line(RAMP_X, -280)
  .build();

export const TRUCK2 = path(RAMP_X, -860)
  .line(RAMP_X, -930)
  .bezier([RAMP_X, -955], [LANE_X, -950], LANE_X, -975)
  .line(LANE_X, -1335)
  .bezier([LANE_X, -1352], [12, JUNCTION_Z], 26, JUNCTION_Z)
  .line(44, JUNCTION_Z)
  .bezier([56, JUNCTION_Z], [DC.door, -1356], DC.door, -1344)
  .line(DC.door, -1280)
  .build();

export const EXPORT_TRUCK = path(7.6, -1040)
  .line(7.6, -1300)
  .bezier([7.6, -1345], [-2, JUNCTION_Z], -16, JUNCTION_Z)
  .line(-24, JUNCTION_Z)
  .bezier([-36, JUNCTION_Z], [EXPORT.laneX, -1364], EXPORT.laneX, -1376)
  .line(EXPORT.laneX, -1480)
  .build();

export const RAIL = catmull([
  [RAIL_X, -40],
  [RAIL_X, -80],
  [RAIL_X, -280],
  [RAIL_X, -330],
  [34, -425],
  [58, -520],
  [70, RIVER_Z],
  [58, -700],
  [34, -795],
  [RAIL_X, -850],
  [RAIL_X, -870],
  [RAIL_X, -960],
  [RAIL_X, -1012],
]);

// Train consist, nose first: two locomotives, seven double-stack well cars, one pusher.
export const LOCO_LEN = 22;
export const WELL_LEN = 17.6;
const GAP = 1.1;
export const CONSIST = (() => {
  const kinds = ["loco", "loco", "well", "well", "well", "well", "well", "well", "well", "loco"] as const;
  let back = 0;
  return kinds.map((kind) => {
    const len = kind === "loco" ? LOCO_LEN : WELL_LEN;
    const offset = back + len / 2;
    back += len + GAP;
    return { kind, offset, len };
  });
})();
export const HERO_CAR = 4; // the third well car carries our box (upper slot)

// ── Scroll timeline (fractions of the journey section) ──

export const S = {
  sail: [0, 0.12],
  lift1: [0.135, 0.215],
  drive1: [0.225, 0.27, 0.29, 0.37], // go, gate stop, gate go, ramp
  lift2: [0.378, 0.44],
  rail: [0.45, 0.61],
  lift3: [0.618, 0.676],
  drive2: [0.684, 0.762, 0.787, 0.862], // go, border stop, border go, staged
  dock: [0.872, 0.952],
  exportDrive: [0.77, 0.85],
  exportLift: [0.888, 0.972],
} as const;

const D1 = {
  start: TRUCK1.nearest(LANE_X, STS_HOOK),
  gate: TRUCK1.nearest(LANE_X, GATE_Z + TRACTOR_LEAD + TRACTOR_FRONT + 0.6),
  ramp: TRUCK1.nearest(RAMP_X, RAMP_A),
};
const D2 = {
  start: TRUCK2.nearest(RAMP_X, RAMP_B),
  border: TRUCK2.nearest(LANE_X, BORDER_Z + TRACTOR_LEAD + TRACTOR_FRONT + 4),
  staged: TRUCK2.nearest(DC.door, -1328),
};
const DOCKED_Z = DC.z1 + BOX.l / 2 + 0.6;
const DE = {
  border: EXPORT_TRUCK.nearest(7.6, BORDER_Z + TRACTOR_LEAD + TRACTOR_FRONT + 4),
  crane: EXPORT_TRUCK.nearest(EXPORT.laneX, EXPORT.craneZ),
};
const RAIL_A = RAIL.nearest(RAIL_X, RAMP_A) + CONSIST[HERO_CAR]!.offset;
const RAIL_B = RAIL.nearest(RAIL_X, RAMP_B) + CONSIST[HERO_CAR]!.offset;

export type Rig = { trailer: Pose; tractor: Pose; dist: number; reversing: boolean };

function rigOn(track: Track, d: number): Rig {
  return { trailer: track.at(d), tractor: track.at(d + TRACTOR_LEAD), dist: d, reversing: false };
}

export function shipZ(s: number) {
  return lerp(SHIP.startZ, SHIP.berthZ, easeOut(span(s, ...S.sail)));
}

export function truck1(s: number): Rig {
  const [a, b, c, e] = S.drive1;
  return rigOn(
    TRUCK1,
    keyed(s, [
      [a, D1.start],
      [b, D1.gate],
      [c, D1.gate],
      [e, D1.ramp],
    ]),
  );
}

export function truck2(s: number): Rig {
  const [a, b, c, e] = S.drive2;
  if (s < S.dock[0]) {
    return rigOn(
      TRUCK2,
      keyed(s, [
        [a, D2.start],
        [b, D2.border],
        [c, D2.border],
        [e, D2.staged],
      ]),
    );
  }
  // Backing into the door: straight back, cab still facing away from the dock.
  const staged = TRUCK2.at(D2.staged);
  const z = lerp(staged.z, DOCKED_Z, smooth(span(s, ...S.dock)));
  const back = D2.staged - (staged.z - z);
  return {
    trailer: { x: staged.x, z, yaw: staged.yaw },
    tractor: { x: staged.x, z: z + TRACTOR_LEAD, yaw: staged.yaw },
    dist: back,
    reversing: true,
  };
}

export function exportTruck(s: number): Rig {
  return rigOn(
    EXPORT_TRUCK,
    keyed(s, [
      [S.exportDrive[0], DE.border],
      [S.exportDrive[1], DE.crane],
    ]),
  );
}

/** Arc length of the lead locomotive's centre along the rail. */
export function trainHead(s: number) {
  return lerp(RAIL_A, RAIL_B, smooth(span(s, ...S.rail)));
}

export function trainCars(s: number) {
  const head = trainHead(s);
  return CONSIST.map((car) => ({ ...car, pose: RAIL.at(head - car.offset) }));
}

/** Hoist path: up to `clear`, across, down onto the next carrier. */
function hoist(p: number, a: Pose3, b: Pose3, clear: number): Pose3 {
  const across = smooth(span(p, 0.26, 0.74));
  const y = p < 0.5 ? lerp(a.y, clear, smooth(span(p, 0, 0.3))) : lerp(clear, b.y, smooth(span(p, 0.7, 1)));
  return { x: lerp(a.x, b.x, across), y, z: lerp(a.z, b.z, across), yaw: lerpAngle(a.yaw, b.yaw, across) };
}

const onDeck = (pose: Pose, y: number): Pose3 => ({ ...pose, y });
const shipSlot = (z: number): Pose3 => ({
  x: SHIP.x + SHIP.slot.x,
  y: SHIP.deckY + SHIP.slot.tier * BOX.h,
  z: z + SHIP.slot.z,
  yaw: 0,
});
const wellSlot = (s: number) => onDeck(trainCars(s)[HERO_CAR]!.pose, WELL_UPPER);

export const CLEAR = { sts: 24, rmg: 9.5 } as const;

/** Our container (bottom-centre pose) at scroll progress s. */
export function hero(s: number): Pose3 {
  if (s < S.lift1[0]) return shipSlot(shipZ(s));
  if (s < S.lift1[1])
    return hoist(
      span(s, ...S.lift1),
      shipSlot(SHIP.berthZ),
      onDeck(truck1(s).trailer, CHASSIS_DECK),
      CLEAR.sts,
    );
  if (s < S.lift2[0]) return onDeck(truck1(s).trailer, CHASSIS_DECK);
  if (s < S.lift2[1])
    return hoist(span(s, ...S.lift2), onDeck(truck1(s).trailer, CHASSIS_DECK), wellSlot(s), CLEAR.rmg);
  if (s < S.lift3[0]) return wellSlot(s);
  if (s < S.lift3[1])
    return hoist(span(s, ...S.lift3), wellSlot(s), onDeck(truck2(s).trailer, CHASSIS_DECK), CLEAR.rmg);
  return onDeck(truck2(s).trailer, CHASSIS_DECK);
}

const exportSlot: Pose3 = {
  x: EXPORT.ship.x + EXPORT.slot.x,
  y: EXPORT.ship.deckY + EXPORT.slot.tier * BOX.h,
  z: EXPORT.ship.z + EXPORT.slot.z,
  yaw: 0,
};

/** The export (port-to-port) container. */
export function exportBox(s: number): Pose3 {
  const onTruck = onDeck(exportTruck(s).trailer, CHASSIS_DECK);
  if (s < S.exportLift[0]) return onTruck;
  return hoist(span(s, ...S.exportLift), onTruck, exportSlot, CLEAR.sts);
}

export type Crane = { x: number; z: number; hookY: number };

/** Trolley / spreader of a crane that performs one hoist in `range`. */
function crane(s: number, range: readonly [number, number], box: (s: number) => Pose3, park: number): Crane {
  const [s0, s1] = range;
  const lead = 0.02;
  if (s < s0) {
    const a = box(s0);
    return { x: a.x, z: a.z, hookY: lerp(park, a.y + BOX.h, smooth(span(s, s0 - lead, s0))) };
  }
  if (s <= s1) {
    const p = box(s);
    return { x: p.x, z: p.z, hookY: p.y + BOX.h };
  }
  const b = box(s1);
  return { x: b.x, z: b.z, hookY: lerp(b.y + BOX.h, park, smooth(span(s, s1, s1 + lead))) };
}

export const cranes = {
  sts: (s: number) => crane(s, S.lift1, hero, CLEAR.sts + BOX.h),
  rampA: (s: number) => crane(s, S.lift2, hero, CLEAR.rmg + BOX.h),
  rampB: (s: number) => crane(s, S.lift3, hero, CLEAR.rmg + BOX.h),
  export: (s: number) => crane(s, S.exportLift, exportBox, CLEAR.sts + BOX.h),
};

/** Air freight: freighters crossing the ocean and port on their own clock, so they always
 *  fly forward whichever way the page is scrolled. */
export const FLIGHTS = [
  { from: [-250, 70, 900], to: [300, 35, -700], period: 26, offset: 12 }, // inbound over the ship
  { from: [720, 90, -60], to: [-720, 150, -220], period: 26, offset: 20 }, // across the port
] as const;

export function flight(i: number, t: number) {
  const { from, to, period, offset } = FLIGHTS[i]!;
  const p = ((((t + offset) / period) % 1) + 1) % 1;
  return {
    x: lerp(from[0], to[0], p),
    y: lerp(from[1], to[1], p),
    z: lerp(from[2], to[2], p),
    yaw: yawOf(to[0] - from[0], to[2] - from[2]),
    pitch: Math.atan2(to[1] - from[1], Math.hypot(to[0] - from[0], to[2] - from[2])),
  };
}

// ── Camera: orbit around the container, keyed to the story ──

/** [s, distance, elevation°, azimuth° (0 = behind, +90 = right side), focus blend] */
export const CAMERA_KEYS = [
  [0.0, 200, 11, -26, 0],
  [0.07, 150, 15, -38, 0],
  [0.125, 92, 24, -62, 0],
  [0.2, 74, 32, -76, 0],
  [0.25, 44, 22, -28, 0],
  [0.31, 40, 19, 22, 0],
  [0.37, 58, 34, 58, 0],
  [0.43, 56, 30, 72, 0],
  [0.5, 78, 15, 108, 0],
  [0.57, 64, 12, 62, 0],
  [0.625, 56, 30, 72, 0],
  [0.68, 46, 22, 40, 0],
  [0.73, 38, 12, -22, 0],
  [0.79, 54, 21, 14, 0],
  [0.855, 64, 26, 34, 0],
  [0.9, 68, 38, 32, 0],
  [0.945, 90, 40, 26, 0.3],
  [1.0, 215, 46, 14, 1],
] as const;

/** Wide final shot: the DC dock and the export berth together. */
export const FOCUS = { x: 4, y: 0, z: -1412 } as const;

export function cameraAt(s: number) {
  const pick = (i: 1 | 2 | 3 | 4) =>
    keyed(
      s,
      CAMERA_KEYS.map((k) => [k[0], k[i]] as const),
    );
  return { distance: pick(1), elevation: pick(2), azimuth: pick(3), focus: pick(4) };
}

// ── Story chapters (captions), as ranges of s ──

export const CHAPTERS = [
  {
    from: 0,
    step: "Global origin",
    title: "Freight from anywhere.",
    line: "Ocean and air connections from global origins.",
  },
  {
    from: 0.125,
    step: "Port",
    title: "Off the vessel.",
    line: "Import and export containers, crane-handled at the terminal.",
  },
  {
    from: 0.22,
    step: "Pickup",
    title: "Onto our chassis.",
    line: "Port transportation and drayage, out through the terminal gate.",
  },
  { from: 0.3, step: "Yard", title: "Through the yard.", line: "Yard movement, staged at the rail ramp." },
  {
    from: 0.375,
    step: "Rail",
    title: "Rail and intermodal.",
    line: "Double-stack rail, coordinated at both ramps.",
  },
  {
    from: 0.68,
    step: "Road",
    title: "Across the USA & Canada.",
    line: "Over-the-road, full truckload and less-than-truckload, cross-border included.",
  },
  {
    from: 0.865,
    step: "Final delivery",
    title: "Door to door. Port to port.",
    line: "Backed in at your dock, or delivered to the terminal for export.",
  },
] as const;

export function chapterAt(s: number) {
  let index = 0;
  CHAPTERS.forEach((chapter, i) => {
    if (s >= chapter.from) index = i;
  });
  return index;
}
