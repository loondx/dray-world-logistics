-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'STAFF');

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE';
