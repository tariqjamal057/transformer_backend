-- AlterTable
ALTER TABLE "damaged_transformers" ADD COLUMN     "deliveryChallanId" TEXT;

-- AddForeignKey
ALTER TABLE "damaged_transformers" ADD CONSTRAINT "damaged_transformers_deliveryChallanId_fkey" FOREIGN KEY ("deliveryChallanId") REFERENCES "delivery_challans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
