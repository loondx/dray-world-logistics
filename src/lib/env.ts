import "server-only";

import path from "node:path";
import { z } from "zod";

// Server-side environment. Nothing here is ever exposed to the browser
// (no NEXT_PUBLIC_ variables are used for secrets or infrastructure details).
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_TTL_HOURS: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 30)
    .default(12),
  // Document storage: "local" (a private folder; Docker / self-hosting) or "blob"
  // (private Vercel Blob store). Defaults to blob when a Blob token is configured.
  STORAGE_DRIVER: z.enum(["local", "blob"]).optional(),
  DOCUMENT_STORAGE_PATH: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  MAX_DOCUMENT_SIZE_MB: z.coerce.number().int().min(1).max(100).default(20),
});

/** Vercel Functions reject request bodies over 4.5 MB, so uploads are capped below it. */
const VERCEL_MAX_UPLOAD_MB = 4;

export type ServerEnv = z.infer<typeof envSchema> & {
  storageDriver: "local" | "blob";
  documentStorageRoot: string;
  maxDocumentSizeBytes: number;
};

let cached: ServerEnv | undefined;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid server environment configuration: ${fields}`);
  }

  const data = parsed.data;
  const storageDriver = data.STORAGE_DRIVER ?? (data.BLOB_READ_WRITE_TOKEN ? "blob" : "local");
  if (storageDriver === "local" && !data.DOCUMENT_STORAGE_PATH) {
    throw new Error("Invalid server environment configuration: DOCUMENT_STORAGE_PATH is required");
  }
  if (storageDriver === "blob" && !data.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Invalid server environment configuration: BLOB_READ_WRITE_TOKEN is required");
  }
  const maxMb = process.env.VERCEL
    ? Math.min(data.MAX_DOCUMENT_SIZE_MB, VERCEL_MAX_UPLOAD_MB)
    : data.MAX_DOCUMENT_SIZE_MB;

  cached = {
    ...data,
    MAX_DOCUMENT_SIZE_MB: maxMb,
    storageDriver,
    documentStorageRoot: data.DOCUMENT_STORAGE_PATH ? path.resolve(data.DOCUMENT_STORAGE_PATH) : "",
    maxDocumentSizeBytes: maxMb * 1024 * 1024,
  };
  return cached;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}
