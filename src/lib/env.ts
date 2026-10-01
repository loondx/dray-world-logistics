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
  DOCUMENT_STORAGE_PATH: z.string().min(1, "DOCUMENT_STORAGE_PATH is required"),
  MAX_DOCUMENT_SIZE_MB: z.coerce.number().int().min(1).max(100).default(20),
});

export type ServerEnv = z.infer<typeof envSchema> & {
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

  cached = {
    ...parsed.data,
    documentStorageRoot: path.resolve(parsed.data.DOCUMENT_STORAGE_PATH),
    maxDocumentSizeBytes: parsed.data.MAX_DOCUMENT_SIZE_MB * 1024 * 1024,
  };
  return cached;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}
