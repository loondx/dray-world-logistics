"use client";

import { useMotionValue, useMotionValueEvent, useScroll, type MotionValue } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";

import { RIDE, WORLD } from "./world";

/**
 * World y (SVG units) under the ride line of the viewport, from native scroll.
 * Measured from the rendered map, so it is correct at every breakpoint and crop.
 */
export function useWorldCenter(map: RefObject<HTMLElement | null>): MotionValue<number> {
  const c = useMotionValue(-1000);
  const metrics = useRef({ top: 0, scale: 1 });
  const { scrollY } = useScroll();

  useEffect(() => {
    const el = map.current;
    if (!el) return;
    const sync = () => {
      const { top, scale } = metrics.current;
      c.set((window.scrollY + window.innerHeight * RIDE - top) / scale);
    };
    const measure = () => {
      const box = el.getBoundingClientRect();
      metrics.current = { top: box.top + window.scrollY, scale: box.width / WORLD.width || 1 };
      sync();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [map, c]);

  useMotionValueEvent(scrollY, "change", (y) => {
    const { top, scale } = metrics.current;
    c.set((y + window.innerHeight * RIDE - top) / scale);
  });

  return c;
}
