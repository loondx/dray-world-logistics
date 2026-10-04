import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import Link from "next/link";

import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { formatTimeWindow, todayDateOnly } from "@/lib/dates";
import { formatCityState } from "@/lib/labels/people";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/server/services/dashboard.service";

const DAY_MS = 24 * 60 * 60 * 1000;
const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function dayHeading(date: Date, today: Date): string {
  const days = Math.round((date.getTime() - today.getTime()) / DAY_MS);
  if (days === 0) return `Today · ${dayFormat.format(date)}`;
  if (days === 1) return `Tomorrow · ${dayFormat.format(date)}`;
  return dayFormat.format(date);
}

// Pickups and deliveries for the coming week, grouped by day. One row = one appointment.
export function ScheduleList({ events }: { events: ScheduleEvent[] }) {
  const today = todayDateOnly();
  const days = new Map<number, ScheduleEvent[]>();
  for (const event of events) {
    const key = event.date.getTime();
    days.set(key, [...(days.get(key) ?? []), event]);
  }

  return (
    <div className="grid gap-4">
      {[...days.entries()].map(([key, dayEvents]) => (
        <section key={key} aria-label={dayHeading(new Date(key), today)}>
          <h3
            className={cn(
              "mb-1 text-xs font-semibold tracking-wide uppercase",
              key === today.getTime() ? "text-brand-blue" : "text-muted-foreground",
            )}
          >
            {dayHeading(new Date(key), today)}
          </h3>
          <ul className="divide-y rounded-md border">
            {dayEvents.map((event) => {
              const place =
                [event.locationName, formatCityState(event.city, event.stateProvince)]
                  .filter(Boolean)
                  .join(", ") || "Location to be advised";
              const Icon = event.kind === "Pickup" ? ArrowUpFromLine : ArrowDownToLine;
              return (
                <li key={event.key} className="relative hover:bg-muted/50">
                  <div className="grid grid-cols-[4.5rem_1fr] items-start gap-x-3 gap-y-1 px-3 py-2 text-sm sm:grid-cols-[6.5rem_1fr_auto]">
                    <div className="text-xs font-medium text-foreground tabular-nums sm:text-sm">
                      {formatTimeWindow(event.timeFrom, event.timeTo) || (
                        <span className="text-muted-foreground">No time</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-semibold",
                            event.kind === "Pickup" ? "text-brand-blue" : "text-emerald-700",
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden="true" />
                          {event.kind}
                        </span>
                        {/* Whole-row link for mouse users; the load number stays the accessible link. */}
                        <Link
                          href={`/loads/${event.loadId}`}
                          className="font-semibold text-brand-navy after:absolute after:inset-0 hover:underline"
                        >
                          #{event.loadNumber}
                        </Link>
                        <span className="min-w-0 truncate">{place}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground sm:truncate">
                        {event.clientName}
                        {event.containerNumber ? ` · ${event.containerNumber}` : ""}
                        {" · "}
                        {event.carrierName ?? (
                          <span className="font-medium whitespace-nowrap text-amber-700">No carrier</span>
                        )}
                      </div>
                    </div>
                    <div className="col-start-2 sm:col-start-auto">
                      <LoadStatusBadge status={event.status} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
