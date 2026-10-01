"use client";

// Animated boxes for the 2.5D aerial map (see volume-static.tsx for the projection).
import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";

import { lift, prismFaces, type BoxProps, type Face } from "./volume-static";

// At most two faces of a box are ever visible, so each animated box renders exactly two
// paths; an unused slot gets an empty path.
const faceAttr = (list: Face[], i: number, key: keyof Face) =>
  list[i]?.[key] ?? (key === "d" ? "M0,0" : "none");

function AnimatedBox({
  faces,
  tx,
  ty,
  roof,
}: {
  faces: MotionValue<Face[]>;
  tx: MotionValue<number>;
  ty: MotionValue<number>;
  roof: ReactNode;
}) {
  const d0 = useTransform(faces, (l) => faceAttr(l, 0, "d"));
  const f0 = useTransform(faces, (l) => faceAttr(l, 0, "fill"));
  const d1 = useTransform(faces, (l) => faceAttr(l, 1, "d"));
  const f1 = useTransform(faces, (l) => faceAttr(l, 1, "fill"));
  return (
    <g>
      <motion.path d={d0} fill={f0} />
      <motion.path d={d1} fill={f1} />
      <motion.g style={{ x: tx, y: ty }}>{roof}</motion.g>
    </g>
  );
}

/** A box inside a group rotated by `deg`: its faces re-solve as it turns. */
export function SpinBox({
  w,
  h,
  H,
  z0 = 0,
  color,
  side,
  roof,
  rx = 1,
  deg,
}: BoxProps & { deg: MotionValue<number> }) {
  const faces = useTransform(deg, (d) => prismFaces(w, h, z0, H, d, color, side));
  const tx = useTransform(deg, (d) => lift(z0 + H, d)[0]);
  const ty = useTransform(deg, (d) => lift(z0 + H, d)[1]);
  return (
    <AnimatedBox
      faces={faces}
      tx={tx}
      ty={ty}
      roof={roof ?? <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={rx} fill={color} />}
    />
  );
}

/** A box whose base height is animated (a container on the crane hook). */
export function LiftBox({
  w,
  h,
  H,
  color,
  side,
  roof,
  rx = 1,
  z0,
}: Omit<BoxProps, "z0"> & { z0: MotionValue<number> }) {
  const faces = useTransform(z0, (z) => prismFaces(w, h, z, H, 0, color, side));
  const tx = useTransform(z0, (z) => lift(z + H, 0)[0]);
  const ty = useTransform(z0, (z) => lift(z + H, 0)[1]);
  return (
    <AnimatedBox
      faces={faces}
      tx={tx}
      ty={ty}
      roof={roof ?? <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={rx} fill={color} />}
    />
  );
}

/** Painted-on details of a vehicle's front face: shown only while it faces south. */
export function FrontFace({ deg, children }: { deg: MotionValue<number>; children: ReactNode }) {
  const opacity = useTransform(deg, (d) => Math.max(0, 1 - Math.abs(d) / 12));
  return <motion.g style={{ opacity }}>{children}</motion.g>;
}

/** Shifts children by the screen lean of height `z`, in a frame turning with `deg`. */
export function Lifted({ z, deg, children }: { z: number; deg: MotionValue<number>; children: ReactNode }) {
  const x = useTransform(deg, (d) => lift(z, d)[0]);
  const y = useTransform(deg, (d) => lift(z, d)[1]);
  return <motion.g style={{ x, y }}>{children}</motion.g>;
}
