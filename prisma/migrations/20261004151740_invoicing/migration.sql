-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "paymentTermsDays" INTEGER;

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "invoiceNotes" TEXT,
ADD COLUMN     "invoicePaymentTermsDays" INTEGER;

-- CreateTable
CREATE TABLE "LoadCharge" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "LoadCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoadCharge_loadId_idx" ON "LoadCharge"("loadId");

-- AddForeignKey
ALTER TABLE "LoadCharge" ADD CONSTRAINT "LoadCharge_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;
