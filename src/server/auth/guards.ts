import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { LOGIN_PATH } from "@/lib/auth/constants";
import { hasPermission, type Permission } from "@/server/permissions/permissions";

import { validateSessionCookie, type SessionUser } from "./session";

// Deduplicated per request: layouts, pages and actions can all call this freely.
export const getCurrentUser = cache(validateSessionCookie);

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

// For pages, layouts and server actions: unauthenticated users go to /login.
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) throw new AuthorizationError();
  return user;
}

export function can(user: SessionUser, permission: Permission): boolean {
  return hasPermission(user.role, permission);
}
