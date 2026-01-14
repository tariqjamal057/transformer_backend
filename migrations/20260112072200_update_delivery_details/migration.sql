/*
  Warnings:

  - You are about to drop the column `name` on the `delivery_details` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[deliveryChalanId]` on the table `delivery_details` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deliveryChalanId` to the `delivery_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiptedChallanDate` to the `delivery_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiptedChallanNo` to the `delivery_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "delivery_details" DROP COLUMN "name",
ADD COLUMN     "deliveryChalanId" TEXT NOT NULL,
ADD COLUMN     "receiptedChallanDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "receiptedChallanNo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "delivery_details_deliveryChalanId_key" ON "delivery_details"("deliveryChalanId");

-- AddForeignKey
ALTER TABLE "delivery_details" ADD CONSTRAINT "delivery_details_deliveryChalanId_fkey" FOREIGN KEY ("deliveryChalanId") REFERENCES "delivery_challans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
