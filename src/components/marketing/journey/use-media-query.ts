"use client";

import { useSyncExternalStore } from "react";

// SSR-safe matchMedia subscription (server snapshot: `false`).
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Hydration-safe reduced-motion preference: `false` during SSR and hydration, then the
// real value. (motion's useReducedMotion reads it on the first client render, which
// makes conditionally rendered markup mismatch the server HTML.)
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
