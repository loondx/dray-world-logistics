// Simplified USA + Canada geometry for the coverage map (lon/lat, illustrative only).
// Rendered as a dot matrix, so a coarse outline reads well at any size.

export type LonLat = readonly [number, number];

export const MAINLAND: LonLat[] = [
  [-168, 65.5],
  [-163, 67],
  [-166, 68.8],
  [-156.5, 71.3],
  [-150, 70.4],
  [-141, 69.6],
  [-135, 69.2],
  [-128, 70],
  [-120, 69],
  [-114, 68],
  [-106, 68.5],
  [-98, 67.8],
  [-95, 68.8],
  [-89, 68.5],
  [-85, 69.6],
  [-82, 67],
  [-83, 66],
  [-87, 64.3],
  [-91, 62.5],
  [-94.5, 59],
  [-93, 57.5],
  [-89, 56.8],
  [-85, 55.2],
  [-82.3, 52.9],
  [-79.5, 51.5],
  [-79, 54.5],
  [-77, 56.5],
  [-78, 58.8],
  [-77.5, 62.3],
  [-74, 62.3],
  [-71, 61.2],
  [-69.5, 59],
  [-65.5, 59.5],
  [-64.5, 60.3],
  [-61.5, 56.5],
  [-60, 55.2],
  [-57.5, 54],
  [-56, 52.3],
  [-60, 50.2],
  [-66.5, 49.8],
  [-64.3, 48.9],
  [-65, 47.5],
  [-64, 46.2],
  [-61.2, 45.6],
  [-60, 46.2],
  [-63.5, 44.6],
  [-65.8, 43.5],
  [-66.5, 44.8],
  [-67.2, 44.6],
  [-70, 43.7],
  [-70.6, 42.6],
  [-70, 41.8],
  [-71.5, 41.3],
  [-74, 40.6],
  [-74.1, 39.6],
  [-75.5, 38.8],
  [-76, 37],
  [-75.6, 35.3],
  [-77.5, 34.4],
  [-79, 33.3],
  [-81, 31.8],
  [-81.3, 29.9],
  [-80.5, 28],
  [-80, 26.5],
  [-80.3, 25.3],
  [-81.3, 25.2],
  [-81.8, 26.6],
  [-82.8, 28.2],
  [-83.7, 29.9],
  [-85.4, 29.7],
  [-87.5, 30.3],
  [-89.5, 30.3],
  [-89.3, 29.1],
  [-90.5, 29.1],
  [-92, 29.6],
  [-94, 29.7],
  [-95.5, 28.7],
  [-97.2, 27.6],
  [-97.2, 25.9],
  [-99.5, 27.5],
  [-101, 29.8],
  [-103, 29],
  [-104.5, 29.8],
  [-106.5, 31.8],
  [-108.2, 31.3],
  [-111, 31.3],
  [-114.8, 32.5],
  [-117.1, 32.5],
  [-118.5, 34],
  [-120.6, 34.6],
  [-122.5, 37.5],
  [-124, 40.5],
  [-124.5, 43],
  [-124, 46.3],
  [-124.7, 48.4],
  [-123, 49],
  [-125, 50],
  [-128, 51.5],
  [-130, 54],
  [-133, 57],
  [-136, 58.5],
  [-140, 59.7],
  [-145, 60.5],
  [-150, 59.5],
  [-152, 58],
  [-155, 57.5],
  [-158, 56.5],
  [-162, 55],
  [-164.5, 54.5],
  [-160, 56.5],
  [-158, 58.5],
  [-162, 60],
  [-165, 61.5],
  [-164.5, 63],
  [-161, 64.5],
  [-166, 64.6],
];

export const ISLANDS: LonLat[][] = [
  // Newfoundland
  [
    [-59.4, 47.6],
    [-56, 49.6],
    [-55.5, 51.6],
    [-53.5, 49.2],
    [-52.8, 47.6],
    [-53.8, 46.7],
    [-56, 47.6],
  ],
  // Baffin Island
  [
    [-65, 62],
    [-62, 66.5],
    [-68, 70.5],
    [-78, 72.8],
    [-88, 70.5],
    [-86, 68],
    [-81, 66],
    [-74, 64.5],
  ],
  // Victoria Island
  [
    [-118, 69.5],
    [-117, 72.5],
    [-104, 73],
    [-101, 69.5],
    [-110, 68.7],
  ],
  // Banks Island
  [
    [-125, 71.8],
    [-121, 74.3],
    [-116, 72.8],
    [-121, 71.2],
  ],
  // Vancouver Island
  [
    [-128.3, 50.8],
    [-125.5, 50.3],
    [-123.4, 48.4],
    [-124.8, 48.6],
    [-127.8, 50.1],
  ],
];

const LAKES: LonLat[][] = [
  // Superior
  [
    [-92.1, 46.7],
    [-89.6, 48.1],
    [-87.5, 48.9],
    [-85, 48],
    [-84.6, 46.5],
    [-86.8, 46.4],
    [-89, 46.8],
    [-90.5, 46.6],
  ],
  // Michigan
  [
    [-87.8, 42.2],
    [-87.2, 44.5],
    [-87.6, 45.7],
    [-85.6, 46],
    [-85, 45.3],
    [-86.4, 43.8],
    [-86.2, 42.2],
  ],
  // Huron
  [
    [-84.6, 46],
    [-83.5, 45.3],
    [-82.5, 43.2],
    [-81.7, 43.3],
    [-81.2, 44.4],
    [-80.3, 44.7],
    [-80.7, 45.9],
    [-82.5, 46.2],
  ],
];

// Canada / USA border from the Pacific to the Atlantic (lon ascending).
const BORDER: LonLat[] = [
  [-123.3, 49],
  [-95.2, 49],
  [-95.2, 49.4],
  [-94.8, 48.7],
  [-89.6, 48],
  [-84.8, 46.6],
  [-83.6, 46.1],
  [-82.4, 45.3],
  [-82.3, 43],
  [-83.1, 42.1],
  [-82.5, 41.7],
  [-79, 42.8],
  [-79.2, 43.4],
  [-76.4, 43.6],
  [-75, 44.9],
  [-71.5, 45],
  [-70.7, 45.4],
  [-69.2, 47.4],
  [-68, 47.3],
  [-67.8, 45.7],
  [-67, 45],
  [-66.9, 44.6],
];

// ── Projection (equirectangular, compressed longitude) ──
const LON0 = -170;
const LAT0 = 74;
const SX = 5.9;
const SY = 8;
export const MAP_SIZE = { width: 710, height: 400 } as const;

export function project([lon, lat]: LonLat): [number, number] {
  return [(lon - LON0) * SX, (LAT0 - lat) * SY];
}

function inside(point: LonLat, polygon: readonly LonLat[]) {
  const [x, y] = point;
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function borderLat(lon: number) {
  for (let i = 1; i < BORDER.length; i++) {
    const [lon1, lat1] = BORDER[i - 1]!;
    const [lon2, lat2] = BORDER[i]!;
    if (lon <= lon2) return lon2 === lon1 ? lat2 : lat1 + ((lat2 - lat1) * (lon - lon1)) / (lon2 - lon1);
  }
  return 43.5;
}

function isCanada([lon, lat]: LonLat) {
  if (lon <= -141) return false; // Alaska
  if (lon < -130 && lat < 60 && lat > 54.6 && lon < -130 - (lat - 54.6) * 1.2) return false; // panhandle
  if (lon < -123.3) return lat >= 48.3;
  return lat >= borderLat(lon);
}

// Dot matrix as two path strings ("M x y h0" + round caps = one dot each).
function buildDots(step: number) {
  let usa = "";
  let canada = "";
  for (let y = step / 2; y < MAP_SIZE.height; y += step) {
    for (let x = step / 2; x < MAP_SIZE.width; x += step) {
      const point: LonLat = [x / SX + LON0, LAT0 - y / SY];
      const land = inside(point, MAINLAND) || ISLANDS.some((island) => inside(point, island));
      if (!land || LAKES.some((lake) => inside(point, lake))) continue;
      const dot = `M${x.toFixed(1)} ${y.toFixed(1)}h0`;
      if (isCanada(point)) canada += dot;
      else usa += dot;
    }
  }
  return { usa, canada };
}

export const MAP_DOTS = buildDots(9);
export const MAP_DOT_SIZE = 5.4;

export const BORDER_PATH = BORDER.map((p, i) => `${i ? "L" : "M"}${project(p).join(" ")}`).join("");

// Illustrative gateways and inland lanes (no claims about specific terminals).
const PLACES = {
  vancouver: [-123.1, 49.3],
  seattle: [-122.4, 47.3],
  oakland: [-122.3, 37.8],
  losAngeles: [-118.2, 33.8],
  houston: [-95, 29.7],
  savannah: [-81.1, 32.1],
  newYork: [-74.1, 40.7],
  halifax: [-63.6, 44.6],
  montreal: [-73.6, 45.5],
  toronto: [-79.4, 43.7],
  chicago: [-87.6, 41.9],
  dallas: [-96.8, 32.8],
  calgary: [-114, 51],
  winnipeg: [-97.1, 49.9],
  atlanta: [-84.4, 33.7],
  kansasCity: [-94.6, 39.1],
  denver: [-105, 39.7],
  memphis: [-90, 35.1],
} satisfies Record<string, LonLat>;

type Place = keyof typeof PLACES;

export const GATEWAYS: Place[] = [
  "vancouver",
  "seattle",
  "oakland",
  "losAngeles",
  "houston",
  "savannah",
  "newYork",
  "halifax",
  "montreal",
];
export const HUBS: Place[] = [
  "toronto",
  "chicago",
  "dallas",
  "calgary",
  "winnipeg",
  "atlanta",
  "kansasCity",
  "denver",
  "memphis",
];

export function placePoint(place: Place) {
  return project(PLACES[place]);
}

// Quadratic curve between two map points, bowed `bend` of its length to the left.
export function arc(from: [number, number], to: [number, number], bend = 0.18) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const cx = (x1 + x2) / 2 - (y2 - y1) * bend;
  const cy = (y1 + y2) / 2 + (x2 - x1) * bend;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// Ocean arrivals: short approaches from offshore (global origins beyond the map).
const PACIFIC: [number, number] = [-115, 26];
const ATLANTIC: [number, number] = [105, 18];
const GULF: [number, number] = [40, 70];

export const OCEAN_LANES: { from: [number, number]; to: Place }[] = (
  [
    ["vancouver", PACIFIC],
    ["oakland", PACIFIC],
    ["losAngeles", PACIFIC],
    ["halifax", ATLANTIC],
    ["newYork", ATLANTIC],
    ["savannah", ATLANTIC],
    ["houston", GULF],
  ] as const
).map(([to, [dx, dy]]) => {
  const [x, y] = placePoint(to);
  return { from: [x + dx, y + dy], to };
});

export const OCEAN_LABELS = [
  { text: "PACIFIC", at: [-30, 250] },
  { text: "ATLANTIC", at: [720, 300] },
  { text: "GULF", at: [470, 420] },
] as const;

export const INLAND_LANES: [Place, Place][] = [
  ["vancouver", "calgary"],
  ["calgary", "winnipeg"],
  ["seattle", "denver"],
  ["losAngeles", "dallas"],
  ["oakland", "denver"],
  ["houston", "dallas"],
  ["dallas", "kansasCity"],
  ["kansasCity", "chicago"],
  ["savannah", "atlanta"],
  ["atlanta", "memphis"],
  ["newYork", "chicago"],
  ["halifax", "montreal"],
  ["montreal", "toronto"],
  ["toronto", "chicago"],
  ["winnipeg", "toronto"],
];
