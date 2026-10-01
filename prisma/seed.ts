/**
 * DEVELOPMENT-ONLY seed data. Every record created here is fictitious and is
 * tagged "[DEV SEED]" in its notes. Refuses to run when NODE_ENV=production.
 *
 * Creates no users — use `pnpm admin:create` for accounts.
 */
import "dotenv/config";

import { createPrismaClient } from "../src/lib/db/create-client";

const DEV_SEED_TAG = "[DEV SEED] Fictitious record for local development.";

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed fictitious data into a production environment.");
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const db = createPrismaClient(databaseUrl);
  try {
    const alreadySeeded = await db.client.count({ where: { notes: DEV_SEED_TAG } });
    if (alreadySeeded > 0) {
      console.log("Development seed data already present — skipping.");
      return;
    }

    await db.client.createMany({
      data: [
        {
          companyName: "ABC Logistics (Sample)",
          contactName: "Sam Rivera",
          email: "sam@abc.example",
          phone: "555-0101",
          city: "Toronto",
          stateProvince: "ON",
          country: "CA",
          notes: DEV_SEED_TAG,
        },
        {
          companyName: "American Freight Co (Sample)",
          contactName: "Alex Kim",
          email: "alex@afc.example",
          phone: "555-0102",
          city: "Buffalo",
          stateProvince: "NY",
          country: "US",
          notes: DEV_SEED_TAG,
        },
        {
          companyName: "Atlantic Imports (Sample)",
          contactName: "Jordan Lee",
          email: "jordan@atlantic.example",
          phone: "555-0103",
          city: "Newark",
          stateProvince: "NJ",
          country: "US",
          notes: DEV_SEED_TAG,
        },
      ],
    });

    await db.carrier.create({
      data: {
        legalName: "Northern Haul Transport (Sample)",
        mcNumber: "MC-000000",
        dotNumber: "0000000",
        phone: "555-0200",
        email: "dispatch@northernhaul.example",
        contactPerson: "Pat Morgan",
        city: "Mississauga",
        stateProvince: "ON",
        country: "CA",
        notes: DEV_SEED_TAG,
        drivers: {
          create: [
            {
              firstName: "Chris",
              lastName: "Taylor",
              phone: "555-0201",
              truckNumber: "T-101",
              trailerNumber: "CH-2201",
              notes: DEV_SEED_TAG,
            },
            {
              firstName: "Morgan",
              lastName: "Singh",
              phone: "555-0202",
              truckNumber: "T-102",
              notes: DEV_SEED_TAG,
            },
          ],
        },
      },
    });

    console.log("Development seed data created.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
