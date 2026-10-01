import "server-only";

import { cookies } from "next/headers";

import type { UserRole } from "@/generated/prisma/enums";
import {
  SESSION_ABSOLUTE_MAX_DAYS,
  SESSION_COOKIE_NAME,
  SESSION_TOUCH_INTERVAL_MS,
} from "@/lib/auth/constants";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/session-token";
import { isDatabaseEnabled } from "@/lib/database-enabled";
import { db } from "@/lib/db";
import { getEnv, isProduction } from "@/lib/env";

const DAY_MS = 24 * 60 * 60 * 1000;

// The only user shape that leaves the auth layer. Never includes passwordHash.
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

function idleTimeoutMs(): number {
  return getEnv().SESSION_TTL_HOURS * 60 * 60 * 1000;
}

export async function createSession(userId: string, userAgent: string | null): Promise<void> {
  const token = generateSessionToken();
  const now = Date.now();

  await db.session.create({
    data: {
      id: hashSessionToken(token),
      userId,
      expiresAt: new Date(now + idleTimeoutMs()),
      userAgent: userAgent?.slice(0, 255) ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_ABSOLUTE_MAX_DAYS * 24 * 60 * 60,
  });
}

// Validates the session cookie against the database. Returns null for missing,
// unknown, expired or disabled-user sessions.
export async function validateSessionCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  if (!isDatabaseEnabled()) return null;
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const sessionId = hashSessionToken(token);
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: {
      expiresAt: true,
      createdAt: true,
      lastSeenAt: true,
      user: { select: { id: true, email: true, name: true, role: true, active: true } },
    },
  });
  if (!session) return null;

  const now = Date.now();
  const absoluteExpiry = session.createdAt.getTime() + SESSION_ABSOLUTE_MAX_DAYS * DAY_MS;
  if (session.expiresAt.getTime() <= now || absoluteExpiry <= now || !session.user.active) {
    await db.session.deleteMany({ where: { id: sessionId } });
    return null;
  }

  if (now - session.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
    await db.session.update({
      where: { id: sessionId },
      data: {
        lastSeenAt: new Date(now),
        expiresAt: new Date(Math.min(now + idleTimeoutMs(), absoluteExpiry)),
      },
    });
  }

  const { id, email, name, role } = session.user;
  return { id, email, name, role };
}

export async function invalidateCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { id: hashSessionToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function deleteExpiredSessions(): Promise<number> {
  const result = await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return result.count;
}
