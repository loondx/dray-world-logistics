import "server-only";

import type { NewUserInput } from "@/features/settings/schemas";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";
import { UserFacingError } from "@/server/errors";

export function listUsers() {
  // Never select passwordHash.
  return db.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function createUser(input: NewUserInput, actorId: string): Promise<void> {
  const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new UserFacingError("A user with this email already exists.");
  const passwordHash = await hashPassword(input.password);
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email, role: input.role, passwordHash },
      select: { id: true },
    });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.USER_CREATED,
        entityType: AUDIT_ENTITIES.USER,
        entityId: user.id,
        userId: actorId,
        metadata: { email: input.email, role: input.role },
      },
      tx,
    );
  });
}

export async function setUserActive(userId: string, active: boolean, actorId: string): Promise<void> {
  if (userId === actorId && !active) throw new UserFacingError("You can't deactivate your own account.");
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { active } });
    if (!active) await tx.session.deleteMany({ where: { userId } });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.USER_UPDATED,
        entityType: AUDIT_ENTITIES.USER,
        entityId: userId,
        userId: actorId,
        metadata: { active },
      },
      tx,
    );
  });
}

// Sets a new password and signs the user out everywhere.
export async function resetUserPassword(userId: string, password: string, actorId: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId } });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
        entityType: AUDIT_ENTITIES.USER,
        entityId: userId,
        userId: actorId,
      },
      tx,
    );
  });
}
