"use client";

import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { usePrefersReducedMotion } from "../use-media-query";
import type { Engine } from "./engine";
import { CHAPTERS, chapterAt } from "./timeline";

// In-page anchors (header nav + journey spine), as journey progress.
const ANCHORS = [
  { id: "drayage", s: 0.225 },
  { id: "delivery", s: 0.87 },
] as const;

const SERVICES = [
  { name: "Import / Export", chapters: [0, 1] },
  { name: "Port Transportation", chapters: [1, 2] },
  { name: "Drayage", chapters: [2, 3] },
  { name: "Yard Movement", chapters: [3] },
  { name: "Rail / Intermodal", chapters: [4] },
  { name: "OTR", chapters: [5] },
  { name: "FTL", chapters: [5, 6] },
  { name: "LTL", chapters: [5, 6] },
] as const;

function supportsWebGL() {
  try {
    const test = document.createElement("canvas");
    return Boolean(test.getContext("webgl2") ?? test.getContext("webgl"));
  } catch {
    return false;
  }
}

type Status = "loading" | "ready" | "fallback";

/**
 * The service journey as a real-time 3D scene. The section is tall and the stage is pinned,
 * so native scrolling drives the story: down plays it forward, up plays it back. The
 * picture eases towards the scroll position, which keeps motion smooth on wheels and
 * trackpads alike without hijacking the page's scrolling.
 */
export function Journey3D() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const [status, setStatus] = useState<Status>("loading");
  const [chapter, setChapter] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  // Progress the picture is showing (eased); captions follow it so they match the scene.
  const shown = useMotionValue(0);
  const fadeTop = useTransform(scrollYProgress, [0, 0.025], [1, 0]);
  const fadeBottom = useTransform(scrollYProgress, [0.975, 1], [0, 1]);

  useMotionValueEvent(shown, "change", (v) => setChapter(chapterAt(v)));
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (status !== "ready") shown.set(v);
  });

  useEffect(() => {
    const el = canvas.current;
    const sec = section.current;
    if (!el || !sec) return;
    let engine: Engine | null = null;
    let disposed = false;
    let visible = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) engine?.start();
        else engine?.stop();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(sec);

    (async () => {
      if (!supportsWebGL()) throw new Error("WebGL unavailable");
      const { createEngine } = await import("./engine");
      if (disposed) return;
      engine = createEngine(el, {
        progress: () => scrollYProgress.get(),
        reducedMotion: reduce,
        mobile: window.matchMedia("(max-width: 767px), (pointer: coarse)").matches,
        onProgress: (v) => shown.set(v),
        onTag: (x, y, show) => {
          const node = tag.current;
          if (!node) return;
          // Keep the whole pill on screen.
          const edge = 70;
          const cx = Math.min(Math.max(x, edge), (node.parentElement?.clientWidth ?? x + edge) - edge);
          node.style.transform = `translate3d(${cx.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
          node.style.opacity = show ? "1" : "0";
        },
        onReady: () => setStatus("ready"),
        onLost: () => setStatus("fallback"),
      });
      if (visible) engine.start();
    })().catch(() => {
      if (!disposed) setStatus("fallback");
    });

    return () => {
      disposed = true;
      io.disconnect();
      engine?.dispose();
    };
  }, [reduce, scrollYProgress, shown]);

  const jump = (index: number) => {
    const sec = section.current;
    if (!sec) return;
    const s = index === 0 ? 0 : CHAPTERS[index]!.from + 0.02;
    const top = sec.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + s * (sec.offsetHeight - window.innerHeight),
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <section ref={section} id="journey" aria-labelledby="journey-title" className="journey3d">
      <h2 id="journey-title" className="sr-only">
        The DRAY-WORLD freight journey, from global origin to final delivery
      </h2>
      {ANCHORS.map((anchor) => (
        <span
          key={anchor.id}
          id={anchor.id}
          className="journey3d-anchor"
          style={{ top: `calc((100% - 100lvh) * ${anchor.s})` }}
        />
      ))}
      <div className="journey3d-stage">
        <canvas
          ref={canvas}
          className={cn("journey3d-canvas", status === "ready" && "is-ready")}
          aria-hidden="true"
        />
        <motion.div
          aria-hidden="true"
          className="journey3d-fade journey3d-fade-top"
          style={{ opacity: fadeTop }}
        />
        <motion.div
          aria-hidden="true"
          className="journey3d-fade journey3d-fade-bottom"
          style={{ opacity: fadeBottom }}
        />
        <div ref={tag} className="journey3d-tag" aria-hidden="true">
          <span>Your container</span>
        </div>
        {status === "loading" && (
          <p className="journey3d-status" role="status">
            Loading the 3D journey…
          </p>
        )}

        <div className="journey3d-hud">
          <div className="journey3d-caption">
            <div className="grid">
              {CHAPTERS.map((c, i) => (
                <div key={c.step} className={cn("journey3d-chapter", i === chapter && "is-active")}>
                  <p className="text-[11px] font-bold tracking-[0.18em] text-brand-blue uppercase">
                    {String(i + 1).padStart(2, "0")} · {c.step}
                  </p>
                  <p className="journey-title mt-1">{c.title}</p>
                  <p className="mt-1.5 text-sm text-slate-600">{c.line}</p>
                </div>
              ))}
            </div>
            <ol className="journey3d-steps" aria-label="Journey chapters">
              {CHAPTERS.map((c, i) => (
                <li key={c.step}>
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    aria-current={i === chapter ? "step" : undefined}
                    className={cn(i < chapter && "is-reached", i === chapter && "is-current")}
                  >
                    <span className="sr-only">
                      Go to step {i + 1}: {c.step}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <ul className="mt-3 hidden flex-wrap gap-1.5 lg:flex" aria-label="Services on this journey">
              {SERVICES.map((service) => (
                <li
                  key={service.name}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors duration-300",
                    (service.chapters as readonly number[]).includes(chapter)
                      ? "border-brand-navy bg-brand-navy text-white"
                      : "border-slate-200 bg-white text-slate-500",
                  )}
                >
                  {service.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
