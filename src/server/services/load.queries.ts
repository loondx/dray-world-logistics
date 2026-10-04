import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { LoadStatus, LoadType } from "@/generated/prisma/enums";
import { ACTIVE_LOAD_STATUSES } from "@/features/loads/status";
import { db } from "@/lib/db";

import { pageArgs, type Paginated } from "./pagination";

export const LOAD_SORT_FIELDS = ["loadNumber", "pickupDate", "deliveryDate", "status"] as const;
export type LoadSortField = (typeof LOAD_SORT_FIELDS)[number];

export type LoadListFilters = {
  q?: string;
  status?: LoadStatus | "ACTIVE";
  type?: LoadType;
  clientId?: string;
  carrierId?: string;
  driverId?: string;
  pickupFrom?: Date;
  pickupTo?: Date;
  deliveryFrom?: Date;
  deliveryTo?: Date;
  sort: LoadSortField;
  direction: "asc" | "desc";
  page: number;
};

const LOAD_LIST_SELECT = {
  id: true,
  loadNumber: true,
  type: true,
  status: true,
  containerNumber: true,
  customerReference: true,
  pickupLocationName: true,
  pickupCity: true,
  pickupStateProvince: true,
  pickupDate: true,
  deliveryLocationName: true,
  deliveryCity: true,
  deliveryStateProvince: true,
  deliveryDate: true,
  clientRate: true,
  carrierRate: true,
  charges: { select: { amount: true } },
  client: { select: { id: true, companyName: true } },
  carrier: { select: { id: true, legalName: true } },
  driver: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.LoadSelect;

export type LoadListItem = Prisma.LoadGetPayload<{ select: typeof LOAD_LIST_SELECT }>;

function searchConditions(q: string): Prisma.LoadWhereInput[] {
  const contains = { contains: q, mode: "insensitive" as const };
  const conditions: Prisma.LoadWhereInput[] = [
    { containerNumber: { contains: q.replace(/[\s-]/g, ""), mode: "insensitive" } },
    { customerReference: contains },
    { bookingNumber: contains },
    { client: { companyName: contains } },
    { carrier: { legalName: contains } },
    { driver: { firstName: contains } },
    { driver: { lastName: contains } },
    { pickupLocationName: contains },
    { pickupCity: contains },
    { deliveryLocationName: contains },
    { deliveryCity: contains },
  ];
  const digits = q.replace(/^#/, "");
  if (/^\d{1,9}$/.test(digits)) conditions.unshift({ loadNumber: Number(digits) });
  return conditions;
}

function dateRange(from?: Date, to?: Date): Prisma.DateTimeNullableFilter | undefined {
  if (!from && !to) return undefined;
  return { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
}

export function buildLoadWhere(
  filters: Omit<LoadListFilters, "sort" | "direction" | "page">,
): Prisma.LoadWhereInput {
  const where: Prisma.LoadWhereInput = {};
  if (filters.status === "ACTIVE") where.status = { in: [...ACTIVE_LOAD_STATUSES] };
  else if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.carrierId) where.carrierId = filters.carrierId;
  if (filters.driverId) where.driverId = filters.driverId;
  const pickup = dateRange(filters.pickupFrom, filters.pickupTo);
  if (pickup) where.pickupDate = pickup;
  const delivery = dateRange(filters.deliveryFrom, filters.deliveryTo);
  if (delivery) where.deliveryDate = delivery;
  if (filters.q) where.OR = searchConditions(filters.q);
  return where;
}

export async function listLoads(filters: LoadListFilters): Promise<Paginated<LoadListItem>> {
  const where = buildLoadWhere(filters);
  const { skip, take, page, pageSize } = pageArgs(filters.page);
  const orderBy: Prisma.LoadOrderByWithRelationInput[] =
    filters.sort === "loadNumber"
      ? [{ loadNumber: filters.direction }]
      : [{ [filters.sort]: { sort: filters.direction, nulls: "last" } }, { loadNumber: "desc" }];

  const [items, total] = await Promise.all([
    db.load.findMany({ where, orderBy, skip, take, select: LOAD_LIST_SELECT }),
    db.load.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

// Loads for a client / carrier / driver detail page.
export function listRecentLoads(where: Prisma.LoadWhereInput, take = 10) {
  return db.load.findMany({ where, orderBy: { loadNumber: "desc" }, take, select: LOAD_LIST_SELECT });
}

export function getLoadDetail(id: string) {
  return db.load.findUnique({
    where: { id },
    include: {
      client: true,
      carrier: true,
      driver: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      charges: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getLoadNumber(id: string): Promise<number | null> {
  const load = await db.load.findUnique({ where: { id }, select: { loadNumber: true } });
  return load?.loadNumber ?? null;
}

export type LoadDetail = NonNullable<Awaited<ReturnType<typeof getLoadDetail>>>;

// For the edit form: everything the form needs, nothing else.
export function getLoadForEdit(id: string) {
  return db.load.findUnique({ where: { id } });
}

export type SavedLocation = {
  locationName: string;
  addressLine1: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  country: string | null;
  contact: string | null;
};

// Facilities used on earlier loads (pickup or delivery), newest first, for autofill.
export function listSavedLocations(limit = 500): Promise<SavedLocation[]> {
  return db.$queryRaw<SavedLocation[]>`
    SELECT "locationName", "addressLine1", "city", "stateProvince", "postalCode", "country", "contact"
    FROM (
      SELECT DISTINCT ON (lower("locationName"), lower(coalesce("addressLine1", '')))
        "locationName", "addressLine1", "city", "stateProvince", "postalCode", "country", "contact", "usedAt"
      FROM (
        SELECT "pickupLocationName" AS "locationName", "pickupAddressLine1" AS "addressLine1",
               "pickupCity" AS "city", "pickupStateProvince" AS "stateProvince",
               "pickupPostalCode" AS "postalCode", "pickupCountry" AS "country",
               "pickupContact" AS "contact", "createdAt" AS "usedAt"
        FROM "Load" WHERE "pickupLocationName" IS NOT NULL
        UNION ALL
        SELECT "deliveryLocationName", "deliveryAddressLine1", "deliveryCity", "deliveryStateProvince",
               "deliveryPostalCode", "deliveryCountry", "deliveryContact", "createdAt"
        FROM "Load" WHERE "deliveryLocationName" IS NOT NULL
      ) AS stops
      ORDER BY lower("locationName"), lower(coalesce("addressLine1", '')), "usedAt" DESC
    ) AS latest
    ORDER BY "usedAt" DESC
    LIMIT ${limit}`;
}
