import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` needs no connection, so a missing URL must not break
    // `pnpm install` / Docker builds. Migrate commands fail loudly without it.
    // Migrations use a direct (non-pooled) connection when one is provided, e.g. the
    // DATABASE_URL_UNPOOLED that the Neon integration sets on Vercel.
    url: process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim() || "",
  },
});
