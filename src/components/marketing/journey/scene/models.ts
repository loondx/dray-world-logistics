import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { bake, beam, box, cyl, type Kit } from "./kit";
import { rng } from "./textures";
import { BOX, LOCO_LEN, WATER_Y, WELL_LEN, WELL_UPPER } from "./timeline";

// Procedural models at real-world scale (metres). Every vehicle's nose points along −z and
// its origin is on the ground at the centre of the vehicle, so a pose (x, z, yaw) places it.

export const OTHER_COLORS = [
  "#8a99ad",
  "#b45a3c",
  "#d6a23a",
  "#4f7f6a",
  "#6b7c93",
  "#9a4d63",
  "#c9d3df",
  "#2f5f8a",
];

/** Bottom-centred 40 ft container geometry. */
export function containerGeometry() {
  const g = new THREE.BoxGeometry(BOX.w, BOX.h, BOX.l);
  g.translate(0, BOX.h / 2, 0);
  return g;
}

export function heroContainer(kit: Kit) {
  const mesh = new THREE.Mesh(kit.track(containerGeometry()), kit.heroMaterials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A loose container baked into a static group (per-colour material). */
function looseBox(kit: Kit, color: string, x: number, y: number, z: number, yaw = 0) {
  const mesh = new THREE.Mesh(containerGeometry(), kit.containerTint(color));
  mesh.position.set(x, y, z);
  mesh.rotation.y = yaw;
  return mesh;
}

// ── Road ──

function wheel(kit: Kit, x: number, z: number, r: number, width: number) {
  const g = new THREE.Group();
  g.add(cyl(r, width, kit.m.rubber, x, r, z, "x", 18));
  g.add(cyl(r * 0.55, width + 0.04, kit.m.chrome, x, r, z, "x", 12));
  return g;
}

export type TruckStyle = { paint: string; stripe?: THREE.Material; trim?: THREE.Material };

/** US day-cab tractor (conventional hood), origin at its centre. */
export function tractor(kit: Kit, style: TruckStyle) {
  const { m } = kit;
  const paint = paintFor(kit, style.paint);
  const g = new THREE.Group();
  g.add(box(1.0, 0.32, 6.7, m.darkSteel, 0, 0.95, 0.1));
  g.add(box(2.5, 0.4, 0.32, m.chrome, 0, 0.8, -3.32));
  const hood = new THREE.Mesh(new RoundedBoxGeometry(2.15, 1.1, 1.8, 3, 0.22), paint);
  hood.position.set(0, 1.62, -2.38);
  g.add(hood);
  g.add(box(1.3, 0.98, 0.08, m.chrome, 0, 1.58, -3.28));
  for (const x of [-0.82, 0.82]) {
    g.add(box(0.38, 0.2, 0.08, m.headlight, x, 1.24, -3.29));
    g.add(box(0.62, 0.28, 1.25, m.black, x * 1.3, 1.24, -2.42));
  }
  const cab = new THREE.Mesh(new RoundedBoxGeometry(2.46, 2.4, 2.15, 3, 0.16), paint);
  cab.position.set(0, 2.32, -0.55);
  g.add(cab);
  g.add(box(2.48, 0.2, 2.17, style.stripe ?? m.darkSteel, 0, 1.72, -0.55));
  g.add(box(2.28, 0.98, 0.06, m.glass, 0, 2.92, -1.62));
  g.add(box(2.36, 0.14, 0.36, m.black, 0, 3.44, -1.74));
  for (const x of [-1.235, 1.235]) {
    g.add(box(0.06, 0.82, 1.1, m.glass, x, 2.92, -0.98));
    g.add(box(0.07, 0.5, 0.22, m.black, x * 1.2, 2.75, -1.48));
    g.add(cyl(0.1, 3.1, m.chrome, x * 1.06, 2.75, 0.66));
    g.add(cyl(0.34, 1.3, m.aluminium, x * 0.9, 0.86, -0.55, "z", 18));
    g.add(box(0.55, 0.12, 0.6, m.black, x * 0.95, 0.5, -1.35));
  }
  g.add(box(2.3, 0.75, 0.25, style.trim ?? paint, 0, 3.6, -0.3));
  g.add(box(1.6, 0.16, 1.3, m.black, 0, 1.2, 2.25));
  for (const x of [-0.95, 0.95]) g.add(box(0.62, 0.72, 0.05, m.black, x, 0.78, 3.42));
  g.add(wheel(kit, -1.08, -2.42, 0.52, 0.32));
  g.add(wheel(kit, 1.08, -2.42, 0.52, 0.32));
  for (const z of [1.6, 2.92]) for (const x of [-0.95, 0.95]) g.add(wheel(kit, x, z, 0.52, 0.62));
  return bake(g);
}

const paints = new WeakMap<Kit, Map<string, THREE.MeshStandardMaterial>>();
function paintFor(kit: Kit, color: string) {
  let map = paints.get(kit);
  if (!map) paints.set(kit, (map = new Map()));
  let mat = map.get(color);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.35 });
    map.set(color, mat);
  }
  return mat;
}
export function disposePaints(kit: Kit) {
  paints.get(kit)?.forEach((mat) => mat.dispose());
  paints.delete(kit);
}

/** 40 ft container chassis, origin at its centre; deck at CHASSIS_DECK. */
export function chassis(kit: Kit) {
  const { m } = kit;
  const g = new THREE.Group();
  for (const x of [-0.5, 0.5]) g.add(box(0.22, 0.42, 12.2, m.darkSteel, x, 1.12, 0));
  for (const z of [-5.2, -3, -1, 1, 3, 5.2]) g.add(box(2.3, 0.12, 0.16, m.darkSteel, 0, 1.3, z));
  for (const z of [-6.0, 6.0]) g.add(box(2.42, 0.26, 0.36, m.darkSteel, 0, 1.24, z));
  for (const x of [-0.62, 0.62]) {
    g.add(box(0.13, 0.95, 0.13, m.steel, x, 0.6, -3.7));
    g.add(box(0.3, 0.08, 0.3, m.steel, x, 0.14, -3.7));
  }
  g.add(box(2.3, 0.16, 0.16, m.red, 0, 0.62, 6.28));
  for (const x of [-1.0, 1.0]) g.add(box(0.26, 0.16, 0.05, m.taillight, x, 0.86, 6.24));
  for (const z of [4.05, 5.35]) for (const x of [-0.95, 0.95]) g.add(wheel(kit, x, z, 0.5, 0.6));
  return bake(g);
}

/** 53 ft dry van (other carriers, docked trailers). */
export function dryVan(kit: Kit) {
  const { m } = kit;
  const g = new THREE.Group();
  g.add(box(2.6, 2.85, 16.1, m.van, 0, 1.25 + 1.42, 0));
  g.add(box(1.0, 0.3, 15.6, m.darkSteel, 0, 1.1, 0));
  for (const z of [5.6, 6.9]) for (const x of [-0.95, 0.95]) g.add(wheel(kit, x, z, 0.5, 0.6));
  for (const x of [-1.0, 1.0]) g.add(box(0.26, 0.16, 0.05, m.taillight, x, 1.1, 8.06));
  return bake(g);
}

// ── Port ──

export type ShipSpec = {
  length: number;
  beam: number;
  deckY: number;
  seed: number;
  skip?: { x: number; z: number; tier: number };
};

/** Container ship, origin at the hull centre on the waterline plane (y = WATER_Y). */
export function ship(kit: Kit, spec: ShipSpec) {
  const { m } = kit;
  const { length: L, beam: B } = spec;
  const hb = B / 2;
  const half = L / 2;
  const deck = spec.deckY - WATER_Y;
  const shape = new THREE.Shape();
  shape.moveTo(-hb * 0.82, -half);
  shape.quadraticCurveTo(-hb, -half, -hb, -half + 7);
  shape.lineTo(-hb, half * 0.5);
  shape.quadraticCurveTo(-hb, half * 0.9, 0, half);
  shape.quadraticCurveTo(hb, half * 0.9, hb, half * 0.5);
  shape.lineTo(hb, -half + 7);
  shape.quadraticCurveTo(hb, -half, hb * 0.82, -half);
  shape.closePath();
  const hullGeo = (from: number, to: number, grow = 1) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: to - from, bevelEnabled: false, curveSegments: 14 });
    g.rotateX(-Math.PI / 2);
    g.scale(grow, 1, grow);
    g.translate(0, from, 0);
    return g;
  };
  const g = new THREE.Group();
  g.add(new THREE.Mesh(hullGeo(-7, deck), m.hull));
  g.add(new THREE.Mesh(hullGeo(-7, 0.45, 1.004), m.hullRed));
  g.add(new THREE.Mesh(hullGeo(deck - 0.5, deck + 0.02, 1.003), m.white));
  const deckShape = new THREE.Mesh(new THREE.ShapeGeometry(shape, 14), m.deck);
  deckShape.geometry.rotateX(-Math.PI / 2);
  deckShape.position.y = deck + 0.03;
  g.add(deckShape);

  // Accommodation, bridge and funnel aft (+z).
  const aft = half - 15;
  g.add(box(B * 0.72, 15, 9, m.house, 0, deck + 7.5, aft));
  for (let i = 0; i < 4; i++) g.add(box(B * 0.72 + 0.1, 0.9, 9.1, m.glass, 0, deck + 3 + i * 3.2, aft));
  g.add(box(B + 1.6, 2.6, 5, m.house, 0, deck + 16.3, aft - 1.5));
  g.add(box(B + 1.7, 1, 5.1, m.glass, 0, deck + 16.5, aft - 1.5));
  g.add(box(4.6, 8, 5, m.navy, 0, deck + 19, aft + 7));
  g.add(box(4.7, 1.5, 5.1, m.cyan, 0, deck + 20.5, aft + 7));
  g.add(box(4.7, 0.8, 5.1, m.black, 0, deck + 23, aft + 7));
  g.add(cyl(0.18, 9, m.white, 0, deck + 22, aft - 2));
  g.add(cyl(0.15, 8, m.white, 0, deck + 4, -half + 6));
  // Hatch covers + container stacks.
  const r = rng(spec.seed);
  const rows = 8;
  for (let z = -15 + 13 * Math.ceil((-half + 14 + 15) / 13); z <= aft - 12; z += 13) {
    g.add(box(B - 3, 0.6, 12.6, m.darkSteel, 0, deck + 0.3, z));
    for (let row = 0; row < rows; row++) {
      const x = (row - (rows - 1) / 2) * 2.5;
      const isSkip = spec.skip && Math.abs(spec.skip.x - x) < 0.1 && Math.abs(spec.skip.z - z) < 0.1;
      const tiers = isSkip ? spec.skip!.tier : 2 + Math.floor(r() * 4);
      for (let t = 0; t < tiers; t++)
        g.add(
          looseBox(kit, OTHER_COLORS[Math.floor(r() * OTHER_COLORS.length)]!, x, deck + 0.6 + t * BOX.h, z),
        );
    }
  }
  const baked = bake(g);
  // Wake behind the hull, faded in while the ship is under way.
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(B * 3.2, L * 1.1), m.wake);
  wake.geometry.rotateX(-Math.PI / 2);
  wake.position.set(0, 0.05, half + L * 0.5);
  wake.renderOrder = 2;
  baked.add(wake);
  const bow = new THREE.Mesh(new THREE.PlaneGeometry(B * 1.6, 30), m.wake);
  bow.geometry.rotateX(-Math.PI / 2);
  bow.position.set(0, 0.06, -half + 8);
  baked.add(bow);
  return { group: baked, wakes: [wake, bow] };
}

/** Ship-to-shore crane, origin between the legs; boom reaches over the water (−x). */
export function stsCrane(kit: Kit) {
  const { m } = kit;
  const g = new THREE.Group();
  const legH = 44;
  for (const x of [-10, 10])
    for (const z of [-9, 9]) {
      g.add(box(1.4, legH, 1.4, m.craneBlue, x, legH / 2, z));
      g.add(box(2.4, 1.6, 4, m.darkSteel, x, 0.8, z));
    }
  for (const z of [-9, 9]) {
    g.add(box(21.4, 2, 1.6, m.craneBlue, 0, legH, z));
    g.add(box(20, 1, 1, m.craneBlue, 0, 22, z));
    g.add(beam([-10, 3, z], [10, 21, z], 0.7, m.craneBlue));
  }
  for (const x of [-10, 10]) g.add(box(1.6, 2, 19.4, m.craneBlue, x, legH, 0));
  // Boom (waterside) and backreach.
  for (const z of [-2.4, 2.4]) g.add(box(90, 2.6, 1.2, m.craneWhite, -16, legH + 2.4, z));
  for (let x = -60; x <= 28; x += 8) g.add(box(1, 0.6, 4.8, m.craneWhite, x, legH + 3.4, 0));
  // A-frame + stays.
  const apex: THREE.Vector3Tuple = [3, 72, 0];
  for (const z of [-6, 6]) {
    g.add(beam([10, legH, z], [apex[0], apex[1], z / 4], 1.1, m.craneBlue));
    g.add(beam([-6, legH, z], [apex[0], apex[1], z / 4], 1.1, m.craneBlue));
  }
  for (const z of [-2.4, 2.4]) {
    g.add(beam([apex[0], apex[1], z / 1.6], [-58, legH + 3.6, z], 0.25, m.darkSteel));
    g.add(beam([apex[0], apex[1], z / 1.6], [-28, legH + 3.6, z], 0.22, m.darkSteel));
    g.add(beam([apex[0], apex[1], z / 1.6], [27, legH + 3.6, z], 0.25, m.darkSteel));
  }
  g.add(box(10, 5, 7.4, m.craneWhite, 21, legH + 6.2, 0));
  g.add(box(10.1, 0.8, 7.5, m.craneBlue, 21, legH + 4, 0));
  const crane = bake(g);

  const trolley = new THREE.Group();
  trolley.add(box(5.6, 1.8, 7, m.craneWhite, 0, 0, 0));
  trolley.add(box(2.6, 2.4, 2.6, m.craneWhite, 2.4, -2.2, 3.6));
  trolley.add(box(2.4, 1.2, 0.08, m.glass, 2.4, -2.2, 2.28));
  const trolleyBaked = bake(trolley);
  trolleyBaked.position.y = legH + 0.6;
  return { crane, trolley: trolleyBaked, trolleyY: legH - 0.4 };
}

/** Spreader + hoist ropes. Position at the box top; set `ropes.scale.y` to the rope length. */
export function spreader(kit: Kit) {
  const { m } = kit;
  const group = new THREE.Group();
  const body = bake(
    (() => {
      const g = new THREE.Group();
      g.add(box(2.5, 0.5, 12.4, m.yellow, 0, 0.25, 0));
      g.add(box(2.7, 0.7, 2.6, m.darkSteel, 0, 0.7, 0));
      return g;
    })(),
  );
  group.add(body);
  const ropes = new THREE.Group();
  for (const x of [-0.9, 0.9])
    for (const z of [-0.9, 0.9]) {
      const rope = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1, 0.07), m.darkSteel);
      rope.position.set(x, 0.5, z);
      ropes.add(rope);
    }
  ropes.position.y = 1;
  group.add(ropes);
  return { group, ropes };
}

/** Portal gantry (rail ramps, yard RTGs), spanning x ∈ [−span/2, span/2]. */
export function gantry(kit: Kit, span: number, height: number, depth: number, paint: THREE.Material) {
  const { m } = kit;
  const g = new THREE.Group();
  for (const x of [-span / 2, span / 2]) {
    for (const z of [-depth / 2, depth / 2]) {
      g.add(box(1, height, 1, paint, x, height / 2, z));
      g.add(box(1.6, 1.2, 2.6, m.darkSteel, x, 0.6, z));
    }
    g.add(box(1.2, 1.6, depth + 1, paint, x, height, 0));
    g.add(box(0.8, 0.8, depth, paint, x, 1.8, 0));
  }
  for (const z of [-2.6, 2.6]) g.add(box(span + 1.2, 1.8, 1, paint, 0, height + 1.4, z));
  g.add(box(3.2, 3, 3, m.craneWhite, span / 2 - 2, height + 3.6, 0));
  const frame = bake(g);
  const trolley = bake(
    (() => {
      const t = new THREE.Group();
      t.add(box(4, 1.6, 6.6, m.darkSteel, 0, 0, 0));
      t.add(box(2, 1.8, 2, m.craneWhite, 1.6, -1.6, 2.6));
      return t;
    })(),
  );
  trolley.position.y = height + 2.6;
  return { frame, trolley, trolleyY: height + 1.6 };
}

// ── Rail ──

function bogie(kit: Kit, z: number) {
  const g = new THREE.Group();
  g.add(box(2.4, 0.7, 3.2, kit.m.darkSteel, 0, 0.95, z));
  for (const dz of [-1, 1])
    for (const x of [-0.76, 0.76]) g.add(cyl(0.46, 0.16, kit.m.steel, x, 0.88, z + dz, "x", 14));
  return g;
}

/** Freight locomotive, rail-top origin (rails at y ≈ 0.45). */
export function locomotive(kit: Kit) {
  const { m } = kit;
  const g = new THREE.Group();
  const half = LOCO_LEN / 2;
  g.add(bogie(kit, -half + 4.2));
  g.add(bogie(kit, half - 4.2));
  g.add(box(3.05, 0.6, LOCO_LEN - 0.4, m.darkSteel, 0, 1.75, 0));
  g.add(box(2.6, 1.1, 6, m.black, 0, 1.15, 0));
  g.add(box(2.7, 3.1, 14, m.loco, 0, 3.6, 2.8));
  g.add(box(2.72, 0.32, 14.02, m.yellow, 0, 2.3, 2.8));
  g.add(box(2.2, 0.5, 10, m.darkSteel, 0, 5.4, 3.6));
  const cab = new THREE.Mesh(new RoundedBoxGeometry(3.1, 3.5, 4, 3, 0.2), m.loco);
  cab.position.set(0, 3.8, -half + 4.6);
  g.add(cab);
  g.add(box(3.12, 0.32, 4.02, m.yellow, 0, 2.3, -half + 4.6));
  g.add(box(2.9, 0.9, 0.06, m.glass, 0, 4.7, -half + 2.58));
  for (const x of [-1.56, 1.56]) g.add(box(0.06, 0.8, 1.6, m.glass, x, 4.7, -half + 4.2));
  g.add(box(3.0, 1.8, 2.2, m.loco, 0, 2.95, -half + 1.5));
  g.add(box(3.02, 0.3, 2.22, m.yellow, 0, 2.3, -half + 1.5));
  for (const x of [-0.7, 0.7]) g.add(box(0.3, 0.2, 0.06, m.headlight, x, 3.4, -half + 0.38));
  g.add(box(3.1, 0.25, 0.4, m.yellow, 0, 1.5, -half + 0.3));
  return bake(g);
}

/** Double-stack well car; `load` places container colours (null = empty slot). */
export function wellCar(kit: Kit, lower: string | null, upper: string | null) {
  const { m } = kit;
  const g = new THREE.Group();
  const half = WELL_LEN / 2;
  g.add(bogie(kit, -half + 1.4));
  g.add(bogie(kit, half - 1.4));
  for (const x of [-1.4, 1.4]) g.add(box(0.32, 1.5, WELL_LEN - 3.2, m.wellCar, x, 1.35, 0));
  for (const z of [-half + 1.4, half - 1.4]) g.add(box(3, 1.1, 2.2, m.wellCar, 0, 1.5, z));
  g.add(box(2.5, 0.15, WELL_LEN - 4, m.darkSteel, 0, 0.68, 0));
  if (lower) g.add(looseBox(kit, lower, 0, 0.75, 0));
  if (upper) g.add(looseBox(kit, upper, 0, WELL_UPPER, 0));
  return bake(g);
}

// ── Air ──

/** Wide-body freighter, nose to −z. */
export function freighter(kit: Kit) {
  const { m } = kit;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(2.4, 34, 8, 20), m.white);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  g.add(box(4.4, 0.6, 30, m.steel, 0, -1.9, 0));
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(2.42, 20, 12, 0, Math.PI * 2, 0, 0.9), m.glass);
  cockpit.rotation.x = -Math.PI / 2 - 0.5;
  cockpit.position.set(0, 0.9, -17.2);
  cockpit.scale.set(0.82, 0.5, 0.6);
  g.add(cockpit);
  const wing = new THREE.Shape();
  wing.moveTo(0, -4);
  wing.lineTo(26, 7);
  wing.lineTo(26, 10);
  wing.lineTo(0, 7);
  wing.closePath();
  for (const side of [-1, 1]) {
    const geo = new THREE.ExtrudeGeometry(wing, { depth: 0.45, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    const w = new THREE.Mesh(geo, m.white);
    w.scale.x = side;
    w.position.set(0, -0.9, -2);
    g.add(w);
    for (const x of [8, 15]) g.add(cyl(1.05, 4.6, m.aluminium, side * x, -2.3, -7.5 + x * 0.423, "z", 18));
    const tail = new THREE.ExtrudeGeometry(
      (() => {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.lineTo(9, 4);
        s.lineTo(9, 6);
        s.lineTo(0, 4.5);
        s.closePath();
        return s;
      })(),
      { depth: 0.3, bevelEnabled: false },
    );
    tail.rotateX(Math.PI / 2);
    const t = new THREE.Mesh(tail, m.white);
    t.scale.x = side;
    t.position.set(0, 0.6, 14);
    g.add(t);
  }
  const fin = new THREE.Shape();
  fin.moveTo(0, 0);
  fin.lineTo(7.5, 0);
  fin.lineTo(10, 9);
  fin.lineTo(6.5, 9);
  fin.closePath();
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.4, bevelEnabled: false });
  finGeo.rotateY(-Math.PI / 2);
  const finMesh = new THREE.Mesh(finGeo, m.steel);
  finMesh.position.set(0.2, 1.4, 12);
  g.add(finMesh);
  return bake(g, { cast: false, receive: false });
}

// ── Traffic: instanced cars ──

export function carParts() {
  const body = new THREE.BoxGeometry(1.86, 0.78, 4.6);
  body.translate(0, 0.68, 0);
  const cabin = new THREE.BoxGeometry(1.62, 0.62, 2.5);
  cabin.translate(0, 1.37, 0.25);
  const wheels: THREE.BufferGeometry[] = [];
  for (const x of [-0.84, 0.84])
    for (const z of [-1.45, 1.45]) {
      const w = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12);
      w.rotateZ(Math.PI / 2);
      w.translate(x, 0.34, z);
      wheels.push(w.toNonIndexed());
    }
  return { body, cabin, wheels };
}

export const CAR_COLORS = [
  "#e9edf2",
  "#20242c",
  "#8b96a3",
  "#b8222c",
  "#2c5c94",
  "#c5ccd4",
  "#3d4a3e",
  "#6c7480",
];

// ── Scenery pieces ──

export function warehouse(kit: Kit, w: number, l: number, h: number, wallMat?: THREE.Material) {
  const { m } = kit;
  const g = new THREE.Group();
  g.add(box(w, h, l, wallMat ?? m.plainWall, 0, h / 2, 0));
  g.add(box(w + 0.6, 0.6, l + 0.6, m.roof, 0, h + 0.3, 0));
  for (let x = -w / 2 + 6; x < w / 2 - 4; x += 12) g.add(box(3, 1.2, 3, m.steel, x, h + 1.2, 0));
  return bake(g);
}

export function barn(kit: Kit) {
  const { m } = kit;
  const g = new THREE.Group();
  g.add(box(12, 6, 20, m.barn, 0, 3, 0));
  const roof = new THREE.Shape();
  roof.moveTo(-6.6, 0);
  roof.lineTo(0, 4.2);
  roof.lineTo(6.6, 0);
  roof.closePath();
  const geo = new THREE.ExtrudeGeometry(roof, { depth: 21, bevelEnabled: false });
  geo.translate(0, 6, -10.5);
  g.add(new THREE.Mesh(geo, m.roof));
  for (const x of [9, 13]) {
    g.add(cyl(2.4, 12, m.silo, x, 6, -6, "y", 20));
    g.add(cyl(0.1, 1.8, m.silo, x, 12.9, -6, "y", 20, 2.5));
  }
  return bake(g);
}
