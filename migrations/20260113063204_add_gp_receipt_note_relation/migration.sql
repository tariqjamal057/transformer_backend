/*
  Warnings:

  - A unique constraint covering the columns `[deliveryChallanId]` on the table `gp_receipt_notes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deliveryChallanId` to the `gp_receipt_notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gp_receipt_notes" ADD COLUMN     "deliveryChallanId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "gp_receipt_notes_deliveryChallanId_key" ON "gp_receipt_notes"("deliveryChallanId");

-- AddForeignKey
ALTER TABLE "gp_receipt_notes" ADD CONSTRAINT "gp_receipt_notes_deliveryChallanId_fkey" FOREIGN KEY ("deliveryChallanId") REFERENCES "delivery_challans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
