"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

// Chapters keyed to world position (c). Minimal copy: step, headline, one line.
const CHAPTERS = [
  {
    from: -Infinity,
    to: 1500,
    step: "01 · Global origin",
    title: "Freight from anywhere.",
    line: "Ocean and air connections from global origins.",
  },
  {
    from: 1500,
    to: 2300,
    step: "02 · Port",
    title: "Off the vessel.",
    line: "Import and export containers, crane-handled at the terminal.",
  },
  {
    from: 2300,
    to: 2900,
    step: "03 · Pickup",
    title: "Onto our chassis.",
    line: "Port transportation and drayage, out through the gate.",
  },
  {
    from: 2900,
    to: 3620,
    step: "04 · Yard",
    title: "Through the yard.",
    line: "Yard movement, staged for the next leg.",
  },
  {
    from: 3620,
    to: 5360,
    step: "05 · Rail",
    title: "Rail and intermodal.",
    line: "Coordinated at both ramps.",
  },
  {
    from: 5360,
    to: 6860,
    step: "06 · Road",
    title: "Across the USA & Canada.",
    line: "Over-the-road, full truckload and less-than-truckload.",
  },
  {
    from: 6860,
    to: Infinity,
    step: "07 · Final delivery",
    title: "Door to door. Port to port.",
    line: "Backed in at your dock — or straight to the terminal for export. POD on file.",
  },
] as const;

const SERVICES = [
  { name: "Import / Export", from: 0, to: 2300 },
  { name: "Port Transportation", from: 1500, to: 2900 },
  { name: "Drayage", from: 2300, to: 3620 },
  { name: "Yard Movement", from: 2900, to: 3620 },
  { name: "Rail / Intermodal", from: 3620, to: 5360 },
  { name: "OTR", from: 5360, to: 6860 },
  { name: "FTL", from: 5360, to: 6860 },
  { name: "LTL", from: 5360, to: 6860 },
] as const;

const FADE = 45;

export function AerialCaptions({ c }: { c: MotionValue<number> }) {
  return (
    <div className="aerial-caption">
      <div className="grid">
        {CHAPTERS.map((chapter) => (
          <Chapter key={chapter.step} c={c} {...chapter} />
        ))}
      </div>
      <ul className="mt-4 hidden flex-wrap gap-1.5 lg:flex" aria-label="Services on this journey">
        {SERVICES.map((service) => (
          <Chip key={service.name} c={c} {...service} />
        ))}
      </ul>
    </div>
  );
}

function Chapter({
  c,
  from,
  to,
  step,
  title,
  line,
}: {
  c: MotionValue<number>;
  from: number;
  to: number;
  step: string;
  title: string;
  line: string;
}) {
  // Sequential, never overlapping: the old chapter fades out just before `to`,
  // the next fades in just after `from` (they share the boundary).
  const opacity = useTransform(c, (v) => {
    const fadeIn = from === -Infinity ? 1 : Math.min(1, Math.max(0, (v - from) / FADE));
    const fadeOut = to === Infinity ? 1 : Math.min(1, Math.max(0, (to - v) / FADE));
    return Math.min(fadeIn, fadeOut);
  });
  const y = useTransform(opacity, (o) => (1 - o) * 8);
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  return (
    <motion.div style={{ opacity, y, visibility }} className="[grid-area:1/1]">
      <p className="text-[11px] font-bold tracking-[0.18em] text-brand-blue uppercase">{step}</p>
      <p className="journey-title mt-1">{title}</p>
      <p className="mt-1.5 text-sm text-slate-600">{line}</p>
    </motion.div>
  );
}

function Chip({ c, name, from, to }: { c: MotionValue<number>; name: string; from: number; to: number }) {
  const on = useTransform(c, (v) => (v >= from && v < to ? 1 : 0));
  return (
    <li className="relative overflow-hidden rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
      <motion.span aria-hidden="true" className="absolute inset-0 bg-brand-navy" style={{ opacity: on }} />
      <span className="relative">{name}</span>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-white"
        style={{ opacity: on }}
      >
        {name}
      </motion.span>
    </li>
  );
}
