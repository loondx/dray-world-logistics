/*
  Warnings:

  - You are about to drop the column `containerSize` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `containerSizeOther` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `containerType` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryTime` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `dispatchNotes` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `operationsNotes` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `pickupTime` on the `Load` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Load" DROP COLUMN "containerSize",
DROP COLUMN "containerSizeOther",
DROP COLUMN "containerType",
DROP COLUMN "deliveryTime",
DROP COLUMN "dispatchNotes",
DROP COLUMN "operationsNotes",
DROP COLUMN "pickupTime",
ADD COLUMN     "deliveryContact" TEXT,
ADD COLUMN     "deliveryTimeFrom" TEXT,
ADD COLUMN     "deliveryTimeTo" TEXT,
ADD COLUMN     "equipmentSize" TEXT,
ADD COLUMN     "equipmentType" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "pickupContact" TEXT,
ADD COLUMN     "pickupTimeFrom" TEXT,
ADD COLUMN     "pickupTimeTo" TEXT;

-- DropEnum
DROP TYPE "ContainerSize";

-- CreateIndex
CREATE INDEX "Load_createdAt_idx" ON "Load"("createdAt");

-- Client confirmed the company address: province "ON" (Ontario), country Canada.
-- Corrects profiles created from the original, unconfirmed defaults ("Om", "CA").
UPDATE "CompanySettings" SET "stateProvince" = 'ON', "country" = 'Canada'
WHERE "stateProvince" = 'Om' AND "country" = 'CA';
