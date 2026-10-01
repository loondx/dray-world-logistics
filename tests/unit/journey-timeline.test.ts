import { describe, expect, it } from "vitest";

import {
  BOX,
  cameraAt,
  chapterAt,
  CHAPTERS,
  cranes,
  DC,
  exportBox,
  exportTruck,
  hero,
  HERO_CAR,
  RAIL_X,
  RAMP_A,
  RAMP_B,
  S,
  STS_HOOK,
  trainCars,
  truck1,
  truck2,
  type Pose3,
} from "@/components/marketing/journey/scene/timeline";

const STEPS = 20000;
const sweep = <T>(fn: (s: number) => T) => Array.from({ length: STEPS + 1 }, (_, i) => fn(i / STEPS));
const gap = (a: Pose3, b: Pose3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe("3D journey timeline", () => {
  it("moves our container continuously, so scrolling either way never jumps", () => {
    const poses = sweep(hero);
    let worst = 0;
    for (let i = 1; i < poses.length; i++) worst = Math.max(worst, gap(poses[i - 1]!, poses[i]!));
    // ≈ 1,500 m of travel over 20,000 steps; a hand-off glitch would show as a jump of metres.
    expect(worst).toBeLessThan(0.6);
  });

  it("is a pure function of scroll progress (reversible)", () => {
    for (const s of [0.05, 0.17, 0.33, 0.41, 0.55, 0.64, 0.8, 0.93]) {
      expect(hero(s)).toEqual(hero(s));
    }
  });

  it("hands the box between carriers at the right places", () => {
    const pick = hero(S.lift1[0]);
    expect(pick.z).toBeCloseTo(STS_HOOK, 3);
    const onTruck = hero(S.lift1[1] + 0.001);
    expect(onTruck.x).toBeCloseTo(4, 3);
    const rampA = hero(S.lift2[0]);
    expect(rampA.z).toBeCloseTo(RAMP_A, 1);
    const onTrain = hero(S.lift2[1] + 0.001);
    expect(onTrain.x).toBeCloseTo(RAIL_X, 2);
    const rampB = hero(S.lift3[0]);
    expect(rampB.z).toBeCloseTo(RAMP_B, 1);
    expect(rampB.x).toBeCloseTo(RAIL_X, 2);
  });

  it("backs the trailer up to the dock door", () => {
    const end = truck2(1);
    expect(end.reversing).toBe(true);
    expect(end.trailer.x).toBeCloseTo(DC.door, 3);
    expect(end.trailer.z - BOX.l / 2).toBeGreaterThan(DC.z1);
    expect(end.trailer.z - BOX.l / 2 - DC.z1).toBeLessThan(1.5);
    expect(hero(1).y).toBeGreaterThan(1);
  });

  it("keeps the export truck clear of ours", () => {
    let closest = Infinity;
    for (let i = 0; i <= 2000; i++) {
      const s = i / 2000;
      const a = truck2(s);
      const b = exportTruck(s);
      for (const p of [a.trailer, a.tractor])
        for (const q of [b.trailer, b.tractor]) closest = Math.min(closest, Math.hypot(p.x - q.x, p.z - q.z));
    }
    // Side by side in adjacent border lanes is 3.6 m; anything less would be a collision.
    expect(closest).toBeGreaterThan(3.4);
  });

  it("moves the export box continuously onto the export ship", () => {
    const poses = sweep(exportBox);
    for (let i = 1; i < poses.length; i++) expect(gap(poses[i - 1]!, poses[i]!)).toBeLessThan(0.6);
    expect(poses.at(-1)!.x).toBeLessThan(-50);
  });

  it("keeps the trolley over the box while it is on the hook", () => {
    for (const s of [0.15, 0.18, 0.2]) {
      const box = hero(s);
      const sts = cranes.sts(s);
      expect(sts.x).toBeCloseTo(box.x, 6);
      expect(sts.hookY).toBeCloseTo(box.y + BOX.h, 6);
    }
  });

  it("keeps the first truck parked under the crane until the box is down", () => {
    expect(truck1(0).trailer.z).toBeCloseTo(truck1(S.lift1[1]).trailer.z, 6);
    expect(trainCars(0)[HERO_CAR]!.pose.z).toBeCloseTo(RAMP_A, 1);
  });

  it("has a caption for every part of the journey and a sane camera", () => {
    expect(chapterAt(0)).toBe(0);
    expect(chapterAt(1)).toBe(CHAPTERS.length - 1);
    for (let i = 0; i <= 100; i++) {
      const cam = cameraAt(i / 100);
      expect(cam.distance).toBeGreaterThan(30);
      expect(cam.elevation).toBeGreaterThan(5);
    }
  });
});
