/*
  Warnings:

  - You are about to drop the column `isEmailVerified` on the `MerchantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `isEmailVerified` on the `RiderProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MerchantProfile" DROP COLUMN "isEmailVerified";

-- AlterTable
ALTER TABLE "RiderProfile" DROP COLUMN "isEmailVerified";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
