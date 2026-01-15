/*
  Warnings:

  - You are about to drop the column `tnNumber` on the `delivery_schedules` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "delivery_schedules_tnNumber_key";

-- AlterTable
ALTER TABLE "delivery_schedules" DROP COLUMN "tnNumber",
ADD COLUMN     "supplyTenderId" TEXT,
ADD COLUMN     "tnId" TEXT;

-- AlterTable
ALTER TABLE "final_inspections" ALTER COLUMN "inspectionDate" DROP NOT NULL,
ALTER COLUMN "inspectedQuantity" DROP NOT NULL,
ALTER COLUMN "inspectionOfficers" DROP NOT NULL,
ALTER COLUMN "diNo" DROP NOT NULL,
ALTER COLUMN "diDate" DROP NOT NULL,
ALTER COLUMN "warranty" DROP NOT NULL,
ALTER COLUMN "consignees" DROP NOT NULL,
ALTER COLUMN "sealingDetails" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "delivery_schedules" ADD CONSTRAINT "delivery_schedules_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_schedules" ADD CONSTRAINT "delivery_schedules_tnId_fkey" FOREIGN KEY ("tnId") REFERENCES "tns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
