import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { BrandLockup } from "@/components/brand/brand-mark";
import { AFTER_LOGIN_PATH } from "@/lib/auth/constants";
import { sanitizeRedirectPath } from "@/lib/auth/session-token";
import { isDatabaseEnabled } from "@/lib/database-enabled";
import { getCurrentUser } from "@/server/auth/guards";
import { getPublicCompanyProfile } from "@/server/services/company-settings.service";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = sanitizeRedirectPath(next, AFTER_LOGIN_PATH);

  if (await getCurrentUser()) redirect(nextPath);

  const company = await getPublicCompanyProfile();

  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-muted/60 px-4 py-10">
      <div className="w-full max-w-sm">
        <BrandLockup name={company.displayName} tagline="Operations Portal" className="mb-6 justify-center" />
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">Authorized personnel only.</p>
          {isDatabaseEnabled() ? (
            <LoginForm next={nextPath === AFTER_LOGIN_PATH ? undefined : nextPath} />
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              The operations portal is temporarily unavailable.{" "}
              <Link href="/" className="underline">
                Return to our website
              </Link>
              .
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {company.legalName} · {company.city}, {company.stateProvince}
        </p>
      </div>
    </main>
  );
}
