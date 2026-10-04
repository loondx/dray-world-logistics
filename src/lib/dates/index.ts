// Two kinds of time values exist in this system:
//
// 1. DATE-ONLY values (load date, pickup/delivery appointment dates). Stored in
//    PostgreSQL DATE columns; Prisma returns them as a Date at 00:00 UTC. They are
//    always read and written with UTC accessors so no browser/server time zone can
//    shift the calendar day.
// 2. TIMESTAMPS (createdAt, generatedAt, status changes). Real instants, displayed
//    in the company's time zone.
//
// Appointment TIMES are facility-local wall-clock strings ("08:00") and are never
// converted.

export const COMPANY_TIME_ZONE = "America/Toronto";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

// "2026-10-01" → Date at 2026-10-01T00:00:00Z, or null when invalid.
export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  if (year === undefined || month === undefined || day === undefined) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  const roundTrips =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return roundTrips ? date : null;
}

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

// Date-only → "2026-10-01" (for <input type="date">).
export function toDateInputValue(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

// Date-only → "10/01/2026".
export function formatDateOnly(date: Date | null | undefined, fallback = "-"): string {
  if (!date) return fallback;
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}/${date.getUTCFullYear()}`;
}

// Date-only → "Thu, Oct 1" (compact UI display).
export function formatDateOnlyShort(date: Date | null | undefined, fallback = "-"): string {
  if (!date) return fallback;
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Today's calendar date in the company time zone, as a date-only value.
export function todayDateOnly(now: Date = new Date()): Date {
  const iso = now.toLocaleDateString("en-CA", { timeZone: COMPANY_TIME_ZONE }); // YYYY-MM-DD
  return parseDateOnly(iso) ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Timestamp → "10/01/2026 2:35 PM" in the company time zone.
export function formatTimestamp(date: Date | null | undefined, fallback = "-"): string {
  if (!date) return fallback;
  return date.toLocaleString("en-US", {
    timeZone: COMPANY_TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// "08:00", "16:00" → "08:00 - 16:00"; either side may be missing.
export function formatTimeWindow(from: string | null | undefined, to: string | null | undefined): string {
  if (from && to) return `${from} - ${to}`;
  return from ?? to ?? "";
}

// Appointment line for documents: "12/26/2026 08:00 - 16:00".
export function formatAppointment(
  date: Date | null | undefined,
  from: string | null | undefined,
  to: string | null | undefined,
): string {
  return [date ? formatDateOnly(date) : "", formatTimeWindow(from, to)].filter(Boolean).join(" ") || "TBD";
}
