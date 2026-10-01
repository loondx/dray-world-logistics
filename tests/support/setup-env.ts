import "dotenv/config";

import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { vi } from "vitest";

import { getTestDatabaseUrl } from "./test-database-url";

// Runs before each test file is imported, so the app's db singleton connects to the test database.
process.env.DATABASE_URL = getTestDatabaseUrl();
// Each test file gets a throwaway local document storage directory (never a real Blob store).
process.env.STORAGE_DRIVER = "local";
process.env.DOCUMENT_STORAGE_PATH = mkdtempSync(path.join(os.tmpdir(), "dray-world-test-docs-"));

// Server code calls Next.js request APIs; outside a request they are replaced with in-memory fakes.
vi.mock("next/headers", async () => (await import("./next-headers-mock")).nextHeadersModule);
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => undefined,
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
