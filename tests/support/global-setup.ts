import "dotenv/config";

import { execFileSync } from "node:child_process";

import { Client } from "pg";

import { getTestDatabaseUrl } from "./test-database-url";

// Creates the test database if needed and applies all migrations to it.
export default async function globalSetup(): Promise<void> {
  const testUrl = new URL(getTestDatabaseUrl());
  const databaseName = testUrl.pathname.slice(1);

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
    }
  } finally {
    await admin.end();
  }

  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
    stdio: "pipe",
  });
}
