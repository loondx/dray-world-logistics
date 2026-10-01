import { createHash, randomBytes } from "node:crypto";

const SESSION_TOKEN_BYTES = 32;

// Opaque, high-entropy token. Only the browser cookie ever holds it.
export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

// The database stores only this hash, so a database leak does not yield
// usable session tokens.
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Only allow redirects back into this application (relative paths), never to
// another origin such as "//evil.example" or "https://evil.example".
export function sanitizeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
