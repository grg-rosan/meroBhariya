-- AlterTable
ALTER TABLE "MerchantProfile" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RiderProfile" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
