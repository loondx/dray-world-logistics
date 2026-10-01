-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATIONS', 'DISPATCHER', 'ACCOUNTING', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LoadType" AS ENUM ('DRAYAGE', 'OTR');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('DRAFT', 'CREATED', 'ASSIGNED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'DOCUMENTS_PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContainerSize" AS ENUM ('FT20', 'FT40', 'FT40HC', 'FT45', 'OTHER');

-- CreateEnum
CREATE TYPE "ShipmentDirection" AS ENUM ('IMPORT', 'EXPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('LB', 'KG');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'CAD');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CARRIER_RATE_CONFIRMATION', 'SHIPPER_RATE_CONFIRMATION', 'BOL', 'POD', 'COD', 'INVOICE', 'RECEIPT', 'LUMPER_RECEIPT', 'SCALE_TICKET', 'GATE_TICKET', 'CUSTOMS_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('GENERATED', 'UPLOADED');

-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATIONS',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL DEFAULT 'company',
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "stateProvince" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "operationsPhone" TEXT,
    "email" TEXT,
    "operationsEmail" TEXT,
    "website" TEXT,
    "mcNumber" TEXT,
    "dotNumber" TEXT,
    "businessNumber" TEXT,
    "logoStorageKey" TEXT,
    "paymentInstructions" TEXT,
    "carrierTerms" TEXT,
    "shipperTerms" TEXT,
    "bolInstructions" TEXT,
    "bolTerms" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "stateProvince" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "mcNumber" TEXT,
    "dotNumber" TEXT,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "dba" TEXT,
    "mcNumber" TEXT,
    "dotNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "stateProvince" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "insuranceCompany" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceExpiry" DATE,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "truckNumber" TEXT,
    "trailerNumber" TEXT,
    "licenseNumber" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Load" (
    "id" TEXT NOT NULL,
    "loadNumber" SERIAL NOT NULL,
    "type" "LoadType" NOT NULL,
    "status" "LoadStatus" NOT NULL DEFAULT 'CREATED',
    "clientId" TEXT NOT NULL,
    "carrierId" TEXT,
    "driverId" TEXT,
    "loadDate" DATE NOT NULL,
    "customerReference" TEXT,
    "containerNumber" TEXT,
    "bookingNumber" TEXT,
    "sealNumber" TEXT,
    "containerSize" "ContainerSize",
    "containerSizeOther" TEXT,
    "containerType" TEXT,
    "direction" "ShipmentDirection",
    "commodity" TEXT,
    "weight" DECIMAL(12,2),
    "weightUnit" "WeightUnit" NOT NULL DEFAULT 'LB',
    "pieces" INTEGER,
    "specialInstructions" TEXT,
    "pickupLocationName" TEXT,
    "pickupAddressLine1" TEXT,
    "pickupAddressLine2" TEXT,
    "pickupCity" TEXT,
    "pickupStateProvince" TEXT,
    "pickupPostalCode" TEXT,
    "pickupCountry" TEXT,
    "pickupDate" DATE,
    "pickupTime" TEXT,
    "pickupAppointmentNumber" TEXT,
    "pickupNotes" TEXT,
    "deliveryLocationName" TEXT,
    "deliveryAddressLine1" TEXT,
    "deliveryAddressLine2" TEXT,
    "deliveryCity" TEXT,
    "deliveryStateProvince" TEXT,
    "deliveryPostalCode" TEXT,
    "deliveryCountry" TEXT,
    "deliveryDate" DATE,
    "deliveryTime" TEXT,
    "deliveryAppointmentNumber" TEXT,
    "deliveryNotes" TEXT,
    "truckNumber" TEXT,
    "trailerNumber" TEXT,
    "miles" INTEGER,
    "clientRate" DECIMAL(12,2),
    "carrierRate" DECIMAL(12,2),
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "operationsNotes" TEXT,
    "dispatchNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadStatusHistory" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "previousStatus" "LoadStatus",
    "newStatus" "LoadStatus" NOT NULL,
    "changedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "source" "DocumentSource" NOT NULL,
    "version" INTEGER,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "deleteReason" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "origin" TEXT,
    "destination" TEXT,
    "message" TEXT,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Client_companyName_idx" ON "Client"("companyName");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "ClientContact_clientId_idx" ON "ClientContact"("clientId");

-- CreateIndex
CREATE INDEX "Carrier_legalName_idx" ON "Carrier"("legalName");

-- CreateIndex
CREATE INDEX "Carrier_mcNumber_idx" ON "Carrier"("mcNumber");

-- CreateIndex
CREATE INDEX "Carrier_status_idx" ON "Carrier"("status");

-- CreateIndex
CREATE INDEX "Driver_carrierId_idx" ON "Driver"("carrierId");

-- CreateIndex
CREATE UNIQUE INDEX "Load_loadNumber_key" ON "Load"("loadNumber");

-- CreateIndex
CREATE INDEX "Load_containerNumber_idx" ON "Load"("containerNumber");

-- CreateIndex
CREATE INDEX "Load_status_idx" ON "Load"("status");

-- CreateIndex
CREATE INDEX "Load_type_idx" ON "Load"("type");

-- CreateIndex
CREATE INDEX "Load_pickupDate_idx" ON "Load"("pickupDate");

-- CreateIndex
CREATE INDEX "Load_deliveryDate_idx" ON "Load"("deliveryDate");

-- CreateIndex
CREATE INDEX "Load_clientId_idx" ON "Load"("clientId");

-- CreateIndex
CREATE INDEX "Load_carrierId_idx" ON "Load"("carrierId");

-- CreateIndex
CREATE INDEX "Load_driverId_idx" ON "Load"("driverId");

-- CreateIndex
CREATE INDEX "LoadStatusHistory_loadId_createdAt_idx" ON "LoadStatusHistory"("loadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");

-- CreateIndex
CREATE INDEX "Document_loadId_idx" ON "Document"("loadId");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_loadId_type_version_key" ON "Document"("loadId", "type", "version");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadStatusHistory" ADD CONSTRAINT "LoadStatusHistory_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Load numbers are human-readable and start at 100001.
-- The column default uses this PostgreSQL sequence, which is concurrency-safe
-- (never SELECT MAX()+1). Gaps can occur if a transaction rolls back; that is expected.
ALTER SEQUENCE "Load_loadNumber_seq" RESTART WITH 100001;
