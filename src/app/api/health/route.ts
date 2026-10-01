import { isDatabaseEnabled } from "@/lib/database-enabled";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// Liveness/readiness probe for Docker and Nginx. Reveals nothing but up/down.
export async function GET() {
  if (!isDatabaseEnabled()) {
    return Response.json({ status: "ok", mode: "public" }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("Health check failed", error);
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
