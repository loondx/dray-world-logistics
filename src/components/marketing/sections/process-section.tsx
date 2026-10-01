"use client";

import { ClipboardList, Container, PackageCheck, Truck, type LucideIcon } from "lucide-react";
import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

import { Reveal } from "@/components/marketing/reveal";
import { PROCESS_STEPS } from "@/config/marketing-content";
import { usePrefersReducedMotion } from "@/components/marketing/journey/use-media-query";

const ICONS: LucideIcon[] = [ClipboardList, Truck, Container, PackageCheck];

// Request → Move → Handle → Deliver. A container token rides the line with scroll and
// each station lights up as it arrives.
export function ProcessSection() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 55%"] });
  const done = useMotionValue(1);
  const progress = reduce ? done : scrollYProgress;
  const across = useTransform(progress, (v) => `calc(12.5% + ${v * 75}% - 18px)`);
  const down = useTransform(progress, (v) => `calc(${v * 100}% - 10px)`);

  return (
    <section
      id="process"
      aria-labelledby="process-title"
      className="scroll-mt-16 bg-[#f4f8fd] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="freight-eyebrow">How it works</p>
          <h2 id="process-title" className="freight-heading mt-3">
            Request. Move. Handle. <span className="text-brand-blue">Deliver.</span>
          </h2>
        </Reveal>

        <ol
          ref={ref}
          className="relative mx-auto mt-12 grid max-w-md gap-9 pl-16 md:mt-16 md:max-w-none md:grid-cols-4 md:gap-6 md:pl-0"
        >
          {/* Track (vertical on mobile, horizontal from md) */}
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[27px] w-0.5 bg-slate-200 md:top-[27px] md:right-[12.5%] md:bottom-auto md:left-[12.5%] md:h-0.5 md:w-auto"
          />
          <motion.span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[27px] w-0.5 origin-top bg-brand-blue md:hidden"
            style={{ scaleY: progress }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute top-[27px] right-[12.5%] left-[12.5%] hidden h-0.5 origin-left bg-brand-blue md:block"
            style={{ scaleX: progress }}
          />
          <motion.span
            aria-hidden="true"
            className="process-token left-[10px] md:hidden"
            style={{ top: down }}
          />
          <motion.span
            aria-hidden="true"
            className="process-token top-[17px] hidden md:block"
            style={{ left: across }}
          />

          {PROCESS_STEPS.map((step, i) => (
            <Station
              key={step.title}
              index={i}
              progress={progress}
              title={step.title}
              body={step.body}
              Icon={ICONS[i] ?? PackageCheck}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Station({
  index,
  progress,
  title,
  body,
  Icon,
}: {
  index: number;
  progress: MotionValue<number>;
  title: string;
  body: string;
  Icon: LucideIcon;
}) {
  const at = index / 3;
  const lit = useTransform(progress, [at - 0.04, at + 0.01], [0, 1]);
  return (
    <li className="relative md:flex md:flex-col md:items-center md:text-center">
      <span className="absolute top-0 -left-16 z-[2] flex size-14 items-center justify-center overflow-hidden rounded-full bg-white text-brand-navy shadow-sm ring-2 ring-slate-200 md:relative md:top-auto md:left-auto">
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-brand-navy"
          style={{ opacity: lit }}
        />
        <Icon className="relative size-6" aria-hidden="true" />
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-white"
          style={{ opacity: lit }}
        >
          <Icon className="size-6" />
        </motion.span>
      </span>
      <div className="pt-1 md:pt-5">
        <p className="text-xs font-bold tracking-[0.2em] text-brand-red">0{index + 1}</p>
        <h3 className="font-display text-3xl font-bold tracking-tight text-brand-navy uppercase">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{body}</p>
      </div>
    </li>
  );
}
