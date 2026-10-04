import "server-only";

import type { LoadStatus } from "@/generated/prisma/enums";
import type { LoadInput } from "@/features/loads/schemas";
import { db, type DbTransaction } from "@/lib/db";
import { toDecimal, type MoneyValue } from "@/lib/money";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";
import { UserFacingError } from "@/server/errors";

export type LoadWriteOptions = { userId: string; canWriteRates: boolean };

async function assertParties(
  tx: DbTransaction,
  input: LoadInput,
  existing?: { clientId: string; carrierId: string | null },
): Promise<void> {
  const client = await tx.client.findUnique({ where: { id: input.clientId }, select: { status: true } });
  if (!client) throw new UserFacingError("The selected client no longer exists.");
  if (client.status !== "ACTIVE" && existing?.clientId !== input.clientId) {
    throw new UserFacingError("The selected client is archived. Restore it before using it on a load.");
  }

  if (input.carrierId) {
    const carrier = await tx.carrier.findUnique({ where: { id: input.carrierId }, select: { status: true } });
    if (!carrier) throw new UserFacingError("The selected carrier no longer exists.");
    if (carrier.status !== "ACTIVE" && existing?.carrierId !== input.carrierId) {
      throw new UserFacingError("The selected carrier is archived. Restore it before assigning it.");
    }
  }

  if (input.driverId) {
    const driver = await tx.driver.findUnique({ where: { id: input.driverId }, select: { carrierId: true } });
    if (!driver || driver.carrierId !== input.carrierId) {
      throw new UserFacingError("The selected driver does not belong to the selected carrier.");
    }
  }
}

export async function createLoad(input: LoadInput, options: LoadWriteOptions) {
  // Users without `financials:write` cannot set rates.
  const data = options.canWriteRates ? input : { ...input, clientRate: null, carrierRate: null };
  const status: LoadStatus = "CREATED";

  // Load, initial status history and audit entry commit together or not at all.
  return db.$transaction(async (tx) => {
    await assertParties(tx, input);
    const load = await tx.load.create({
      data: { ...data, status, createdById: options.userId, updatedById: options.userId },
      select: { id: true, loadNumber: true },
    });
    await tx.loadStatusHistory.create({
      data: {
        loadId: load.id,
        previousStatus: null,
        newStatus: status,
        changedById: options.userId,
        notes: "Load created",
      },
    });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.LOAD_CREATED,
        entityType: AUDIT_ENTITIES.LOAD,
        entityId: load.id,
        userId: options.userId,
        metadata: { loadNumber: load.loadNumber, type: input.type },
      },
      tx,
    );
    return load;
  });
}

function sameMoney(a: MoneyValue, b: MoneyValue): boolean {
  const left = toDecimal(a);
  const right = toDecimal(b);
  if (!left || !right) return left === right;
  return left.equals(right);
}

export async function updateLoad(id: string, input: LoadInput, options: LoadWriteOptions) {
  return db.$transaction(async (tx) => {
    const existing = await tx.load.findUnique({
      where: { id },
      select: {
        clientId: true,
        carrierId: true,
        status: true,
        clientRate: true,
        carrierRate: true,
        type: true,
      },
    });
    if (!existing) throw new UserFacingError("This load no longer exists.");
    await assertParties(tx, input, existing);

    // Without `financials:write`, rates are left untouched (undefined = "don't change" in Prisma).
    const data = options.canWriteRates ? input : { ...input, clientRate: undefined, carrierRate: undefined };
    const load = await tx.load.update({
      where: { id },
      // The load type is chosen at creation and never changes.
      data: { ...data, type: existing.type, updatedById: options.userId },
      select: { id: true, loadNumber: true },
    });

    await recordAudit(
      {
        action: AUDIT_ACTIONS.LOAD_UPDATED,
        entityType: AUDIT_ENTITIES.LOAD,
        entityId: id,
        userId: options.userId,
      },
      tx,
    );
    if (options.canWriteRates) {
      if (!sameMoney(existing.clientRate, input.clientRate)) {
        await recordAudit(
          {
            action: AUDIT_ACTIONS.CLIENT_RATE_CHANGED,
            entityType: AUDIT_ENTITIES.LOAD,
            entityId: id,
            userId: options.userId,
            metadata: { from: existing.clientRate?.toString() ?? null, to: input.clientRate },
          },
          tx,
        );
      }
      if (!sameMoney(existing.carrierRate, input.carrierRate)) {
        await recordAudit(
          {
            action: AUDIT_ACTIONS.CARRIER_RATE_CHANGED,
            entityType: AUDIT_ENTITIES.LOAD,
            entityId: id,
            userId: options.userId,
            metadata: { from: existing.carrierRate?.toString() ?? null, to: input.carrierRate },
          },
          tx,
        );
      }
    }

    return load;
  });
}

async function applyStatusChange(
  tx: DbTransaction,
  loadId: string,
  previousStatus: LoadStatus,
  newStatus: LoadStatus,
  userId: string,
  notes: string | null,
): Promise<void> {
  // Optimistic concurrency: only succeeds if nobody changed the status meanwhile.
  const updated = await tx.load.updateMany({
    where: { id: loadId, status: previousStatus },
    data: { status: newStatus, updatedById: userId },
  });
  if (updated.count !== 1) {
    throw new UserFacingError("The load status was changed by someone else. Refresh and try again.");
  }
  await tx.loadStatusHistory.create({
    data: { loadId, previousStatus, newStatus, changedById: userId, notes },
  });
  await recordAudit(
    {
      action: AUDIT_ACTIONS.STATUS_CHANGED,
      entityType: AUDIT_ENTITIES.LOAD,
      entityId: loadId,
      userId,
      metadata: { from: previousStatus, to: newStatus },
    },
    tx,
  );
}

export async function changeLoadStatus(
  loadId: string,
  newStatus: LoadStatus,
  notes: string | null,
  userId: string,
): Promise<{ previousStatus: LoadStatus }> {
  return db.$transaction(async (tx) => {
    const load = await tx.load.findUnique({ where: { id: loadId }, select: { status: true } });
    if (!load) throw new UserFacingError("This load no longer exists.");
    if (load.status === newStatus) throw new UserFacingError("The load already has this status.");
    await applyStatusChange(tx, loadId, load.status, newStatus, userId, notes);
    return { previousStatus: load.status };
  });
}

// There is no "cancelled" status: a load that never started is deleted instead.
// Only a Created load with no documents (not even deleted ones) qualifies, so no
// paperwork or history of a real move can ever be lost. The audit entry keeps a record.
export async function deleteLoad(loadId: string, userId: string): Promise<{ loadNumber: number }> {
  return db.$transaction(async (tx) => {
    const load = await tx.load.findUnique({
      where: { id: loadId },
      select: { loadNumber: true, status: true, clientId: true, _count: { select: { documents: true } } },
    });
    if (!load) throw new UserFacingError("This load no longer exists.");
    if (load.status !== "CREATED")
      throw new UserFacingError("Only loads that have not started (status Created) can be deleted.");
    if (load._count.documents > 0)
      throw new UserFacingError("This load has documents, so it cannot be deleted.");

    await tx.loadStatusHistory.deleteMany({ where: { loadId } });
    await tx.load.delete({ where: { id: loadId } }); // extra charges cascade
    await recordAudit(
      {
        action: AUDIT_ACTIONS.LOAD_DELETED,
        entityType: AUDIT_ENTITIES.LOAD,
        entityId: loadId,
        userId,
        metadata: { loadNumber: load.loadNumber, clientId: load.clientId },
      },
      tx,
    );
    return { loadNumber: load.loadNumber };
  });
}
