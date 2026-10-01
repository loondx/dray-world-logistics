import "server-only";

import { getDummyPasswordHash, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const UNKNOWN_ENTITY_ID = "unknown";

export type AuthenticationResult =
  { ok: true; userId: string } | { ok: false; reason: "invalid_credentials" | "rate_limited" };

async function countRecentFailures(email: string): Promise<number> {
  return db.auditLog.count({
    where: {
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      createdAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
      metadata: { path: ["email"], equals: email },
    },
  });
}

export async function authenticate(rawEmail: string, password: string): Promise<AuthenticationResult> {
  const email = rawEmail.trim().toLowerCase();

  if ((await countRecentFailures(email)) >= MAX_FAILED_ATTEMPTS) {
    return { ok: false, reason: "rate_limited" };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, active: true },
  });

  // Always run a hash verification so response time does not reveal whether the account exists.
  const passwordValid = await verifyPassword(user?.passwordHash ?? (await getDummyPasswordHash()), password);

  if (!user || !user.active || !passwordValid) {
    await recordAudit({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entityType: AUDIT_ENTITIES.USER,
      entityId: user?.id ?? UNKNOWN_ENTITY_ID,
      userId: null,
      metadata: { email },
    });
    return { ok: false, reason: "invalid_credentials" };
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await recordAudit({
    action: AUDIT_ACTIONS.LOGIN_SUCCEEDED,
    entityType: AUDIT_ENTITIES.USER,
    entityId: user.id,
    userId: user.id,
  });
  return { ok: true, userId: user.id };
}
