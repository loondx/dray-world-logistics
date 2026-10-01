-- CreateEnum
CREATE TYPE "QuoteRequestKind" AS ENUM ('QUOTE', 'CALLBACK');

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "kind" "QuoteRequestKind" NOT NULL DEFAULT 'QUOTE',
ADD COLUMN     "preferredTime" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "serviceType" DROP NOT NULL;
