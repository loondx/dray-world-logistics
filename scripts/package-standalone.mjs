import { existsSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";

// Vercel packages its own output; only self-hosted builds use standalone.
if (!process.env.VERCEL) {
  if (!existsSync(".next/standalone/server.js")) {
    throw new Error("Missing standalone server. Run next build with output: standalone first.");
  }

  // public is optional: this app currently keeps its assets in src/app.
  if (existsSync("public")) {
    await cp("public", ".next/standalone/public", { recursive: true });
  }
  await mkdir(".next/standalone/.next", { recursive: true });
  await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
}
