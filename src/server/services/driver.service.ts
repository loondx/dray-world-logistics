import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { DriverInput } from "@/features/drivers/schemas";
import { db } from "@/lib/db";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";
import { UserFacingError } from "@/server/errors";

import { pageArgs, type Paginated } from "./pagination";

export type DriverListItem = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  truckNumber: string | null;
  trailerNumber: string | null;
  notes: string | null;
  active: boolean;
  carrier: { id: string; legalName: string };
  loadCount: number;
};

export async function listDrivers(params: {
  q?: string;
  active: boolean;
  page: number;
}): Promise<Paginated<DriverListItem>> {
  const where: Prisma.DriverWhereInput = { active: params.active };
  if (params.q) {
    where.OR = [
      { firstName: { contains: params.q, mode: "insensitive" } },
      { lastName: { contains: params.q, mode: "insensitive" } },
      { phone: { contains: params.q } },
      { truckNumber: { contains: params.q, mode: "insensitive" } },
      { trailerNumber: { contains: params.q, mode: "insensitive" } },
      { carrier: { legalName: { contains: params.q, mode: "insensitive" } } },
    ];
  }
  const { skip, take, page, pageSize } = pageArgs(params.page);
  const [rows, total] = await Promise.all([
    db.driver.findMany({
      where,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip,
      take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        truckNumber: true,
        trailerNumber: true,
        notes: true,
        active: true,
        carrier: { select: { id: true, legalName: true } },
        _count: { select: { loads: true } },
      },
    }),
    db.driver.count({ where }),
  ]);
  return {
    items: rows.map(({ _count, ...row }) => ({ ...row, loadCount: _count.loads })),
    total,
    page,
    pageSize,
  };
}

async function assertCarrierActive(carrierId: string): Promise<void> {
  const carrier = await db.carrier.findUnique({ where: { id: carrierId }, select: { status: true } });
  if (!carrier) throw new UserFacingError("The selected carrier no longer exists.");
  if (carrier.status !== "ACTIVE") throw new UserFacingError("Drivers can only be added to active carriers.");
}

export async function createDriver(input: DriverInput, userId: string) {
  await assertCarrierActive(input.carrierId);
  return db.$transaction(async (tx) => {
    const driver = await tx.driver.create({ data: input });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.DRIVER_CREATED,
        entityType: AUDIT_ENTITIES.DRIVER,
        entityId: driver.id,
        userId,
        metadata: { carrierId: driver.carrierId },
      },
      tx,
    );
    return driver;
  });
}

export async function updateDriver(id: string, input: DriverInput, userId: string) {
  return db.$transaction(async (tx) => {
    const driver = await tx.driver.update({ where: { id }, data: input });
    await recordAudit(
      { action: AUDIT_ACTIONS.DRIVER_UPDATED, entityType: AUDIT_ENTITIES.DRIVER, entityId: id, userId },
      tx,
    );
    return driver;
  });
}

export async function setDriverActive(id: string, active: boolean, userId: string) {
  return db.$transaction(async (tx) => {
    await tx.driver.update({ where: { id }, data: { active } });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.DRIVER_UPDATED,
        entityType: AUDIT_ENTITIES.DRIVER,
        entityId: id,
        userId,
        metadata: { active },
      },
      tx,
    );
  });
}
