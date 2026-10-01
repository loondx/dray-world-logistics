"use client";

import { ArrowDown, ArrowRight, Container, Ship, Truck } from "lucide-react";
import Link from "next/link";

import { HeroGlobe } from "@/components/marketing/journey/globe";
import { usePrefersReducedMotion } from "@/components/marketing/journey/use-media-query";
import { Button } from "@/components/ui/button";

const CUES = [
  { icon: Ship, label: "Import / export" },
  { icon: Container, label: "Drayage & intermodal" },
  { icon: Truck, label: "OTR · FTL · LTL" },
] as const;

export function HeroSection() {
  const reduce = usePrefersReducedMotion();
  return (
    <section id="top" aria-labelledby="hero-title" className="hero-sky relative overflow-x-clip">
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 pt-24 pb-14 sm:px-6 sm:pt-28 lg:min-h-[100svh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-20 lg:pb-16">
        {/* CSS entrance: the headline never waits on hydration. */}
        <div className="hero-enter relative z-10">
          <p className="freight-eyebrow">Containerized logistics · USA &amp; Canada</p>
          <h1 id="hero-title" className="journey-hero-title mt-4">
            From the port to your door.
            <br />
            <span className="text-brand-blue">One team. Every mile.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-slate-600 sm:text-lg">
            Drayage, rail and truckload across the USA and Canada. We pick up at the terminal, handle every
            handoff and deliver to your dock.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-6">
              <Link href="#quote">
                Get a quote <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 bg-white/70 px-6">
              <Link href="#journey">
                Follow the journey <ArrowDown />
              </Link>
            </Button>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200/80 pt-6 text-sm font-medium text-brand-navy">
            {CUES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-brand-blue" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-globe relative mx-auto w-full max-w-[min(560px,88vw)] lg:max-w-[600px]">
          <HeroGlobe animate={!reduce} className="block aspect-square w-full" />
        </div>
      </div>
      <p className="scroll-cue" aria-hidden="true">
        Scroll to follow your container <span>↓</span>
      </p>
    </section>
  );
}
