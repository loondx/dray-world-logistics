-- Load statuses reduced to three: CREATED → IN_PROGRESS → COMPLETED.
--   DRAFT, CREATED                                   → CREATED
--   ASSIGNED … DELIVERED, DOCUMENTS_PENDING          → IN_PROGRESS
--   COMPLETED                                        → COMPLETED
--   CANCELLED: deleted when the load has no documents (there is no "cancelled" any more;
--              unstarted loads are deleted instead), otherwise COMPLETED so paperwork is kept.

-- 1. Remove cancelled loads that never had a document (charges cascade).
DELETE FROM "LoadStatusHistory" h
USING "Load" l
WHERE h."loadId" = l."id"
  AND l."status" = 'CANCELLED'
  AND NOT EXISTS (SELECT 1 FROM "Document" d WHERE d."loadId" = l."id");

DELETE FROM "Load" l
WHERE l."status" = 'CANCELLED'
  AND NOT EXISTS (SELECT 1 FROM "Document" d WHERE d."loadId" = l."id");

-- 2. Swap the enum, mapping every old value.
ALTER TYPE "LoadStatus" RENAME TO "LoadStatus_old";
CREATE TYPE "LoadStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'COMPLETED');

ALTER TABLE "Load" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Load" ALTER COLUMN "status" TYPE "LoadStatus" USING (
  CASE "status"::text
    WHEN 'DRAFT' THEN 'CREATED'
    WHEN 'CREATED' THEN 'CREATED'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'CANCELLED' THEN 'COMPLETED'
    ELSE 'IN_PROGRESS'
  END
)::"LoadStatus";
ALTER TABLE "Load" ALTER COLUMN "status" SET DEFAULT 'CREATED';

-- previousStatus is NULL on each load's first entry and must stay NULL
-- (a simple CASE never matches NULL, so test it explicitly).
ALTER TABLE "LoadStatusHistory" ALTER COLUMN "previousStatus" TYPE "LoadStatus" USING (
  CASE
    WHEN "previousStatus" IS NULL THEN NULL
    ELSE CASE "previousStatus"::text
    WHEN 'DRAFT' THEN 'CREATED'
    WHEN 'CREATED' THEN 'CREATED'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'CANCELLED' THEN 'COMPLETED'
    ELSE 'IN_PROGRESS'
    END
  END
)::"LoadStatus";
ALTER TABLE "LoadStatusHistory" ALTER COLUMN "newStatus" TYPE "LoadStatus" USING (
  CASE "newStatus"::text
    WHEN 'DRAFT' THEN 'CREATED'
    WHEN 'CREATED' THEN 'CREATED'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'CANCELLED' THEN 'COMPLETED'
    ELSE 'IN_PROGRESS'
  END
)::"LoadStatus";

DROP TYPE "LoadStatus_old";

-- 3. Steps that merged into one status (e.g. Assigned → Picked up) are no longer changes.
--    The audit log keeps the original detail.
DELETE FROM "LoadStatusHistory"
WHERE "previousStatus" IS NOT NULL AND "previousStatus" = "newStatus";
