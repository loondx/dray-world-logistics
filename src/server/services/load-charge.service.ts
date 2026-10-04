import "server-only";

import type { LoadChargeInput } from "@/features/loads/schemas";
import { db } from "@/lib/db";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";
import { UserFacingError } from "@/server/errors";

// Extra charges billed to the client. They change what the next invoice version shows;
// invoices already generated keep the amounts they were printed with.

export async function addLoadCharge(loadId: string, input: LoadChargeInput, userId: string) {
  return db.$transaction(async (tx) => {
    const load = await tx.load.findUnique({ where: { id: loadId }, select: { id: true } });
    if (!load) throw new UserFacingError("This load no longer exists.");
    const charge = await tx.loadCharge.create({
      data: { loadId, description: input.description, amount: input.amount, createdById: userId },
      select: { id: true },
    });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.LOAD_CHARGE_ADDED,
        entityType: AUDIT_ENTITIES.LOAD,
        entityId: loadId,
        userId,
        metadata: { chargeId: charge.id, description: input.description, amount: input.amount },
      },
      tx,
    );
    return charge;
  });
}

export async function removeLoadCharge(chargeId: string, userId: string): Promise<{ loadId: string }> {
  return db.$transaction(async (tx) => {
    const charge = await tx.loadCharge.findUnique({ where: { id: chargeId } });
    if (!charge) throw new UserFacingError("This charge was already removed.");
    await tx.loadCharge.delete({ where: { id: chargeId } });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.LOAD_CHARGE_REMOVED,
        entityType: AUDIT_ENTITIES.LOAD,
        entityId: charge.loadId,
        userId,
        metadata: { chargeId, description: charge.description, amount: charge.amount.toString() },
      },
      tx,
    );
    return { loadId: charge.loadId };
  });
}
