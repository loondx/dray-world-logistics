import type { LoadStatus } from "@/generated/prisma/enums";

// Three statuses only:
//   Created     booked, not started yet (an unstarted load can be deleted instead of cancelled)
//   In progress dispatched, on the road, or delivered and waiting for paperwork
//   Completed   delivered and paperwork in
export const LOAD_STATUS_ORDER: readonly LoadStatus[] = ["CREATED", "IN_PROGRESS", "COMPLETED"];

export const LOAD_STATUS_LABELS: Record<LoadStatus, string> = {
  CREATED: "Created",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export type StatusTone = "neutral" | "progress" | "success";

export const LOAD_STATUS_TONES: Record<LoadStatus, StatusTone> = {
  CREATED: "neutral",
  IN_PROGRESS: "progress",
  COMPLETED: "success",
};

// Loads still being worked on (dashboard "Open", default list filter group).
export const ACTIVE_LOAD_STATUSES: readonly LoadStatus[] = ["CREATED", "IN_PROGRESS"];

export function nextLoadStatus(status: LoadStatus): LoadStatus | null {
  const index = LOAD_STATUS_ORDER.indexOf(status);
  return LOAD_STATUS_ORDER[index + 1] ?? null;
}
