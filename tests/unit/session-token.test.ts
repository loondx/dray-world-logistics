import { describe, expect, it } from "vitest";

import { generateSessionToken, hashSessionToken, sanitizeRedirectPath } from "@/lib/auth/session-token";

describe("session tokens", () => {
  it("generates unique high-entropy tokens", () => {
    const tokens = new Set(Array.from({ length: 1000 }, generateSessionToken));
    expect(tokens.size).toBe(1000);
    for (const token of tokens) expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });

  it("hashes deterministically and never returns the raw token", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toContain(token);
    expect(hashSessionToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("sanitizeRedirectPath", () => {
  it.each([
    ["/loads/abc?tab=documents", "/loads/abc?tab=documents"],
    ["/dashboard", "/dashboard"],
  ])("allows in-app path %s", (input, expected) => {
    expect(sanitizeRedirectPath(input)).toBe(expected);
  });

  it.each(["//evil.example", "https://evil.example", "/\\evil.example", "javascript:alert(1)", "", null, 42])(
    "rejects unsafe value %s",
    (input) => {
      expect(sanitizeRedirectPath(input)).toBe("/dashboard");
    },
  );
});
