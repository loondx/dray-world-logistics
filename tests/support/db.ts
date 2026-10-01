import { db } from "@/lib/db";

// Empties every application table (keeps the migrations table) and resets the load-number sequence.
export async function resetDatabase(): Promise<void> {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length > 0) {
    const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(", ");
    await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
  }
  await db.$executeRawUnsafe(`ALTER SEQUENCE "Load_loadNumber_seq" RESTART WITH 100001`);
}
