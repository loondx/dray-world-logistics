import "server-only";

import { ACTIVE_LOAD_STATUSES, AWAITING_POD_STATUSES } from "@/features/loads/status";
import { todayDateOnly } from "@/lib/dates";
import { db } from "@/lib/db";
import { sumMoney } from "@/lib/money";

import { listRecentLoads } from "./load.queries";

const UPCOMING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function getDashboardCounts() {
  const [total, active, inTransit, delivered, completed, clients, carriers] = await Promise.all([
    db.load.count({ where: { status: { not: "CANCELLED" } } }),
    db.load.count({ where: { status: { in: [...ACTIVE_LOAD_STATUSES] } } }),
    db.load.count({ where: { status: { in: ["PICKED_UP", "IN_TRANSIT"] } } }),
    db.load.count({ where: { status: { in: [...AWAITING_POD_STATUSES] } } }),
    db.load.count({ where: { status: "COMPLETED" } }),
    db.client.count({ where: { status: "ACTIVE" } }),
    db.carrier.count({ where: { status: "ACTIVE" } }),
  ]);
  return { total, active, inTransit, delivered, completed, clients, carriers };
}

export async function getDashboardLists() {
  const today = todayDateOnly();
  const horizon = new Date(today.getTime() + UPCOMING_DAYS * DAY_MS);
  const [recent, upcomingPickups, upcomingDeliveries, awaitingPod] = await Promise.all([
    listRecentLoads({}, 8),
    listRecentLoads(
      {
        status: { in: ["CREATED", "ASSIGNED", "PICKUP_SCHEDULED"] },
        pickupDate: { gte: today, lte: horizon },
      },
      8,
    ),
    listRecentLoads(
      { status: { in: ["PICKED_UP", "IN_TRANSIT"] }, deliveryDate: { gte: today, lte: horizon } },
      8,
    ),
    // Delivered loads that have no (non-deleted) POD uploaded yet.
    listRecentLoads(
      { status: { in: [...AWAITING_POD_STATUSES] }, documents: { none: { type: "POD", deletedAt: null } } },
      8,
    ),
  ]);
  return { recent, upcomingPickups, upcomingDeliveries, awaitingPod };
}

// Revenue / carrier cost / gross margin for loads dated in the current calendar month.
export async function getMonthFinancials() {
  const today = todayDateOnly();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const loads = await db.load.findMany({
    where: { status: { not: "CANCELLED" }, loadDate: { gte: monthStart, lte: today } },
    select: { clientRate: true, carrierRate: true },
  });
  const revenue = sumMoney(loads.map((load) => load.clientRate));
  const cost = sumMoney(loads.map((load) => load.carrierRate));
  return { loadCount: loads.length, revenue, cost, margin: revenue.minus(cost), monthStart };
}
