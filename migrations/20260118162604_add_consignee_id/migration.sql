/*
  Warnings:

  - You are about to drop the column `consigneeName` on the `gp_receipt_notes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "gp_receipt_notes" DROP COLUMN "consigneeName",
ADD COLUMN     "consigneeId" TEXT;

-- AddForeignKey
ALTER TABLE "gp_receipt_notes" ADD CONSTRAINT "gp_receipt_notes_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "consignees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
