// In-memory replacement for next/headers so server code that reads/writes
// cookies can be exercised outside a Next.js request. Use from a test file:
//
//   vi.mock("next/headers", async () => (await import("../support/next-headers-mock")).nextHeadersModule);
type CookieEntry = { name: string; value: string };

export const cookieJar = new Map<string, CookieEntry>();

const cookieStore = {
  get: (name: string) => cookieJar.get(name),
  has: (name: string) => cookieJar.has(name),
  set: (name: string, value: string) => {
    cookieJar.set(name, { name, value });
  },
  delete: (name: string) => {
    cookieJar.delete(name);
  },
};

export const nextHeadersModule = {
  cookies: async () => cookieStore,
  headers: async () => new Headers({ "user-agent": "vitest" }),
};
