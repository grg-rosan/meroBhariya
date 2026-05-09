/*
  Warnings:

  - You are about to drop the column `cancelCharge` on the `FareConfig` table. All the data in the column will be lost.
  - You are about to drop the column `codChargeRate` on the `FareConfig` table. All the data in the column will be lost.
  - You are about to drop the column `nightSurcharge` on the `FareConfig` table. All the data in the column will be lost.
  - You are about to alter the column `fragileCharge` on the `FareConfig` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the column `filePublicId` on the `MerchantDocument` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `MerchantDocument` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `RiderDocument` table. All the data in the column will be lost.
  - You are about to drop the column `filePublicId` on the `RiderDocument` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `RiderDocument` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Transaction` table. All the data in the column will be lost.
  - Made the column `collectedByRider` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('TOPUP', 'SHIPMENT_CHARGE', 'OVERAGE_CHARGE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RiderTxType" AS ENUM ('DELIVERY_EARNING', 'BONUS', 'ADJUSTMENT', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('ESEWA', 'KHALTI', 'BANK', 'CASH');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CODStatus" AS ENUM ('PENDING', 'COLLECTED', 'REMITTED', 'RECONCILED', 'FAILED');

-- DropIndex
DROP INDEX "MerchantDocument_merchantId_idx";

-- DropIndex
DROP INDEX "RiderDocument_riderId_idx";

-- DropIndex
DROP INDEX "Shipment_merchantId_status_idx";

-- DropIndex
DROP INDEX "Shipment_riderId_status_idx";

-- DropIndex
DROP INDEX "ShipmentLog_updatedById_idx";

-- AlterTable
ALTER TABLE "FareConfig" DROP COLUMN "cancelCharge",
DROP COLUMN "codChargeRate",
DROP COLUMN "nightSurcharge",
ADD COLUMN     "riderCutPct" DECIMAL(65,30) NOT NULL DEFAULT 75.0,
ALTER COLUMN "fragileCharge" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "MerchantDocument" DROP COLUMN "filePublicId",
DROP COLUMN "note",
ADD COLUMN     "reviewNote" TEXT;

-- AlterTable
ALTER TABLE "RiderDocument" DROP COLUMN "expiresAt",
DROP COLUMN "filePublicId",
DROP COLUMN "note",
ADD COLUMN     "reviewNote" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "deliveryLat" DOUBLE PRECISION,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION,
ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'PREPAID';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "updatedAt",
ALTER COLUMN "collectedByRider" SET NOT NULL,
ALTER COLUMN "collectedByRider" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "MerchantSubscription" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubStatus" NOT NULL DEFAULT 'ACTIVE',
    "shipmentsUsed" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "shipmentQuota" INTEGER,
    "overageRate" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantWallet" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "MerchantWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "type" "TxType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderWallet" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "RiderWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "type" "RiderTxType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiderTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderPayout" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" "PayoutMethod" NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "RiderPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CODRecord" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "CODStatus" NOT NULL DEFAULT 'PENDING',
    "collectedById" TEXT,
    "collectedAt" TIMESTAMP(3),
    "remittedToId" TEXT,
    "remittedAt" TIMESTAMP(3),
    "reconciledById" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "merchantPayout" DECIMAL(65,30),
    "notes" TEXT,

    CONSTRAINT "CODRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSubscription_merchantId_key" ON "MerchantSubscription"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantSubscription_merchantId_status_idx" ON "MerchantSubscription"("merchantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantWallet_merchantId_key" ON "MerchantWallet"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantTransaction_walletId_idx" ON "MerchantTransaction"("walletId");

-- CreateIndex
CREATE INDEX "MerchantTransaction_shipmentId_idx" ON "MerchantTransaction"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderWallet_riderId_key" ON "RiderWallet"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderTransaction_shipmentId_key" ON "RiderTransaction"("shipmentId");

-- CreateIndex
CREATE INDEX "RiderTransaction_walletId_idx" ON "RiderTransaction"("walletId");

-- CreateIndex
CREATE INDEX "RiderTransaction_shipmentId_idx" ON "RiderTransaction"("shipmentId");

-- CreateIndex
CREATE INDEX "RiderPayout_riderId_status_idx" ON "RiderPayout"("riderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CODRecord_shipmentId_key" ON "CODRecord"("shipmentId");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- AddForeignKey
ALTER TABLE "MerchantSubscription" ADD CONSTRAINT "MerchantSubscription_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "MerchantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSubscription" ADD CONSTRAINT "MerchantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantWallet" ADD CONSTRAINT "MerchantWallet_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "MerchantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantTransaction" ADD CONSTRAINT "MerchantTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "MerchantWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantTransaction" ADD CONSTRAINT "MerchantTransaction_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderWallet" ADD CONSTRAINT "RiderWallet_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderTransaction" ADD CONSTRAINT "RiderTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "RiderWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderTransaction" ADD CONSTRAINT "RiderTransaction_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderPayout" ADD CONSTRAINT "RiderPayout_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_handoffInitiatorId_fkey" FOREIGN KEY ("handoffInitiatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CODRecord" ADD CONSTRAINT "CODRecord_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CODRecord" ADD CONSTRAINT "CODRecord_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "RiderProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CODRecord" ADD CONSTRAINT "CODRecord_remittedToId_fkey" FOREIGN KEY ("remittedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CODRecord" ADD CONSTRAINT "CODRecord_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
