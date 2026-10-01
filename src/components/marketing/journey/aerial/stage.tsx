"use client";

import { useRef, type ReactNode } from "react";

import { AerialActors } from "./actors";
import { AerialCaptions } from "./captions";
import { useWorldCenter } from "./use-world-center";
import { WORLD } from "./world";

// In-page anchors (header nav + journey spine). Each lands its world y on the ride line.
const ANCHORS = [
  { id: "services", y: 2300 },
  { id: "delivery", y: 6840 },
] as const;

// Client half of the aerial journey: measures the rendered map, turns native scroll into
// world position, and drives the moving layer and the captions. The static ground map
// arrives pre-rendered from the server.
export function AerialStage({ ground }: { ground: ReactNode }) {
  const world = useRef<HTMLDivElement>(null);
  const c = useWorldCenter(world);
  return (
    <>
      <div ref={world} className="aerial-world">
        {ground}
        <AerialActors c={c} />
        {ANCHORS.map((anchor) => (
          <span
            key={anchor.id}
            id={anchor.id}
            className="aerial-anchor"
            style={{ top: `${(anchor.y / WORLD.height) * 100}%` }}
          />
        ))}
      </div>
      <div className="aerial-hud">
        <div className="aerial-hud-sticky">
          <AerialCaptions c={c} />
        </div>
      </div>
    </>
  );
}
