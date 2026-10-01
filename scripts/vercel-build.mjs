// Vercel build: generate the Prisma client, apply migrations, then build Next.js.
//
// Migrations run on production builds only, so a preview deployment can never change the
// production schema. Set RUN_MIGRATIONS=true for previews that have their own database
// (for example a Neon branch per preview) to migrate those too.
import { execSync } from "node:child_process";

const run = (command) => execSync(command, { stdio: "inherit" });

run("prisma generate");

const production = process.env.VERCEL_ENV === "production";
if (production || process.env.RUN_MIGRATIONS === "true") {
  run("prisma migrate deploy");
} else {
  console.log(`Skipping migrations for the ${process.env.VERCEL_ENV ?? "local"} build.`);
}

run("next build");
