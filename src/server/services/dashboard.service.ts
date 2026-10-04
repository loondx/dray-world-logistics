import "server-only";

import type { LoadStatus } from "@/generated/prisma/enums";
import { ACTIVE_LOAD_STATUSES } from "@/features/loads/status";
import { todayDateOnly } from "@/lib/dates";
import { db } from "@/lib/db";
import { sumMoney } from "@/lib/money";

const UPCOMING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function getDashboardCounts() {
  const today = todayDateOnly();
  const [created, inProgress, pickupsToday, deliveriesToday] = await Promise.all([
    db.load.count({ where: { status: "CREATED" } }),
    db.load.count({ where: { status: "IN_PROGRESS" } }),
    db.load.count({ where: { pickupDate: today } }),
    db.load.count({ where: { deliveryDate: today } }),
  ]);
  return { created, inProgress, pickupsToday, deliveriesToday };
}

export type ScheduleEvent = {
  key: string;
  kind: "Pickup" | "Delivery";
  date: Date;
  timeFrom: string | null;
  timeTo: string | null;
  loadId: string;
  loadNumber: number;
  status: LoadStatus;
  clientName: string;
  carrierName: string | null;
  locationName: string | null;
  city: string | null;
  stateProvince: string | null;
  containerNumber: string | null;
};

const SCHEDULE_LIMIT = 30;

// Every pickup and delivery appointment from today through the next 7 days, in date
// then time order (facility-local strings sort correctly as "HH:mm"; no time first).
export async function getUpcomingSchedule(): Promise<ScheduleEvent[]> {
  const today = todayDateOnly();
  const horizon = new Date(today.getTime() + (UPCOMING_DAYS - 1) * DAY_MS);
  const window = { gte: today, lte: horizon };
  const loads = await db.load.findMany({
    where: {
      status: { in: [...ACTIVE_LOAD_STATUSES] },
      OR: [{ pickupDate: window }, { deliveryDate: window }],
    },
    select: {
      id: true,
      loadNumber: true,
      status: true,
      containerNumber: true,
      client: { select: { companyName: true } },
      carrier: { select: { legalName: true } },
      pickupDate: true,
      pickupTimeFrom: true,
      pickupTimeTo: true,
      pickupLocationName: true,
      pickupCity: true,
      pickupStateProvince: true,
      deliveryDate: true,
      deliveryTimeFrom: true,
      deliveryTimeTo: true,
      deliveryLocationName: true,
      deliveryCity: true,
      deliveryStateProvince: true,
    },
  });

  const inWindow = (date: Date | null): date is Date =>
    date !== null && date.getTime() >= today.getTime() && date.getTime() <= horizon.getTime();
  const events: ScheduleEvent[] = [];
  for (const load of loads) {
    const common = {
      loadId: load.id,
      loadNumber: load.loadNumber,
      status: load.status,
      clientName: load.client.companyName,
      carrierName: load.carrier?.legalName ?? null,
      containerNumber: load.containerNumber,
    };
    if (inWindow(load.pickupDate)) {
      events.push({
        ...common,
        key: `${load.id}-pickup`,
        kind: "Pickup",
        date: load.pickupDate,
        timeFrom: load.pickupTimeFrom,
        timeTo: load.pickupTimeTo,
        locationName: load.pickupLocationName,
        city: load.pickupCity,
        stateProvince: load.pickupStateProvince,
      });
    }
    if (inWindow(load.deliveryDate)) {
      events.push({
        ...common,
        key: `${load.id}-delivery`,
        kind: "Delivery",
        date: load.deliveryDate,
        timeFrom: load.deliveryTimeFrom,
        timeTo: load.deliveryTimeTo,
        locationName: load.deliveryLocationName,
        city: load.deliveryCity,
        stateProvince: load.deliveryStateProvince,
      });
    }
  }
  return events
    .sort(
      (a, b) =>
        a.date.getTime() - b.date.getTime() ||
        (a.timeFrom ?? "99:99").localeCompare(b.timeFrom ?? "99:99") ||
        a.loadNumber - b.loadNumber,
    )
    .slice(0, SCHEDULE_LIMIT);
}

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  loads: { id: string; loadNumber: number }[];
  count: number;
};

const ATTENTION_SAMPLE = 4;
const NO_CARRIER_DAYS = 3;
const INSURANCE_WARNING_DAYS = 30;

// Exceptions a dispatcher must act on. Items with nothing to do are left out.
export async function getAttentionItems(options: { showQuotes: boolean }): Promise<AttentionItem[]> {
  const today = todayDateOnly();
  const sample = { select: { id: true, loadNumber: true }, take: ATTENTION_SAMPLE } as const;

  const notStartedWhere = { status: "CREATED" as const, pickupDate: { lt: today } };
  const noCarrierWhere = {
    status: { in: [...ACTIVE_LOAD_STATUSES] },
    carrierId: null,
    pickupDate: { lte: new Date(today.getTime() + NO_CARRIER_DAYS * DAY_MS) },
  };
  const pastDeliveryWhere = { status: "IN_PROGRESS" as const, deliveryDate: { lt: today } };
  const insuranceWhere = {
    status: "ACTIVE" as const,
    insuranceExpiry: { lte: new Date(today.getTime() + INSURANCE_WARNING_DAYS * DAY_MS) },
  };

  const loadItem = async (where: object, orderBy: object) =>
    Promise.all([db.load.findMany({ where, orderBy, ...sample }), db.load.count({ where })]);

  const [
    [notStarted, notStartedCount],
    [noCarrier, noCarrierCount],
    [pastDelivery, pastDeliveryCount],
    insurance,
    quotes,
  ] = await Promise.all([
    loadItem(notStartedWhere, { pickupDate: "asc" }),
    loadItem(noCarrierWhere, { pickupDate: "asc" }),
    loadItem(pastDeliveryWhere, { deliveryDate: "asc" }),
    db.carrier.count({ where: insuranceWhere }),
    options.showQuotes ? db.quoteRequest.count({ where: { status: "NEW" } }) : Promise.resolve(0),
  ]);

  const items: AttentionItem[] = [
    {
      id: "late",
      title: "Not started",
      detail: "Pickup date has passed but the load is still Created.",
      href: "/loads?status=CREATED&sort=pickupDate&dir=asc",
      loads: notStarted,
      count: notStartedCount,
    },
    {
      id: "no-carrier",
      title: "No carrier assigned",
      detail: `Pickup within ${NO_CARRIER_DAYS} days and no carrier yet.`,
      href: "/loads?status=ACTIVE&sort=pickupDate&dir=asc",
      loads: noCarrier,
      count: noCarrierCount,
    },
    {
      id: "past-delivery",
      title: "Past delivery date",
      detail: "Still In progress after the delivery date. Mark Completed once paperwork is in and invoiced.",
      href: "/loads?status=IN_PROGRESS&sort=deliveryDate&dir=asc",
      loads: pastDelivery,
      count: pastDeliveryCount,
    },
    {
      id: "insurance",
      title: "Carrier insurance expiring",
      detail: `Expired or expiring within ${INSURANCE_WARNING_DAYS} days.`,
      href: "/carriers",
      loads: [],
      count: insurance,
    },
    {
      id: "quotes",
      title: "New leads",
      detail: "Website and phone leads nobody has contacted yet.",
      href: "/quotes",
      loads: [],
      count: quotes,
    },
  ];
  return items.filter((item) => item.count > 0);
}

const MONTHS = 6;

// Revenue / carrier cost / gross margin per calendar month (by load date) for the
// last 6 months, oldest first. The last entry is the current month to date.
export async function getMonthlyFinancials() {
  const today = todayDateOnly();
  const months = Array.from(
    { length: MONTHS },
    (_, index) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (MONTHS - 1 - index), 1)),
  );
  const loads = await db.load.findMany({
    where: { loadDate: { gte: months[0], lte: today } },
    select: { loadDate: true, clientRate: true, carrierRate: true, charges: { select: { amount: true } } },
  });
  return months.map((monthStart) => {
    const inMonth = loads.filter(
      (load) =>
        load.loadDate.getUTCFullYear() === monthStart.getUTCFullYear() &&
        load.loadDate.getUTCMonth() === monthStart.getUTCMonth(),
    );
    // Revenue = client rate + extra charges billed to the client.
    const revenue = sumMoney(
      inMonth.flatMap((load) => [load.clientRate, ...load.charges.map((charge) => charge.amount)]),
    );
    const cost = sumMoney(inMonth.map((load) => load.carrierRate));
    return { monthStart, loadCount: inMonth.length, revenue, cost, margin: revenue.minus(cost) };
  });
}
