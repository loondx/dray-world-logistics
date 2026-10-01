import type { LoadStatus } from "@/generated/prisma/enums";

// Operational order of statuses (drives the status menu and "next step" hint).
export const LOAD_STATUS_ORDER: readonly LoadStatus[] = [
  "DRAFT",
  "CREATED",
  "ASSIGNED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "DOCUMENTS_PENDING",
  "COMPLETED",
  "CANCELLED",
];

export const LOAD_STATUS_LABELS: Record<LoadStatus, string> = {
  DRAFT: "Draft",
  CREATED: "Created",
  ASSIGNED: "Assigned",
  PICKUP_SCHEDULED: "Pickup scheduled",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  DOCUMENTS_PENDING: "Docs pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export type StatusTone = "neutral" | "info" | "progress" | "success" | "warning" | "danger";

export const LOAD_STATUS_TONES: Record<LoadStatus, StatusTone> = {
  DRAFT: "neutral",
  CREATED: "neutral",
  ASSIGNED: "info",
  PICKUP_SCHEDULED: "info",
  PICKED_UP: "progress",
  IN_TRANSIT: "progress",
  DELIVERED: "success",
  DOCUMENTS_PENDING: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};

// Loads still being worked on (dashboard "Active", default list filter group).
export const ACTIVE_LOAD_STATUSES: readonly LoadStatus[] = [
  "CREATED",
  "ASSIGNED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "DOCUMENTS_PENDING",
];

// Delivered but proof of delivery not yet received.
export const AWAITING_POD_STATUSES: readonly LoadStatus[] = ["DELIVERED", "DOCUMENTS_PENDING"];

export function nextLoadStatus(status: LoadStatus): LoadStatus | null {
  if (status === "COMPLETED" || status === "CANCELLED") return null;
  const index = LOAD_STATUS_ORDER.indexOf(status);
  return LOAD_STATUS_ORDER[index + 1] ?? null;
}
