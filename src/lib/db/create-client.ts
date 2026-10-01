import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Plain factory with no `server-only` marker so CLI scripts (seed, admin
// bootstrap) and tests can share it. Application code imports `@/lib/db`.
export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
