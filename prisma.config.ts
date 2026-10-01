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
    url: process.env.DATABASE_URL ?? "",
  },
});
