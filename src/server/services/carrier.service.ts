import "server-only";

import type { Prisma, RecordStatus } from "@/generated/prisma/client";
import type { CarrierInput } from "@/features/carriers/schemas";
import { db } from "@/lib/db";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";

import { pageArgs, type Paginated } from "./pagination";

export type CarrierListItem = {
  id: string;
  legalName: string;
  dba: string | null;
  mcNumber: string | null;
  dotNumber: string | null;
  phone: string | null;
  contactPerson: string | null;
  city: string | null;
  stateProvince: string | null;
  insuranceExpiry: Date | null;
  status: RecordStatus;
  driverCount: number;
  loadCount: number;
};

export async function listCarriers(params: {
  q?: string;
  status: RecordStatus;
  page: number;
}): Promise<Paginated<CarrierListItem>> {
  const where: Prisma.CarrierWhereInput = { status: params.status };
  if (params.q) {
    where.OR = [
      { legalName: { contains: params.q, mode: "insensitive" } },
      { dba: { contains: params.q, mode: "insensitive" } },
      { mcNumber: { contains: params.q, mode: "insensitive" } },
      { dotNumber: { contains: params.q } },
      { contactPerson: { contains: params.q, mode: "insensitive" } },
      { phone: { contains: params.q } },
    ];
  }
  const { skip, take, page, pageSize } = pageArgs(params.page);
  const [rows, total] = await Promise.all([
    db.carrier.findMany({
      where,
      orderBy: { legalName: "asc" },
      skip,
      take,
      select: {
        id: true,
        legalName: true,
        dba: true,
        mcNumber: true,
        dotNumber: true,
        phone: true,
        contactPerson: true,
        city: true,
        stateProvince: true,
        insuranceExpiry: true,
        status: true,
        _count: { select: { drivers: { where: { active: true } }, loads: true } },
      },
    }),
    db.carrier.count({ where }),
  ]);
  return {
    items: rows.map(({ _count, ...row }) => ({
      ...row,
      driverCount: _count.drivers,
      loadCount: _count.loads,
    })),
    total,
    page,
    pageSize,
  };
}

export function getCarrier(id: string) {
  return db.carrier.findUnique({
    where: { id },
    include: { drivers: { orderBy: [{ active: "desc" }, { firstName: "asc" }] } },
  });
}

export type CarrierOption = {
  id: string;
  legalName: string;
  mcNumber: string | null;
  drivers: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    truckNumber: string | null;
    trailerNumber: string | null;
  }[];
};

const CARRIER_OPTION_SELECT = {
  id: true,
  legalName: true,
  mcNumber: true,
  drivers: {
    where: { active: true },
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      truckNumber: true,
      trailerNumber: true,
    },
  },
} satisfies Prisma.CarrierSelect;

// Active carriers with their active drivers, for the load form.
export function listCarrierOptions(): Promise<CarrierOption[]> {
  return db.carrier.findMany({
    where: { status: "ACTIVE" },
    orderBy: { legalName: "asc" },
    select: CARRIER_OPTION_SELECT,
  });
}

export function getCarrierOption(id: string): Promise<CarrierOption | null> {
  return db.carrier.findUnique({ where: { id }, select: CARRIER_OPTION_SELECT });
}

export async function createCarrier(input: CarrierInput, userId: string) {
  return db.$transaction(async (tx) => {
    const carrier = await tx.carrier.create({ data: { ...input, createdById: userId } });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.CARRIER_CREATED,
        entityType: AUDIT_ENTITIES.CARRIER,
        entityId: carrier.id,
        userId,
        metadata: { legalName: carrier.legalName, mcNumber: carrier.mcNumber },
      },
      tx,
    );
    return carrier;
  });
}

export async function updateCarrier(id: string, input: CarrierInput, userId: string) {
  return db.$transaction(async (tx) => {
    const carrier = await tx.carrier.update({ where: { id }, data: input });
    await recordAudit(
      { action: AUDIT_ACTIONS.CARRIER_UPDATED, entityType: AUDIT_ENTITIES.CARRIER, entityId: id, userId },
      tx,
    );
    return carrier;
  });
}

export async function setCarrierStatus(id: string, status: RecordStatus, userId: string) {
  return db.$transaction(async (tx) => {
    await tx.carrier.update({ where: { id }, data: { status } });
    await recordAudit(
      {
        action: status === "ARCHIVED" ? AUDIT_ACTIONS.CARRIER_ARCHIVED : AUDIT_ACTIONS.CARRIER_UPDATED,
        entityType: AUDIT_ENTITIES.CARRIER,
        entityId: id,
        userId,
        metadata: { status },
      },
      tx,
    );
  });
}
