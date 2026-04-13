-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MERCHANT', 'RIDER', 'DISPATCHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('COD', 'PREPAID');

-- CreateEnum
CREATE TYPE "MerchantDocType" AS ENUM ('PAN_CERTIFICATE', 'BUSINESS_REGISTRATION', 'TAX_CLEARANCE', 'OWNER_CITIZENSHIP', 'OWNER_PHOTO');

-- CreateEnum
CREATE TYPE "RiderDocType" AS ENUM ('CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'DRIVING_LICENSE_FRONT', 'DRIVING_LICENSE_BACK', 'VEHICLE_BLUEBOOK', 'VEHICLE_INSURANCE', 'RIDER_PHOTO', 'VEHICLE_PHOTO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MERCHANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "maxWeightKg" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FareConfig" (
    "id" SERIAL NOT NULL,
    "vehicleTypeId" INTEGER NOT NULL,
    "baseFare" DOUBLE PRECISION NOT NULL,
    "perKmRate" DOUBLE PRECISION NOT NULL,
    "perKgRate" DOUBLE PRECISION NOT NULL,
    "minFare" DOUBLE PRECISION NOT NULL,
    "fragileCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "codChargeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancelCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FareConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "panNumber" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "location" geography(Point, 4326),

    CONSTRAINT "MerchantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantDocument" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" "MerchantDocType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePublicId" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "MerchantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vehicleTypeId" INTEGER NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "currentLocation" geography(Point, 4326),

    CONSTRAINT "RiderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderDocument" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "type" "RiderDocType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePublicId" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "RiderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "riderId" TEXT,
    "vehicleTypeId" INTEGER NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryLocation" geography(Point, 4326),
    "weight" DOUBLE PRECISION NOT NULL,
    "isFragile" BOOLEAN NOT NULL DEFAULT false,
    "orderValue" DOUBLE PRECISION NOT NULL,
    "codAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fareSnapshot" DOUBLE PRECISION,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isHandoffPending" BOOLEAN NOT NULL DEFAULT false,
    "handoffInitiatorId" TEXT,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentLog" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "note" TEXT,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "totalFare" DOUBLE PRECISION NOT NULL,
    "codAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "collectedByRider" DOUBLE PRECISION,
    "isRemitted" BOOLEAN NOT NULL DEFAULT false,
    "remittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleType_name_key" ON "VehicleType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FareConfig_vehicleTypeId_key" ON "FareConfig"("vehicleTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_user_id_key" ON "MerchantProfile"("user_id");

-- CreateIndex
CREATE INDEX "MerchantDocument_merchantId_idx" ON "MerchantDocument"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantDocument_merchantId_status_idx" ON "MerchantDocument"("merchantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RiderProfile_user_id_key" ON "RiderProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "RiderProfile_licenseNumber_key" ON "RiderProfile"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RiderProfile_vehicleNumber_key" ON "RiderProfile"("vehicleNumber");

-- CreateIndex
CREATE INDEX "RiderProfile_vehicleTypeId_idx" ON "RiderProfile"("vehicleTypeId");

-- CreateIndex
CREATE INDEX "RiderProfile_isOnline_isVerified_idx" ON "RiderProfile"("isOnline", "isVerified");

-- CreateIndex
CREATE INDEX "RiderDocument_riderId_idx" ON "RiderDocument"("riderId");

-- CreateIndex
CREATE INDEX "RiderDocument_riderId_status_idx" ON "RiderDocument"("riderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_trackingNumber_key" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_merchantId_idx" ON "Shipment"("merchantId");

-- CreateIndex
CREATE INDEX "Shipment_riderId_idx" ON "Shipment"("riderId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_merchantId_status_idx" ON "Shipment"("merchantId", "status");

-- CreateIndex
CREATE INDEX "Shipment_riderId_status_idx" ON "Shipment"("riderId", "status");

-- CreateIndex
CREATE INDEX "ShipmentLog_shipmentId_idx" ON "ShipmentLog"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentLog_updatedById_idx" ON "ShipmentLog"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_shipmentId_key" ON "Transaction"("shipmentId");

-- AddForeignKey
ALTER TABLE "FareConfig" ADD CONSTRAINT "FareConfig_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantProfile" ADD CONSTRAINT "MerchantProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantDocument" ADD CONSTRAINT "MerchantDocument_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "MerchantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderProfile" ADD CONSTRAINT "RiderProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderProfile" ADD CONSTRAINT "RiderProfile_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderDocument" ADD CONSTRAINT "RiderDocument_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "MerchantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLog" ADD CONSTRAINT "ShipmentLog_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLog" ADD CONSTRAINT "ShipmentLog_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
