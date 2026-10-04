/**
 * Copies the confirmed company details from src/config/company-defaults.ts into the
 * CompanySettings row, but ONLY into fields that are still empty. Anything staff typed
 * in Settings is never overwritten. Safe to run more than once.
 *
 *   pnpm company:defaults                                  (local database)
 *   DATABASE_URL=<production direct URL> pnpm company:defaults
 */
import "dotenv/config";

import { COMPANY_DEFAULTS } from "@/config/company-defaults";
import { createPrismaClient } from "@/lib/db/create-client";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";

const COMPANY_SETTINGS_ID = "company";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const db = createPrismaClient(databaseUrl);
  try {
    const current = await db.companySettings.findUnique({ where: { id: COMPANY_SETTINGS_ID } });
    if (!current) {
      await db.companySettings.create({ data: { id: COMPANY_SETTINGS_ID, ...COMPANY_DEFAULTS } });
      console.log("Company settings created from the defaults.");
      return;
    }

    const updates: Record<string, string> = {};
    for (const [field, value] of Object.entries(COMPANY_DEFAULTS)) {
      const existing = current[field as keyof typeof current];
      if (value !== null && (existing === null || existing === "")) updates[field] = value;
    }
    if (Object.keys(updates).length === 0) {
      console.log("Nothing to do: every company field already has a value.");
      return;
    }

    await db.$transaction([
      db.companySettings.update({ where: { id: COMPANY_SETTINGS_ID }, data: updates }),
      db.auditLog.create({
        data: {
          action: AUDIT_ACTIONS.COMPANY_SETTINGS_UPDATED,
          entityType: AUDIT_ENTITIES.COMPANY_SETTINGS,
          entityId: COMPANY_SETTINGS_ID,
          metadata: { section: "defaults", fields: Object.keys(updates) },
        },
      }),
    ]);
    console.log(`Filled empty fields: ${Object.keys(updates).join(", ")}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
