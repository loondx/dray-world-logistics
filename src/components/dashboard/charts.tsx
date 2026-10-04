import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Lightweight dashboard charts: plain HTML/CSS, rendered on the server, no chart library.
// Specs: one series per chart (the panel title names it, so no legend), bars <= 24px thick
// with 4px rounded data-ends, hairline solid gridlines, round axis ticks, values visible as
// text with the detail in a hover tooltip.

// Brand-family blue validated for charts on the light surface (lightness band, chroma,
// ≥ 3:1 contrast). The brand navy itself is too dark to read as a colour in a chart.
export const CHART_COLOR = "#2b4c9b";

const PLOT_HEIGHT = 140;

// Smallest "nice" number (1, 1.5, 2, 3, 4, 5, 6, 8 × 10^n) ≥ value; its half is round too.
export function niceCeiling(value: number, minimum = 4): number {
  const target = Math.max(value, minimum);
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const step = [1, 1.5, 2, 3, 4, 5, 6, 8, 10].find((factor) => factor * magnitude >= target) ?? 10;
  return step * magnitude;
}

/** Vertical columns from one baseline; the last (current) column carries its value label. */
export function ColumnChart({
  data,
  formatTick = (value) => value.toLocaleString("en-US"),
  ariaLabel,
}: {
  data: { label: string; value: number; valueLabel: string; tooltip: ReactNode }[];
  formatTick?: (value: number) => string;
  ariaLabel: string;
}) {
  const max = niceCeiling(Math.max(0, ...data.map((datum) => datum.value)));
  const ticks = [max, max / 2, 0];

  return (
    <figure aria-label={ariaLabel} className="grid grid-cols-[auto_1fr] gap-x-2 pt-4">
      <div
        className="relative text-right text-[11px] text-muted-foreground tabular-nums"
        style={{ height: PLOT_HEIGHT }}
      >
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute right-0 -translate-y-1/2 leading-none"
            style={{ top: `${(1 - tick / max) * 100}%` }}
          >
            {formatTick(tick)}
          </span>
        ))}
      </div>

      <div className="relative" style={{ height: PLOT_HEIGHT }}>
        {ticks.map((tick) => (
          <span
            key={tick}
            className={cn("absolute inset-x-0 h-px", tick === 0 ? "bg-border" : "bg-border/60")}
            style={{ top: `${(1 - tick / max) * 100}%` }}
            aria-hidden="true"
          />
        ))}
        {/* Right padding leaves room for the last column's value label. */}
        <div className="absolute inset-0 flex pr-4" aria-hidden="true">
          {data.map((datum, index) => {
            const isLast = index === data.length - 1;
            return (
              <div
                key={datum.label}
                className="group relative flex flex-1 flex-col items-center justify-end rounded-t-md hover:bg-muted/50"
              >
                {isLast && datum.value > 0 ? (
                  <span className="mb-1 text-[11px] font-semibold whitespace-nowrap">{datum.valueLabel}</span>
                ) : null}
                <span
                  className="w-full max-w-6 rounded-t-[4px]"
                  style={{
                    height: datum.value > 0 ? `max(2px, ${(datum.value / max) * 100}%)` : 0,
                    backgroundColor: CHART_COLOR,
                  }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  {datum.tooltip}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div />
      <div className="mt-1.5 flex pr-4 text-[11px] text-muted-foreground" aria-hidden="true">
        {data.map((datum) => (
          <span key={datum.label} className="flex-1 truncate text-center">
            {datum.label}
          </span>
        ))}
      </div>

      {/* The same values as text for assistive technology. */}
      <ul className="sr-only">
        {data.map((datum) => (
          <li key={datum.label}>{datum.tooltip}</li>
        ))}
      </ul>
    </figure>
  );
}
