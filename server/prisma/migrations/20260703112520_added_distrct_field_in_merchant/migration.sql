-- AlterTable
ALTER TABLE "MerchantProfile" ADD COLUMN     "pickupDistrictId" INTEGER;

-- AddForeignKey
ALTER TABLE "MerchantProfile" ADD CONSTRAINT "MerchantProfile_pickupDistrictId_fkey" FOREIGN KEY ("pickupDistrictId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
