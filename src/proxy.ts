import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_PATH, SESSION_COOKIE_NAME } from "@/lib/auth/constants";

// Optimistic check only: redirects visitors without a session cookie to /login
// before rendering. It is NOT the security boundary — every dashboard layout,
// page, server action and route handler validates the session against the
// database on the server (see src/server/auth/guards.ts).
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE_NAME)) return NextResponse.next();

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/loads/:path*",
    "/clients/:path*",
    "/carriers/:path*",
    "/drivers/:path*",
    "/documents/:path*",
    "/quotes/:path*",
    "/settings/:path*",
  ],
};
