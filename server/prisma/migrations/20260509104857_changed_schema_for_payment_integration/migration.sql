/*
  Warnings:

  - You are about to drop the `MerchantSubscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MerchantTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MerchantWallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Plan` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "KhaltiPaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('RAISED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID');

-- AlterEnum
ALTER TYPE "ShipmentStatus" ADD VALUE 'UNPAID';

-- DropForeignKey
ALTER TABLE "MerchantSubscription" DROP CONSTRAINT "MerchantSubscription_merchantId_fkey";

-- DropForeignKey
ALTER TABLE "MerchantSubscription" DROP CONSTRAINT "MerchantSubscription_planId_fkey";

-- DropForeignKey
ALTER TABLE "MerchantTransaction" DROP CONSTRAINT "MerchantTransaction_shipmentId_fkey";

-- DropForeignKey
ALTER TABLE "MerchantTransaction" DROP CONSTRAINT "MerchantTransaction_walletId_fkey";

-- DropForeignKey
ALTER TABLE "MerchantWallet" DROP CONSTRAINT "MerchantWallet_merchantId_fkey";

-- AlterTable
ALTER TABLE "CODRecord" ADD COLUMN     "khaltiRef" TEXT,
ADD COLUMN     "khaltiTxnId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FareConfig" ADD COLUMN     "codChargeRate" DECIMAL(65,30) NOT NULL DEFAULT 1.5,
ADD COLUMN     "fuelSurcharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "insuranceRate" DECIMAL(65,30) NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "baseFare" DECIMAL(65,30),
ADD COLUMN     "codFee" DECIMAL(65,30),
ADD COLUMN     "distanceFare" DECIMAL(65,30),
ADD COLUMN     "fragileCharge" DECIMAL(65,30),
ADD COLUMN     "fromDistrictId" INTEGER,
ADD COLUMN     "insuranceFee" DECIMAL(65,30),
ADD COLUMN     "toDistrictId" INTEGER,
ADD COLUMN     "totalFare" DECIMAL(65,30),
ADD COLUMN     "weightFare" DECIMAL(65,30),
ADD COLUMN     "zoneId" INTEGER,
ADD COLUMN     "zoneSurcharge" DECIMAL(65,30);

-- DropTable
DROP TABLE "MerchantSubscription";

-- DropTable
DROP TABLE "MerchantTransaction";

-- DropTable
DROP TABLE "MerchantWallet";

-- DropTable
DROP TABLE "Plan";

-- DropEnum
DROP TYPE "SubStatus";

-- DropEnum
DROP TYPE "TxType";

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "surcharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "multiplier" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "zoneId" INTEGER NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KhaltiPayment" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "KhaltiPaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "pidx" TEXT,
    "txnId" TEXT,
    "khaltiRef" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failReason" TEXT,

    CONSTRAINT "KhaltiPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "claimAmount" DECIMAL(65,30) NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'RAISED',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedAmount" DECIMAL(65,30),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "District_zoneId_idx" ON "District"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "KhaltiPayment_shipmentId_key" ON "KhaltiPayment"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "KhaltiPayment_pidx_key" ON "KhaltiPayment"("pidx");

-- CreateIndex
CREATE INDEX "KhaltiPayment_merchantId_idx" ON "KhaltiPayment"("merchantId");

-- CreateIndex
CREATE INDEX "KhaltiPayment_shipmentId_idx" ON "KhaltiPayment"("shipmentId");

-- CreateIndex
CREATE INDEX "KhaltiPayment_pidx_idx" ON "KhaltiPayment"("pidx");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceClaim_shipmentId_key" ON "InsuranceClaim"("shipmentId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_merchantId_idx" ON "InsuranceClaim"("merchantId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_status_idx" ON "InsuranceClaim"("status");

-- CreateIndex
CREATE INDEX "Shipment_fromDistrictId_idx" ON "Shipment"("fromDistrictId");

-- CreateIndex
CREATE INDEX "Shipment_toDistrictId_idx" ON "Shipment"("toDistrictId");

-- CreateIndex
CREATE INDEX "Shipment_zoneId_idx" ON "Shipment"("zoneId");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_fromDistrictId_fkey" FOREIGN KEY ("fromDistrictId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_toDistrictId_fkey" FOREIGN KEY ("toDistrictId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KhaltiPayment" ADD CONSTRAINT "KhaltiPayment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "MerchantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KhaltiPayment" ADD CONSTRAINT "KhaltiPayment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
