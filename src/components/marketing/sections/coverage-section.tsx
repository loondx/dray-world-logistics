"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

import { INK } from "@/components/marketing/journey/palette";
import {
  arc,
  BORDER_PATH,
  GATEWAYS,
  HUBS,
  INLAND_LANES,
  MAP_DOT_SIZE,
  MAP_DOTS,
  OCEAN_LABELS,
  OCEAN_LANES,
  placePoint,
  project,
} from "@/components/marketing/journey/north-america";
import { Reveal } from "@/components/marketing/reveal";
import { usePrefersReducedMotion } from "@/components/marketing/journey/use-media-query";

const clamp = { clamp: true } as const;

const OCEAN = OCEAN_LANES.map(({ from, to }) => arc(from, placePoint(to), 0.25));
const INLAND = INLAND_LANES.map(([a, b]) => arc(placePoint(a), placePoint(b), 0.16));

export function CoverageSection() {
  const ref = useRef<HTMLElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 45%"] });
  const [canadaX, canadaY] = project([-108, 58]);
  const [usaX, usaY] = project([-101, 40]);

  return (
    <section
      ref={ref}
      id="coverage"
      aria-labelledby="coverage-title"
      className="relative scroll-mt-16 overflow-x-clip bg-white py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <Reveal>
          <p className="freight-eyebrow">Coverage</p>
          <h2 id="coverage-title" className="freight-heading mt-3">
            Global origins.
            <br />
            <span className="text-brand-blue">Delivered across the USA &amp; Canada.</span>
          </h2>
          <p className="mt-4 max-w-md text-base text-slate-600 sm:text-lg">
            Freight lands at the ports. We move it inland by road and rail, all the way to your door.
          </p>
          <ul className="mt-6 grid gap-2.5 text-sm font-medium text-brand-navy" aria-label="Map legend">
            <li className="flex items-center gap-3">
              <span className="h-0.5 w-7 bg-brand-red/70" aria-hidden="true" />
              Global origins, arriving by ocean
            </li>
            <li className="flex items-center gap-3">
              <span
                className="size-3 rounded-full bg-brand-blue ring-4 ring-brand-blue/20"
                aria-hidden="true"
              />
              Port and rail gateways
            </li>
            <li className="flex items-center gap-3">
              <span className="h-0.5 w-7 bg-brand-navy" aria-hidden="true" />
              Inland delivery lanes
            </li>
          </ul>
        </Reveal>

        <div className="relative">
          <svg
            viewBox="-70 -20 850 470"
            className="h-auto w-full"
            role="img"
            aria-label="Map of the USA and Canada: ocean freight arrives at Pacific, Atlantic and Gulf gateways, then moves inland along road and rail lanes."
          >
            <path d={MAP_DOTS.canada} stroke="#a3bfe4" strokeWidth={MAP_DOT_SIZE} strokeLinecap="round" />
            <path d={MAP_DOTS.usa} stroke="#bac8db" strokeWidth={MAP_DOT_SIZE} strokeLinecap="round" />
            <path d={BORDER_PATH} fill="none" stroke={INK.steel} strokeWidth={1.5} strokeDasharray="4 5" />
            <text x={canadaX} y={canadaY} textAnchor="middle" className="map-label">
              CANADA
            </text>
            <text x={usaX} y={usaY} textAnchor="middle" className="map-label">
              USA
            </text>
            {OCEAN_LABELS.map(({ text, at: [x, y] }) => (
              <text key={text} x={x} y={y} textAnchor="middle" className="map-ocean">
                {text}
              </text>
            ))}
            {OCEAN_LANES.map(({ from: [x, y] }, i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3.5}
                fill="none"
                stroke={INK.red}
                strokeWidth={1.5}
                opacity={0.7}
              />
            ))}

            {OCEAN.map((d, i) => (
              <Lane
                key={d}
                d={d}
                progress={scrollYProgress}
                window={[i * 0.04, 0.3 + i * 0.04]}
                ocean
                reduce={reduce}
              />
            ))}
            {INLAND.map((d, i) => (
              <Lane
                key={d}
                d={d}
                progress={scrollYProgress}
                window={[0.35 + i * 0.03, 0.6 + i * 0.03]}
                reduce={reduce}
              />
            ))}
            {!reduce
              ? INLAND.map((d, i) => (
                  <rect
                    key={d}
                    x={-5}
                    y={-3.5}
                    width={10}
                    height={7}
                    rx={1.5}
                    fill={i % 3 ? INK.navy : INK.red}
                  >
                    <animateMotion
                      dur={`${5 + (i % 4)}s`}
                      begin={`${(i * 0.7) % 4}s`}
                      repeatCount="indefinite"
                      path={d}
                      rotate="auto"
                    />
                  </rect>
                ))
              : null}

            {HUBS.map((place) => {
              const [x, y] = placePoint(place);
              return <circle key={place} cx={x} cy={y} r={4} fill={INK.navy} stroke="#fff" strokeWidth={2} />;
            })}
            {GATEWAYS.map((place, i) => {
              const [x, y] = placePoint(place);
              return (
                <g key={place}>
                  {!reduce ? (
                    <circle cx={x} cy={y} r={7} fill="none" stroke={INK.blue} strokeWidth={2}>
                      <animate
                        attributeName="r"
                        values="7;18"
                        dur="2.4s"
                        begin={`${i * 0.3}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.7;0"
                        dur="2.4s"
                        begin={`${i * 0.3}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  ) : null}
                  <circle cx={x} cy={y} r={6.5} fill={INK.blue} stroke="#fff" strokeWidth={2.5} />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}

function Lane({
  d,
  progress,
  window: [start, end],
  ocean = false,
  reduce,
}: {
  d: string;
  progress: MotionValue<number>;
  window: [number, number];
  ocean?: boolean;
  reduce: boolean;
}) {
  const length = useTransform(progress, [start, end], [0, 1], clamp);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={ocean ? INK.red : INK.navy}
      strokeWidth={ocean ? 2 : 2.4}
      strokeLinecap="round"
      opacity={ocean ? 0.75 : 0.85}
      style={{ pathLength: reduce ? 1 : length }}
    />
  );
}
