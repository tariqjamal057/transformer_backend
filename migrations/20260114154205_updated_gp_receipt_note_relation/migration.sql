/*
  Warnings:

  - You are about to drop the column `alWire` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `challanNo` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `conservator` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `consigneeTFRSerialNo` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `copperFlexibleCable` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `core` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `fuse` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `htMetalParts` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `hvBushing` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `icb` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `ltMetalParts` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `lvBushing` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `mAndpBox` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `mAndpBoxCover` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `mccb` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `oilLevel` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `polySealNo` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `radiator` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `sealNoTimeOfGPReceived` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `sinNo` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - You are about to drop the column `trfsiNo` on the `gp_receipt_notes` table. All the data in the column will be lost.
  - Added the required column `acos` to the `gp_receipt_notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectDateFrom` to the `gp_receipt_notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectDateTo` to the `gp_receipt_notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gp_receipt_notes" DROP COLUMN "alWire",
DROP COLUMN "challanNo",
DROP COLUMN "channel",
DROP COLUMN "conservator",
DROP COLUMN "consigneeTFRSerialNo",
DROP COLUMN "copperFlexibleCable",
DROP COLUMN "core",
DROP COLUMN "fuse",
DROP COLUMN "htMetalParts",
DROP COLUMN "hvBushing",
DROP COLUMN "icb",
DROP COLUMN "ltMetalParts",
DROP COLUMN "lvBushing",
DROP COLUMN "mAndpBox",
DROP COLUMN "mAndpBoxCover",
DROP COLUMN "mccb",
DROP COLUMN "oilLevel",
DROP COLUMN "polySealNo",
DROP COLUMN "radiator",
DROP COLUMN "rating",
DROP COLUMN "remarks",
DROP COLUMN "sealNoTimeOfGPReceived",
DROP COLUMN "sinNo",
DROP COLUMN "trfsiNo",
ADD COLUMN     "acos" TEXT NOT NULL,
ADD COLUMN     "selectDateFrom" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "selectDateTo" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_receipt_records" ADD COLUMN     "gpReceiptNoteId" TEXT;

-- AddForeignKey
ALTER TABLE "new_gp_receipt_records" ADD CONSTRAINT "new_gp_receipt_records_gpReceiptNoteId_fkey" FOREIGN KEY ("gpReceiptNoteId") REFERENCES "gp_receipt_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
