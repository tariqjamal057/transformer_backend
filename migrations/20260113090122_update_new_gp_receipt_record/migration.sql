/*
  Warnings:

  - You are about to drop the column `deliveryChallanId` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `new_gp_receipt_records` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[deliveryChallanId]` on the table `new_gp_receipt_records` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountReceiptNoteDate` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountReceiptNoteNo` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `alWire` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channel` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conservator` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consigneeName` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consigneeTFRSerialNo` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `copperFlexibleCable` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `core` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryChallanId` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discomReceiptNoteDate` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discomReceiptNoteNo` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fuse` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `htMetalParts` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hvBushing` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icb` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ltMetalParts` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lvBushing` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mAndpBox` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mAndpBoxCover` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mccb` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oilLevel` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalTfrSrNo` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `polySealNo` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `radiator` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sealNoTimeOfGPReceived` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sinNo` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trfsiNo` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "gp_receipt_notes" DROP CONSTRAINT "gp_receipt_notes_deliveryChallanId_fkey";

-- DropIndex
DROP INDEX "gp_receipt_notes_deliveryChallanId_key";

-- AlterTable
ALTER TABLE "gp_receipt_notes" DROP COLUMN "deliveryChallanId";

-- AlterTable
ALTER TABLE "new_gp_receipt_records" DROP COLUMN "name",
ADD COLUMN     "accountReceiptNoteDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "accountReceiptNoteNo" TEXT NOT NULL,
ADD COLUMN     "alWire" TEXT NOT NULL,
ADD COLUMN     "channel" TEXT NOT NULL,
ADD COLUMN     "conservator" TEXT NOT NULL,
ADD COLUMN     "consigneeName" TEXT NOT NULL,
ADD COLUMN     "consigneeTFRSerialNo" TEXT NOT NULL,
ADD COLUMN     "copperFlexibleCable" TEXT NOT NULL,
ADD COLUMN     "core" TEXT NOT NULL,
ADD COLUMN     "deliveryChallanId" TEXT NOT NULL,
ADD COLUMN     "discomReceiptNoteDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "discomReceiptNoteNo" TEXT NOT NULL,
ADD COLUMN     "fuse" TEXT NOT NULL,
ADD COLUMN     "htMetalParts" TEXT NOT NULL,
ADD COLUMN     "hvBushing" TEXT NOT NULL,
ADD COLUMN     "icb" TEXT NOT NULL,
ADD COLUMN     "ltMetalParts" TEXT NOT NULL,
ADD COLUMN     "lvBushing" TEXT NOT NULL,
ADD COLUMN     "mAndpBox" TEXT NOT NULL,
ADD COLUMN     "mAndpBoxCover" TEXT NOT NULL,
ADD COLUMN     "mccb" TEXT NOT NULL,
ADD COLUMN     "oilLevel" TEXT NOT NULL,
ADD COLUMN     "originalTfrSrNo" TEXT NOT NULL,
ADD COLUMN     "polySealNo" TEXT NOT NULL,
ADD COLUMN     "radiator" TEXT NOT NULL,
ADD COLUMN     "rating" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "sealNoTimeOfGPReceived" TEXT NOT NULL,
ADD COLUMN     "sinNo" TEXT NOT NULL,
ADD COLUMN     "trfsiNo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "new_gp_receipt_records_deliveryChallanId_key" ON "new_gp_receipt_records"("deliveryChallanId");

-- AddForeignKey
ALTER TABLE "new_gp_receipt_records" ADD CONSTRAINT "new_gp_receipt_records_deliveryChallanId_fkey" FOREIGN KEY ("deliveryChallanId") REFERENCES "delivery_challans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
