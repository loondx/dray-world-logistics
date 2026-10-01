"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { LOGIN_PATH } from "@/lib/auth/constants";
import { sanitizeRedirectPath } from "@/lib/auth/session-token";
import { logger } from "@/lib/logger";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";
import { getCurrentUser } from "@/server/auth/guards";
import { createSession, deleteExpiredSessions, invalidateCurrentSession } from "@/server/auth/session";
import { authenticate, type AuthenticationResult } from "@/server/services/auth.service";

import { loginSchema } from "./schemas";

export type LoginFormState = {
  error?: string;
  fieldErrors?: { email?: string[]; password?: string[] };
  email?: string;
};

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const rawEmail = formData.get("email");
  const submittedEmail = typeof rawEmail === "string" ? rawEmail : "";

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, email: submittedEmail };
  }

  let result: AuthenticationResult;
  try {
    result = await authenticate(parsed.data.email, parsed.data.password);
    if (result.ok) {
      const requestHeaders = await headers();
      await createSession(result.userId, requestHeaders.get("user-agent"));
      await deleteExpiredSessions();
    }
  } catch (error) {
    logger.error("Login failed unexpectedly", error);
    return { error: "Sign-in is temporarily unavailable. Please try again.", email: submittedEmail };
  }

  if (!result.ok) {
    return {
      error:
        result.reason === "rate_limited"
          ? "Too many failed attempts. Please wait 15 minutes and try again."
          : "Incorrect email or password.",
      email: submittedEmail,
    };
  }

  redirect(sanitizeRedirectPath(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  await invalidateCurrentSession();
  if (user) {
    await recordAudit({
      action: AUDIT_ACTIONS.LOGOUT,
      entityType: AUDIT_ENTITIES.USER,
      entityId: user.id,
      userId: user.id,
    });
  }
  redirect(LOGIN_PATH);
}
