"use client";

import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const STOPS = [
  { id: "top", label: "Global origin" },
  { id: "journey", label: "Port arrival" },
  { id: "drayage", label: "Drayage · rail · road" },
  { id: "delivery", label: "Final delivery" },
  { id: "services", label: "All services" },
  { id: "coverage", label: "USA & Canada" },
  { id: "process", label: "How it works" },
  { id: "quote", label: "Your next move" },
] as const;

/** Where the shipment marker rides, as a fraction of the viewport height. */
const RIDE = 0.55;
/** Keeps the first station clear of the fixed header. */
const HEADER_CLEAR = 116;

type Stop = (typeof STOPS)[number] & { top: number };

// The page-long route: a line down the whole landing page that fills as you scroll,
// with a station per section. The marker (a top-down container truck) is fixed at RIDE
// so it never lags native scrolling; it turns around when the visitor scrolls back up.
export function JourneySpine() {
  const ref = useRef<HTMLDivElement>(null);
  const origin = useRef(0);
  const [stops, setStops] = useState<Stop[]>([]);
  const [length, setLength] = useState(0);
  const [active, setActive] = useState(0);
  const [reverse, setReverse] = useState(false);
  const { scrollY } = useScroll();
  const reached = useMotionValue(0);
  const ended = useTransform(reached, (r) => (length && r >= length - 2 ? 0 : 1));

  const sync = (y: number, route: number, list: Stop[]) => {
    const position = Math.min(route, Math.max(0, y + window.innerHeight * RIDE - origin.current));
    reached.set(position);
    let current = 0;
    list.forEach((stop, i) => {
      if (stop.top <= position + 1) current = i;
    });
    setActive(current);
  };

  // Measure the route (the spine's parent is <main>) and every station on it.
  useEffect(() => {
    const main = ref.current?.parentElement;
    if (!main) return;
    const measure = () => {
      const box = main.getBoundingClientRect();
      origin.current = box.top + window.scrollY;
      const list = STOPS.flatMap((stop) => {
        const el = document.getElementById(stop.id);
        return el ? [{ ...stop, top: el.getBoundingClientRect().top - box.top }] : [];
      });
      setLength(box.height);
      setStops(list);
      sync(window.scrollY, box.height, list);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    return () => observer.disconnect();
    // sync only touches stable refs/setters and the motion value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? y;
    if (y !== previous) setReverse(y < previous);
    sync(y, length, stops);
  });

  return (
    <div ref={ref} className="journey-spine" aria-hidden={stops.length === 0 || undefined}>
      <span className="journey-spine-track" />
      <motion.span className="journey-spine-fill" style={{ height: reached }} />
      <nav aria-label="Shipment journey">
        <ol>
          {stops.map((stop, i) => (
            <li key={stop.id} style={{ top: Math.max(stop.top, HEADER_CLEAR) }}>
              <a
                href={`#${stop.id}`}
                aria-current={i === active ? "step" : undefined}
                className={cn("journey-spine-stop group", i <= active && "is-reached")}
              >
                <span className="journey-spine-label">{stop.label}</span>
                <span className="journey-spine-node" />
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <motion.span className="journey-spine-marker" style={{ opacity: ended }}>
        <svg viewBox="0 0 16 34" className={cn(reverse && "is-reverse")}>
          {/* Top-down container truck, cab leading (downwards). */}
          <rect x="1.5" y="1" width="13" height="22" rx="1.5" fill="var(--brand-cyan)" />
          <path d="M4 4v16M8 4v16M12 4v16" stroke="#fff" strokeOpacity=".45" strokeWidth="1" />
          <rect x="2.5" y="24.5" width="11" height="8.5" rx="2.5" fill="var(--brand-navy)" />
          <rect x="4" y="29" width="8" height="2.4" rx="1" fill="#cdeef8" />
        </svg>
      </motion.span>
    </div>
  );
}
