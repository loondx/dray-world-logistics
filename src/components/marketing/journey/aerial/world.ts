// Aerial journey world, in SVG user units. North is up; the shipment travels DOWN the
// page, so scrolling down moves it forward and scrolling up plays it back.
//
// `c` (see use-world-center) is the world y under the "ride line" of the viewport. A
// moving vehicle tracks c, so it holds still on screen while the map scrolls beneath it;
// a parked vehicle keeps its world y and scrolls away with the map.

export const WORLD = { width: 1200, height: 7700 } as const;

// Visible window per breakpoint (x, width). Phones crop to the corridor around the route.
export const VIEW = {
  phone: { x: 330, width: 600 },
  tablet: { x: 150, width: 900 },
  desktop: { x: 0, width: 1200 },
  wide: { x: -200, width: 1600 },
} as const;

/** Fraction of the viewport height where moving vehicles ride. */
export const RIDE = 0.58;

// Scale: a 40ft container is 24 × 120 units.
export const BOX = { w: 24, h: 120 } as const;

// ── Ocean & port ──
export const COAST_Y = 1560; // land starts (east of the quay)
export const QUAY_X = 610; // berth face; water west of it down to BASIN_END
export const BASIN_END = 2420;
export const SHIP_X = 520;
export const SHIP_START = 380;
export const SHIP_BERTH = 1960;
export const SHIP_SLOT = { dx: 62.5, dy: -60, row: 5, bay: 1 } as const; // our box, relative to ship centre
export const CRANES_Y = [1760, 1900, 2040] as const; // middle crane works our box
export const LANE_X = 760; // truck lane (quay → gate → yard → ramp)

// ── Terminal ──
export const GATE_Y = 2650;
export const YARD = { from: 2760, to: 3440 } as const;

// ── Rail ──
export const TRACK_X = 640;
export const TRACK_2_X = 590;
export const TRACK = { from: 3280, to: 5720 } as const;
export const RAMP_1 = 3700;
export const RAMP_2 = 5300;
export const CAR_PITCH = 152;
export const RIVER_Y = 4560;

// ── Road ──
export const HIGHWAY = { from: 5600, to: 6820, lanes: [700, 760, 820, 880] } as const;
export const BORDER_Y = 6300;
export const DC = { x: 860, y: 6860, w: 320, h: 470 } as const;
export const DOCK_Y = 7060;

// ── Port-to-port: export branch to a second terminal (bottom-left) ──
export const EXPORT = {
  split: 6560, // branch leaves the highway's west lane here
  laneX: 590, // export lane along the quay
  quayX: 520, // berth face
  basinY: 6960, // water starts
  shipX: 400,
  shipY: 7410,
  craneY: 7260,
} as const;

// ── Timeline, as values of c ──
export const T = {
  berth: SHIP_BERTH,
  lift1: [2000, 2300] as const,
  lift2: [RAMP_1 + 20, RAMP_1 + 280] as const,
  lift3: [RAMP_2 + 20, RAMP_2 + 280] as const,
  dock: [6900, 7180] as const,
  delivered: 7200,
};

/** Catch-up speed (world units per unit of c) when a vehicle pulls away from a stop. */
export const PULL = 1.8;

/** Position of a vehicle that waits at `stop` until c reaches `go`, then pulls away
 *  (faster than scroll) until it catches the ride line, then rides it to `until`. */
export function follow(c: number, stop: number, go: number, until: number) {
  const pulled = stop + Math.max(0, c - go) * PULL;
  return Math.min(until, Math.max(stop, Math.min(c, pulled)));
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const progress = (c: number, [a, b]: readonly [number, number]) => clamp01((c - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
