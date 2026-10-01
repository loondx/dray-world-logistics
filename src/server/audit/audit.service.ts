import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db, type DbTransaction } from "@/lib/db";

import type { AuditAction, AuditEntity } from "./audit-actions";

export type AuditEntry = {
  action: AuditAction;
  entityType: AuditEntity;
  entityId: string;
  userId: string | null;
  metadata?: Prisma.InputJsonValue;
};

// Pass the transaction client when the audit entry must commit or roll back
// together with the business change it describes.
export async function recordAudit(entry: AuditEntry, client: DbTransaction | typeof db = db): Promise<void> {
  await client.auditLog.create({ data: entry });
}
