import { beforeEach, describe, expect, it } from "vitest";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { hashPassword } from "@/lib/auth/password";
import { hashSessionToken } from "@/lib/auth/session-token";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/guards";
import { createSession, invalidateCurrentSession, validateSessionCookie } from "@/server/auth/session";
import { authenticate } from "@/server/services/auth.service";

import { resetDatabase } from "../support/db";
import { cookieJar } from "../support/next-headers-mock";

const PASSWORD = "a-strong-test-password";

async function createUser(overrides: { email?: string; active?: boolean } = {}) {
  return db.user.create({
    data: {
      email: overrides.email ?? "ops@example.test",
      name: "Ops User",
      passwordHash: await hashPassword(PASSWORD),
      role: "ADMIN",
      active: overrides.active ?? true,
    },
  });
}

function isRedirectTo(error: unknown, path: string): boolean {
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT") && digest.includes(path);
}

beforeEach(async () => {
  await resetDatabase();
  cookieJar.clear();
});

describe("authenticate", () => {
  it("accepts correct credentials case-insensitively on email", async () => {
    const user = await createUser();
    await expect(authenticate("  OPS@Example.test ", PASSWORD)).resolves.toEqual({
      ok: true,
      userId: user.id,
    });
  });

  it("rejects a wrong password and an unknown email with the same reason", async () => {
    await createUser();
    await expect(authenticate("ops@example.test", "nope")).resolves.toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
    await expect(authenticate("nobody@example.test", PASSWORD)).resolves.toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it("rejects deactivated users", async () => {
    await createUser({ active: false });
    await expect(authenticate("ops@example.test", PASSWORD)).resolves.toMatchObject({ ok: false });
  });

  it("locks the account after repeated failures, even for the correct password", async () => {
    await createUser();
    for (let i = 0; i < 5; i++) await authenticate("ops@example.test", "wrong");
    await expect(authenticate("ops@example.test", PASSWORD)).resolves.toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });
});

describe("sessions", () => {
  it("stores only the token hash and resolves the user from the cookie", async () => {
    const user = await createUser();
    await createSession(user.id, "vitest");

    const token = cookieJar.get(SESSION_COOKIE_NAME)?.value;
    expect(token).toBeDefined();
    const stored = await db.session.findMany();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.id).toBe(hashSessionToken(token ?? ""));
    expect(stored[0]?.id).not.toBe(token);

    const sessionUser = await validateSessionCookie();
    expect(sessionUser).toEqual({ id: user.id, email: user.email, name: user.name, role: "ADMIN" });
    expect(sessionUser).not.toHaveProperty("passwordHash");
  });

  it("rejects expired sessions and deletes them", async () => {
    const user = await createUser();
    await createSession(user.id, null);
    await db.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    await expect(validateSessionCookie()).resolves.toBeNull();
    await expect(db.session.count()).resolves.toBe(0);
  });

  it("rejects sessions of users who were deactivated", async () => {
    const user = await createUser();
    await createSession(user.id, null);
    await db.user.update({ where: { id: user.id }, data: { active: false } });

    await expect(validateSessionCookie()).resolves.toBeNull();
  });

  it("rejects a forged cookie", async () => {
    cookieJar.set(SESSION_COOKIE_NAME, { name: SESSION_COOKIE_NAME, value: "forged-token" });
    await expect(validateSessionCookie()).resolves.toBeNull();
  });

  it("logout removes the session server-side", async () => {
    const user = await createUser();
    await createSession(user.id, null);
    const token = cookieJar.get(SESSION_COOKIE_NAME)?.value ?? "";

    await invalidateCurrentSession();
    expect(cookieJar.has(SESSION_COOKIE_NAME)).toBe(false);

    // Replaying the old cookie must not work.
    cookieJar.set(SESSION_COOKIE_NAME, { name: SESSION_COOKIE_NAME, value: token });
    await expect(validateSessionCookie()).resolves.toBeNull();
  });
});

describe("dashboard access", () => {
  it("redirects unauthenticated requests to /login", async () => {
    await expect(requireUser()).rejects.toSatisfy((error) => isRedirectTo(error, "/login"));
  });

  it("allows an authenticated user", async () => {
    const user = await createUser();
    await createSession(user.id, null);
    await expect(requireUser()).resolves.toMatchObject({ id: user.id });
  });
});
