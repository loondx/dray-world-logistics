import * as THREE from "three";

import { bake, beam, box, cyl, flat, ribbon, scaleUv, type Kit } from "./kit";
import {
  barn,
  CAR_COLORS,
  carParts,
  chassis,
  containerGeometry,
  dryVan,
  freighter,
  gantry,
  heroContainer,
  locomotive,
  OTHER_COLORS,
  ship,
  spreader,
  stsCrane,
  tractor,
  warehouse,
  wellCar,
} from "./models";
import { rng } from "./textures";
import {
  BORDER_Z,
  BOX,
  CHASSIS_DECK,
  CONSIST,
  cranes,
  DC,
  DOCK_DOORS,
  EXPORT,
  exportBox,
  exportTruck,
  GATE_Z,
  hero,
  HERO_CAR,
  JUNCTION_Z,
  LANE_X,
  flight,
  FLIGHTS,
  RAIL,
  RAIL_2_X,
  RAIL_X,
  RAMP_A,
  RAMP_B,
  RIVER_Z,
  S,
  SHIP,
  shipZ,
  STS_Z,
  trainCars,
  TRUCK2,
  truck1,
  truck2,
  WATER_Y,
  type Crane,
  type Rig,
} from "./timeline";

export type Quality = { mobile: boolean; trees: number };

const OURS = { paint: "#f3f5f8" } as const;
const riverZ = (x: number) => RIVER_Z + 12 * Math.sin(x / 90);
const matrix = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const up = new THREE.Vector3(0, 1, 0);
const one = new THREE.Vector3(1, 1, 1);
const place = (x: number, y: number, z: number, yaw = 0, scale: THREE.Vector3 = one) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), quat.clone().setFromAxisAngle(up, yaw), scale);

function instanced(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  matrices: THREE.Matrix4[],
  { cast = true, receive = true, colors }: { cast?: boolean; receive?: boolean; colors?: THREE.Color[] } = {},
) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, matrices.length));
  matrices.forEach((mx, i) => mesh.setMatrixAt(i, mx));
  colors?.forEach((c, i) => mesh.setColorAt(i, c));
  mesh.count = matrices.length;
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  mesh.computeBoundingSphere();
  return mesh;
}

/** Stack of loose containers in a block (bays along z). */
function stackBlock(
  kit: Kit,
  g: THREE.Group,
  r: () => number,
  x0: number,
  rows: number,
  z0: number,
  bays: number,
  maxTier = 4,
  minTier = 1,
) {
  for (let row = 0; row < rows; row++)
    for (let bay = 0; bay < bays; bay++) {
      const tiers = minTier + Math.floor(r() * (maxTier - minTier + 1));
      for (let t = 0; t < tiers; t++) {
        const mesh = new THREE.Mesh(
          containerGeometry(),
          kit.containerTint(OTHER_COLORS[Math.floor(r() * OTHER_COLORS.length)]!),
        );
        mesh.position.set(x0 + row * 2.65, t * BOX.h, z0 - bay * 12.8);
        g.add(mesh);
      }
    }
}

function rig(kit: Kit, style: { paint: string }, withStripe = true) {
  const t = tractor(kit, {
    paint: style.paint,
    stripe: withStripe ? kit.m.cyan : undefined,
    trim: kit.m.navy,
  });
  const c = chassis(kit);
  return { tractor: t, chassis: c };
}

function setPose(obj: THREE.Object3D, p: { x: number; z: number; yaw: number }, y = 0) {
  obj.position.set(p.x, y, p.z);
  obj.rotation.y = p.yaw;
}

/** Builds the whole journey world into `scene` and returns its per-frame updater. */
export function buildWorld(kit: Kit, scene: THREE.Scene, quality: Quality) {
  const { m } = kit;
  const r = rng(42);

  // ── Water and land ──
  const waterGeo = new THREE.PlaneGeometry(7000, 7000);
  waterGeo.rotateX(-Math.PI / 2);
  scaleUv(waterGeo, 7000 / 16, 7000 / 16);
  const water = new THREE.Mesh(waterGeo, m.water);
  water.position.y = WATER_Y;
  water.receiveShadow = true;
  scene.add(water);

  const land = (x0: number, x1: number, z0: number, z1: number) => {
    const geo = new THREE.BoxGeometry(x1 - x0, 8, z1 - z0);
    scaleUv(geo, (x1 - x0) / 40, (z1 - z0) / 40);
    const mesh = new THREE.Mesh(geo, [m.quayWall, m.quayWall, m.grass, m.grass, m.quayWall, m.quayWall]);
    mesh.position.set((x0 + x1) / 2, -4, (z0 + z1) / 2);
    mesh.receiveShadow = true;
    scene.add(mesh);
  };
  land(-12, 1600, -2000, 150);
  land(-1600, -12, -1300, -40);
  land(-50, -12, -2000, -1300);

  // ── Port (berth, cranes, stacks, gate, yard) ──
  const port = new THREE.Group();
  port.add(flat(72, 225, m.concrete, 24, 0.02, 37.5, 14));
  port.add(flat(0.3, 225, m.markingYellow, -11.3, 0.035, 37.5));
  port.add(flat(92, 230, m.yardAsphalt, 34, 0.02, -190, 18));
  for (let z = 140; z > -120; z -= 9)
    for (const x of [1.2, 6.8]) port.add(flat(0.16, 3.5, m.marking, x, 0.04, z));
  for (let z = 145; z > -40; z -= 18) port.add(cyl(0.3, 0.7, m.darkSteel, -11.2, 0.35, z, "y", 10));
  const stsStatic: ReturnType<typeof stsCrane>[] = [];
  STS_Z.forEach((z, i) => {
    const sts = stsCrane(kit);
    sts.crane.position.set(LANE_X, 0, z);
    port.add(sts.crane);
    if (i !== 1) {
      sts.trolley.position.set(LANE_X - 24 - i * 6, sts.trolley.position.y, z);
      port.add(sts.trolley);
    }
    stsStatic.push(sts);
  });
  stackBlock(kit, port, r, 22, 5, 132, 5, 4);
  stackBlock(kit, port, r, 40, 6, 132, 5, 3);
  stackBlock(kit, port, r, 22, 5, 48, 6, 4);
  stackBlock(kit, port, r, 40, 6, 48, 6, 3);
  port.add(warehouse(kit, 34, 22, 14, m.office));
  port.children.at(-1)!.position.set(92, 0, 70);
  port.add(warehouse(kit, 60, 36, 11, m.wall));
  port.children.at(-1)!.position.set(120, 0, -20);
  port.add(warehouse(kit, 50, 80, 10, m.wall));
  port.children.at(-1)!.position.set(124, 0, -160);
  for (const [x, z] of [
    [64, 120],
    [64, 0],
    [16, -120],
    [80, -230],
    [-14, -160],
  ] as const) {
    port.add(cyl(0.35, 32, m.steel, x, 16, z, "y", 10));
    port.add(box(3.4, 1, 1.2, m.darkSteel, x, 32, z));
  }
  // Gate: canopy, booths, sign.
  port.add(box(26, 0.9, 11, m.craneWhite, 4, 6.6, GATE_Z));
  for (const x of [-8.5, 16.5])
    for (const z of [-4.5, 4.5]) port.add(box(0.6, 6.2, 0.6, m.steel, x, 3.1, GATE_Z + z));
  for (const x of [0, 8]) {
    port.add(box(1.4, 2.7, 3.6, m.house, x, 1.35, GATE_Z));
    port.add(box(1.42, 0.9, 3.62, m.glass, x, 1.9, GATE_Z));
    port.add(box(1.8, 0.2, 4.4, m.craneBlue, x, 2.8, GATE_Z));
  }
  const gateSign = flat(14, 1.8, kit.sign(["TERMINAL GATE"], { bg: "#18234a", w: 640, h: 84 }), 4, 0, 0);
  gateSign.rotation.x = Math.PI / 2;
  gateSign.position.set(4, 6.6, GATE_Z + 5.56);
  gateSign.receiveShadow = false;
  port.add(gateSign);
  // Yard blocks + RTGs.
  stackBlock(kit, port, r, -10, 4, -95, 8, 4, 2);
  stackBlock(kit, port, r, 36, 6, -95, 8, 4, 1);
  stackBlock(kit, port, r, 56, 6, -95, 8, 3, 1);
  const rtgBlue = m.craneBlue;
  for (const [x, z, span] of [
    [-6, -128, 13],
    [42.6, -150, 17],
    [62.6, -110, 17],
  ] as const) {
    const rtg = gantry(kit, span, 17, 12, rtgBlue);
    rtg.frame.position.set(x, 0, z);
    rtg.trolley.position.set(x + 2, rtg.trolley.position.y, z);
    port.add(rtg.frame, rtg.trolley);
  }
  // Parked rigs waiting in the yard.
  for (const [x, z, color] of [
    [30, -60, "#2f5f8a"],
    [30, -240, "#b45a3c"],
    [-20, -230, "#4f7f6a"],
  ] as const) {
    const parked = rig(kit, { paint: color === "#2f5f8a" ? "#c42b2b" : "#1f3b6e" }, false);
    parked.chassis.position.set(x, 0, z);
    parked.tractor.position.set(x, 0, z - 7.4);
    const load = new THREE.Mesh(containerGeometry(), kit.containerTint(color));
    load.position.set(x, CHASSIS_DECK, z);
    port.add(parked.chassis, parked.tractor, load);
  }

  // ── Rail ──
  const rail = new THREE.Group();
  rail.add(new THREE.Mesh(kit.track(ribbon(RAIL.samples(4), 4.6, 0.06, 6)), m.ballast));
  rail.children.at(-1)!.receiveShadow = true;
  rail.add(flat(4.6, 300, m.ballast, RAIL_2_X, 0.06, -190, 6));
  rail.add(flat(4.6, 170, m.ballast, RAIL_2_X, 0.06, -935, 6));
  const sleepers: THREE.Matrix4[] = [];
  const rails: THREE.Matrix4[] = [];
  const lay = (x: number, z: number, yaw: number, step: number) => {
    const s = Math.sin(yaw);
    const c = Math.cos(yaw);
    for (const off of [-0.72, 0.72])
      rails.push(place(x + off * c, 0.32, z - off * s, yaw, new THREE.Vector3(1, 1, step)));
  };
  for (const p of RAIL.samples(0.9)) sleepers.push(place(p.x, 0.16, p.z, p.yaw));
  for (const p of RAIL.samples(2)) lay(p.x, p.z, p.yaw, 2.02);
  for (const [from, to] of [
    [-40, -340],
    [-850, -1012],
  ] as const) {
    for (let z = from; z > to; z -= 0.9) sleepers.push(place(RAIL_2_X, 0.16, z));
    for (let z = from; z > to; z -= 2) lay(RAIL_2_X, z, 0, 2.02);
  }
  for (const x of [RAIL_X, RAIL_2_X]) {
    rail.add(box(2.4, 1.2, 0.8, m.red, x, 0.7, -1010));
    rail.add(box(2.6, 0.5, 2.4, m.darkSteel, x, 0.25, -1011));
  }
  rail.add(
    instanced(kit.track(new THREE.BoxGeometry(2.6, 0.16, 0.26)), m.sleeper, sleepers, { cast: false }),
  );
  rail.add(instanced(kit.track(new THREE.BoxGeometry(0.1, 0.16, 1)), m.rail, rails, { cast: false }));
  // Ramp gantries.
  const rampA = gantry(kit, 26, 19, 20, m.yellow);
  rampA.frame.position.set(20, 0, RAMP_A);
  const rampB = gantry(kit, 26, 19, 20, m.yellow);
  rampB.frame.position.set(20, 0, RAMP_B);
  rail.add(rampA.frame, rampB.frame);
  scene.add(rampA.trolley, rampB.trolley);
  // Parked double-stack trains on the second track at both ramps.
  const parkedTrain = (z0: number, cars: number) => {
    for (let i = 0; i < cars; i++) {
      const car = wellCar(
        kit,
        OTHER_COLORS[Math.floor(r() * OTHER_COLORS.length)]!,
        r() < 0.8 ? OTHER_COLORS[Math.floor(r() * OTHER_COLORS.length)]! : null,
      );
      car.position.set(RAIL_2_X, 0, z0 - i * 18.7);
      rail.add(car);
    }
  };
  parkedTrain(-120, 10);
  parkedTrain(-870, 7);
  rail.add(flat(40, 110, m.yardAsphalt, 14, 0.02, -905, 18));
  stackBlock(kit, rail, r, 36, 2, -870, 4, 2, 1);
  // River and bridge.
  const riverPts = Array.from({ length: 141 }, (_, i) => ({ x: -700 + i * 10, z: riverZ(-700 + i * 10) }));
  rail.add(new THREE.Mesh(kit.track(ribbon(riverPts, 40, 0.025, 20)), m.bank));
  rail.add(new THREE.Mesh(kit.track(ribbon(riverPts, 28, 0.04, 20)), m.water));
  const bridgeAt = RAIL.at(RAIL.nearest(70, riverZ(70)));
  const bridge = new THREE.Group();
  bridge.add(box(5.4, 1.2, 48, m.darkSteel, 0, -0.1, 0));
  for (const x of [-2.9, 2.9]) {
    bridge.add(box(0.5, 0.5, 48, m.craneBlue, x, 4.2, 0));
    bridge.add(box(0.5, 0.5, 48, m.craneBlue, x, 0.6, 0));
    for (let z = -24; z < 24; z += 6) {
      bridge.add(beam([x, 0.6, z], [x, 4.2, z + 3], 0.32, m.craneBlue));
      bridge.add(beam([x, 4.2, z + 3], [x, 0.6, z + 6], 0.32, m.craneBlue));
    }
  }
  for (const z of [-14, 14]) bridge.add(box(4, 3, 2.4, m.quayWall, 0, -1.6, z));
  const bakedBridge = bake(bridge);
  setPose(bakedBridge, bridgeAt);
  rail.add(bakedBridge);

  // ── Countryside ──
  const country = new THREE.Group();
  const fields: { x0: number; x1: number; z0: number; z1: number }[] = [];
  const fieldMats = ["#c8b26b", "#94b36c", "#a9c27c", "#b9a57a", "#86a764", "#d2be7c"].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 1, map: kit.textures.crops }),
  );
  for (const [x0, x1] of [
    [-420, -230],
    [-220, -30],
    [110, 260],
    [270, 430],
  ] as const) {
    for (let z = -300; z > -880;) {
      const len = 70 + r() * 70;
      const zc = z - len / 2;
      if (Math.abs(zc - RIVER_Z) > 40 + len / 2) {
        const f = { x0: x0 + 4, x1: x1 - 4, z0: z - len + 4, z1: z - 4 };
        fields.push(f);
        const field = flat(
          f.x1 - f.x0,
          f.z1 - f.z0,
          fieldMats[fields.length % fieldMats.length]!,
          (f.x0 + f.x1) / 2,
          0.012,
          (f.z0 + f.z1) / 2,
          9,
        );
        if (r() < 0.5) {
          // Crop rows run the other way.
          const uv = field.geometry.attributes.uv as THREE.BufferAttribute;
          for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
        }
        country.add(field);
      }
      z -= len;
    }
  }
  for (const [x, z, yaw] of [
    [-120, -420, 0.3],
    [190, -760, -0.4],
    [330, -360, 1.2],
    [-300, -780, 0.8],
  ] as const) {
    const b = barn(kit);
    b.position.set(x, 0, z);
    b.rotation.y = yaw;
    country.add(b);
  }
  // Distant town on the far bank for depth.
  for (let i = 0; i < 26; i++) {
    const w = 14 + r() * 26;
    const h = 8 + r() * 34;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * (0.6 + r())), r() < 0.5 ? m.office : m.wall);
    b.position.set(-560 + r() * 200, h / 2, -980 - r() * 360);
    country.add(b);
  }

  // ── Highway, border, signs ──
  const road = new THREE.Group();
  const toLane = TRUCK2.nearest(LANE_X, -990);
  road.add(
    new THREE.Mesh(
      kit.track(
        ribbon(
          Array.from({ length: Math.ceil(toLane / 2) + 1 }, (_, i) => TRUCK2.at(i * 2)),
          5,
          0.03,
          10,
        ),
      ),
      m.asphalt,
    ),
  );
  road.add(flat(20.4, 405, m.asphalt, 0, 0.022, -1152.5, 12));
  road.add(flat(124, 11, m.asphalt, 12, 0.026, JUNCTION_Z, 12));
  road.add(box(0.6, 0.85, 375, m.jersey, 0, 0.42, -1145));
  for (let z = -960; z > -1340; z -= 12)
    for (const x of [-5.8, 5.8]) road.add(flat(0.18, 3.6, m.marking, x, 0.04, z));
  for (const x of [-9.7, 9.7]) road.add(flat(0.22, 380, m.marking, x, 0.04, -1148));
  road.add(flat(9, 0.5, m.marking, 5.4, 0.042, BORDER_Z + 3.4));
  for (let z = -960; z > -1320; z -= 46)
    for (const side of [-1, 1]) {
      road.add(cyl(0.16, 10, m.steel, side * 11.4, 5, z, "y", 8));
      road.add(box(3, 0.18, 0.4, m.steel, side * 10, 10, z));
      road.add(box(0.9, 0.18, 0.5, m.headlight, side * 9, 9.9, z));
    }
  // Border inspection plaza.
  road.add(box(23, 1, 16, m.craneWhite, 0, 6.8, BORDER_Z));
  road.add(box(23.1, 0.4, 16.1, m.cyan, 0, 6.2, BORDER_Z));
  for (const x of [-11, 11])
    for (const z of [-6.5, 6.5]) road.add(box(0.7, 6.2, 0.7, m.steel, x, 3.1, BORDER_Z + z));
  for (const x of [-5.8, 5.8]) {
    road.add(box(1.1, 2.7, 4.4, m.house, x, 1.35, BORDER_Z));
    road.add(box(1.12, 0.9, 4.42, m.glass, x, 1.95, BORDER_Z));
  }
  const borderSign = flat(
    16,
    1.6,
    kit.sign(["BORDER INSPECTION  ·  USA | CANADA"], { bg: "#18234a", w: 1024, h: 102 }),
    0,
    0,
    0,
  );
  borderSign.rotation.x = Math.PI / 2;
  borderSign.position.set(0, 6.8, BORDER_Z + 8.06);
  borderSign.receiveShadow = false;
  road.add(borderSign);
  road.add(warehouse(kit, 26, 18, 8, m.office));
  road.children.at(-1)!.position.set(32, 0, BORDER_Z - 4);
  road.add(flat(30, 44, m.asphalt, 32, 0.02, BORDER_Z + 26, 12));
  const gantrySign = (z: number, panels: { x: number; lines: string[]; arrow?: string; bg?: string }[]) => {
    for (const x of [0.6, 10.6]) road.add(box(0.4, 7.4, 0.4, m.steel, x, 3.7, z));
    road.add(box(10.4, 0.5, 0.5, m.steel, 5.6, 7.2, z));
    for (const p of panels) {
      const panel = flat(
        4.6,
        2.2,
        kit.sign(p.lines, { bg: p.bg ?? "#0f6b3c", w: 460, h: 220, arrow: p.arrow ?? "" }),
        0,
        0,
        0,
      );
      panel.rotation.x = Math.PI / 2;
      panel.position.set(p.x, 7.6, z + 0.3);
      panel.receiveShadow = false;
      road.add(panel);
    }
  };
  gantrySign(-1010, [{ x: 5.6, lines: ["INTERNATIONAL", "BORDER  ·  1 km"] }]);
  gantrySign(-1260, [
    { x: 3.2, lines: ["PORT", "TERMINAL"], arrow: "←" },
    { x: 8.1, lines: ["DISTRIB.", "CENTRE"], arrow: "→" },
  ]);

  // ── Distribution centre (door to door) ──
  const dc = new THREE.Group();
  dc.add(flat(110, 72, m.concrete, 78, 0.02, -1364, 14));
  const building = warehouse(kit, DC.x1 - DC.x0, DC.z1 - DC.z0, DC.h, m.plainWall);
  building.position.set((DC.x0 + DC.x1) / 2, 0, (DC.z0 + DC.z1) / 2);
  dc.add(building);
  dc.add(box(DC.x1 - DC.x0 + 0.2, 1.4, 0.2, m.navy, (DC.x0 + DC.x1) / 2, DC.h - 1.2, DC.z1 + 0.05));
  const dcSign = flat(30, 2.4, kit.sign(["DISTRIBUTION CENTRE"], { bg: "#18234a", w: 1000, h: 80 }), 0, 0, 0);
  dcSign.rotation.x = Math.PI / 2;
  dcSign.position.set((DC.x0 + DC.x1) / 2, DC.h - 3.6, DC.z1 + 0.12);
  dc.add(dcSign);
  for (const x of DOCK_DOORS) {
    dc.add(box(4, 4.6, 0.4, m.seal, x, 2.9, DC.z1 + 0.1));
    dc.add(box(3.1, 3.6, 0.2, m.dockDoor, x, 2.9, DC.z1 + 0.32));
    for (const dx of [-1.4, 1.4]) dc.add(box(0.35, 0.5, 0.35, m.black, x + dx, 1.1, DC.z1 + 0.3));
    dc.add(flat(0.2, 16, m.markingYellow, x + 2.6, 0.035, DC.z1 + 9));
  }
  for (const x of [38, 86, 110]) {
    const van = dryVan(kit);
    van.position.set(x, 0, DC.z1 + 8.65);
    van.rotation.y = Math.PI;
    const cab = tractor(kit, { paint: x === 86 ? "#c42b2b" : "#20242c", trim: m.darkSteel });
    cab.position.set(x, 0, DC.z1 + 8.65 + 9.6);
    cab.rotation.y = Math.PI;
    dc.add(van, cab);
  }

  // ── Export terminal (port to port) ──
  const exp = new THREE.Group();
  exp.add(flat(38, 140, m.concrete, -31, 0.02, -1435, 14));
  exp.add(flat(0.3, 140, m.markingYellow, -49.3, 0.035, -1435));
  const exportCrane = stsCrane(kit);
  exportCrane.crane.position.set(-36, 0, EXPORT.craneZ);
  exp.add(exportCrane.crane);
  const exportCrane2 = stsCrane(kit);
  exportCrane2.crane.position.set(-36, 0, EXPORT.craneZ - 52);
  exportCrane2.trolley.position.set(-70, exportCrane2.trolley.position.y, EXPORT.craneZ - 52);
  exp.add(exportCrane2.crane, exportCrane2.trolley);
  stackBlock(kit, exp, r, -24, 4, -1384, 7, 3);
  const exportShip = ship(kit, {
    length: EXPORT.ship.length,
    beam: EXPORT.ship.beam,
    deckY: EXPORT.ship.deckY,
    seed: 9,
    skip: { x: EXPORT.slot.x, z: EXPORT.slot.z, tier: EXPORT.slot.tier },
  });
  exportShip.group.position.set(EXPORT.ship.x, WATER_Y, EXPORT.ship.z);
  exportShip.wakes.forEach((w) => w.removeFromParent());
  exp.add(exportShip.group);

  // Bake each region (one draw call per material, culled per region).
  for (const group of [port, rail, country, road, dc, exp]) {
    const baked = bake(group);
    scene.add(baked);
  }

  // ── Trees (instanced) ──
  const railPts = RAIL.samples(10);
  const clear = (x: number, z: number) => {
    if (z > -40 && x < 160) return false; // port / sea
    if (z > -290 && x > -30 && x < 150) return false; // terminal
    if (x < -12 && z > -40) return false;
    if (z < -1290) return false; // DC, export, sea
    if (z < -840 && z > -1000 && x > -10 && x < 60) return false; // ramp B
    if (z < -920 && Math.abs(x) < 18) return false; // highway
    if (z < -1080 && z > -1160 && x > -15 && x < 55) return false; // border
    if (Math.abs(z - riverZ(x)) < 24) return false;
    if (x < -360 && z < -960) return false; // town
    for (const f of fields) if (x > f.x0 - 2 && x < f.x1 + 2 && z > f.z0 - 2 && z < f.z1 + 2) return false;
    for (const p of railPts) if (Math.hypot(p.x - x, p.z - z) < 26) return false;
    return true;
  };
  const trunks: THREE.Matrix4[] = [];
  const round: THREE.Matrix4[] = [];
  const cones: THREE.Matrix4[] = [];
  const roundColors: THREE.Color[] = [];
  const coneColors: THREE.Color[] = [];
  for (let tries = 0; trunks.length < quality.trees && tries < quality.trees * 12; tries++) {
    // Denser near the route, sparse far away.
    const near = r() < 0.7;
    const x = near ? RAIL_X + (r() - 0.5) * 380 : (r() - 0.5) * 1300;
    const z = 40 - r() * 1400;
    if (!clear(x, z)) continue;
    // Hedgerows: snap some trees to field edges.
    const s = 0.8 + r() * 0.7;
    const yaw = r() * Math.PI * 2;
    trunks.push(place(x, 0, z, yaw, new THREE.Vector3(s, s, s)));
    const shade = new THREE.Color().setHSL(0.27 + r() * 0.07, 0.32 + r() * 0.15, 0.3 + r() * 0.12);
    if (r() < 0.62) {
      round.push(place(x, 0, z, yaw, new THREE.Vector3(s, s * (0.85 + r() * 0.3), s)));
      roundColors.push(shade);
    } else {
      cones.push(place(x, 0, z, yaw, new THREE.Vector3(s, s * (0.9 + r() * 0.4), s)));
      coneColors.push(shade.offsetHSL(0.02, 0, -0.06));
    }
  }
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.8, 6);
  trunkGeo.translate(0, 1.4, 0);
  const roundGeo = new THREE.IcosahedronGeometry(2.5, 1);
  roundGeo.translate(0, 4.4, 0);
  const coneGeo = new THREE.ConeGeometry(2.3, 7, 7);
  coneGeo.translate(0, 5, 0);
  const foliage = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.92, flatShading: true });
  scene.add(
    instanced(kit.track(trunkGeo), m.trunk, trunks, { receive: false }),
    instanced(kit.track(roundGeo), foliage, round, { colors: roundColors }),
    instanced(kit.track(coneGeo), foliage, cones, { colors: coneColors }),
  );

  // ── Moving actors ──
  const mainShip = ship(kit, {
    length: SHIP.length,
    beam: SHIP.beam,
    deckY: SHIP.deckY,
    seed: 4,
    skip: { x: SHIP.slot.x, z: SHIP.slot.z, tier: SHIP.slot.tier },
  });
  scene.add(mainShip.group);
  const ourSts = stsStatic[1]!;
  scene.add(ourSts.trolley);
  const planes = FLIGHTS.map(() => {
    const air = freighter(kit);
    scene.add(air);
    return air;
  });

  const heroBox = heroContainer(kit);
  scene.add(heroBox);
  const t1 = rig(kit, OURS);
  const t2 = rig(kit, OURS);
  const te = rig(kit, OURS);
  scene.add(t1.tractor, t1.chassis, t2.tractor, t2.chassis, te.tractor, te.chassis);
  const exportLoad = new THREE.Mesh(containerGeometry(), kit.containerTint("#2f5f8a"));
  exportLoad.castShadow = true;
  scene.add(exportLoad);

  const train = CONSIST.map((car, i) => {
    const obj =
      car.kind === "loco"
        ? locomotive(kit)
        : wellCar(
            kit,
            OTHER_COLORS[(i * 3) % OTHER_COLORS.length]!,
            i === HERO_CAR ? null : OTHER_COLORS[(i * 5 + 2) % OTHER_COLORS.length]!,
          );
    scene.add(obj);
    return obj;
  });

  const spreaders = {
    sts: spreader(kit),
    rampA: spreader(kit),
    rampB: spreader(kit),
    export: spreader(kit),
  };
  for (const sp of Object.values(spreaders)) scene.add(sp.group);
  scene.add(exportCrane.trolley);

  // Oncoming traffic (instanced, time-driven).
  const parts = carParts();
  const CARS = 14;
  const carBody = new THREE.InstancedMesh(
    kit.track(parts.body),
    new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.5 }),
    CARS,
  );
  const carCabin = new THREE.InstancedMesh(kit.track(parts.cabin), m.glass, CARS);
  const wheelGeo = kit.track(mergeWheels(parts.wheels));
  const carWheels = new THREE.InstancedMesh(wheelGeo, m.rubber, CARS);
  for (let i = 0; i < CARS; i++) carBody.setColorAt(i, new THREE.Color(CAR_COLORS[i % CAR_COLORS.length]!));
  for (const mesh of [carBody, carCabin, carWheels]) {
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    scene.add(mesh);
  }
  const traffic = Array.from({ length: CARS }, (_, i) => ({
    x: i % 2 ? -7.6 : -4,
    speed: i % 2 ? 24 : 28,
    offset: (i * 61) % 380,
  }));

  const scale = new THREE.Vector3();
  const pos = new THREE.Vector3();

  // A truck that starts moving backwards (the visitor scrolls up) swings round on its
  // trailer and drives back cab-first. Backing into the dock stays a true reverse.
  const TURN_SECONDS = 0.7;
  const facing = () => ({ last: null as number | null, back: false, turn: 0 });
  const facings = { t1: facing(), t2: facing(), te: facing() };
  const placeRig = (
    rig: { tractor: THREE.Object3D; chassis: THREE.Object3D },
    pose: Rig,
    state: ReturnType<typeof facing>,
    dt: number,
  ) => {
    if (state.last !== null) {
      const moved = pose.dist - state.last;
      if (Math.abs(moved) > 0.01) state.back = moved < 0 && !pose.reversing;
      if (pose.reversing) state.back = false;
    }
    state.last = pose.dist;
    const goal = state.back ? 1 : 0;
    state.turn =
      dt <= 0
        ? goal
        : goal > state.turn
          ? Math.min(goal, state.turn + dt / TURN_SECONDS)
          : Math.max(goal, state.turn - dt / TURN_SECONDS);
    const angle = Math.PI * (state.turn * state.turn * (3 - 2 * state.turn));
    const { trailer, tractor } = pose;
    // Rotate the tractor about the trailer centre (yaw convention of Object3D.rotation.y).
    const dx = tractor.x - trailer.x;
    const dz = tractor.z - trailer.z;
    const c = Math.cos(angle);
    const sn = Math.sin(angle);
    setPose(rig.chassis, { ...trailer, yaw: trailer.yaw + angle });
    setPose(rig.tractor, {
      x: trailer.x + dx * c + dz * sn,
      z: trailer.z - dx * sn + dz * c,
      yaw: tractor.yaw + angle,
    });
    return angle;
  };
  const placeCrane = (
    c: Crane,
    trolley: THREE.Object3D,
    trolleyY: number,
    sp: { group: THREE.Object3D; ropes: THREE.Object3D },
  ) => {
    trolley.position.x = c.x;
    trolley.position.z = c.z;
    sp.group.position.set(c.x, c.hookY, c.z);
    sp.ropes.scale.y = Math.max(0.1, trolleyY - c.hookY - 1);
  };

  return {
    update(s: number, t: number, dt: number) {
      // Ship + wake
      const z = shipZ(s);
      mainShip.group.position.set(SHIP.x, WATER_Y, z);
      const speed = Math.min(1, Math.abs(shipZ(Math.max(0, s - 0.004)) - z) / 6);
      m.wake.opacity = speed * 0.85;
      // Plane
      planes.forEach((air, i) => {
        const p = flight(i, t);
        air.position.set(p.x, p.y, p.z);
        air.rotation.set(p.pitch, p.yaw, 0.05 * Math.sin(t * 0.4 + i), "YXZ");
      });
      // Our container + carriers
      const h = hero(s);
      heroBox.position.set(h.x, h.y, h.z);
      const turn1 = placeRig(t1, truck1(s), facings.t1, dt);
      const turn2 = placeRig(t2, truck2(s), facings.t2, dt);
      const turnE = placeRig(te, exportTruck(s), facings.te, dt);
      // On a trailer, the box turns with it.
      heroBox.rotation.y = h.yaw + (s >= S.lift1[1] && s < S.lift2[0] ? turn1 : s >= S.lift3[1] ? turn2 : 0);
      const eb = exportBox(s);
      exportLoad.position.set(eb.x, eb.y, eb.z);
      exportLoad.rotation.y = eb.yaw + (s < S.exportLift[0] ? turnE : 0);
      trainCars(s).forEach((car, i) => setPose(train[i]!, car.pose, 0));
      train.at(-1)!.rotation.y += Math.PI; // pusher faces backwards
      // Cranes
      placeCrane(cranes.sts(s), ourSts.trolley, ourSts.trolleyY, spreaders.sts);
      placeCrane(cranes.rampA(s), rampA.trolley, rampA.trolleyY, spreaders.rampA);
      placeCrane(cranes.rampB(s), rampB.trolley, rampB.trolleyY, spreaders.rampB);
      placeCrane(cranes.export(s), exportCrane.trolley, exportCrane.trolleyY, spreaders.export);
      // Water + traffic (ambient, wall clock)
      kit.textures.water.offset.set(t * 0.006, t * 0.011);
      traffic.forEach((car, i) => {
        const run = (t * car.speed + car.offset) % 380;
        const fade = Math.min(1, run / 8, (380 - run) / 8);
        pos.set(car.x, 0, -1340 + run);
        scale.setScalar(Math.max(0.001, fade));
        matrix.compose(pos, quat.setFromAxisAngle(up, Math.PI), scale);
        carBody.setMatrixAt(i, matrix);
        carCabin.setMatrixAt(i, matrix);
        carWheels.setMatrixAt(i, matrix);
      });
      carBody.instanceMatrix.needsUpdate = true;
      carCabin.instanceMatrix.needsUpdate = true;
      carWheels.instanceMatrix.needsUpdate = true;
      return h;
    },
    dispose() {
      foliage.dispose();
      fieldMats.forEach((mat) => mat.dispose());
      (carBody.material as THREE.Material).dispose();
    },
  };
}

function mergeWheels(list: THREE.BufferGeometry[]) {
  const total = list.reduce((n, g) => n + g.attributes.position!.count, 0);
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  let o = 0;
  for (const g of list) {
    pos.set(g.attributes.position!.array as Float32Array, o * 3);
    nor.set(g.attributes.normal!.array as Float32Array, o * 3);
    o += g.attributes.position!.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  return out;
}
