/*
  Warnings:

  - You are about to drop the column `driverName` on the `delivery_challans` table. All the data in the column will be lost.
  - You are about to drop the column `materialDescription` on the `delivery_challans` table. All the data in the column will be lost.
  - You are about to drop the column `subSerialFrom` on the `delivery_challans` table. All the data in the column will be lost.
  - You are about to drop the column `subSerialTo` on the `delivery_challans` table. All the data in the column will be lost.
  - Added the required column `materialDescriptionId` to the `delivery_challans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `truckDriverName` to the `delivery_challans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "delivery_challans" DROP COLUMN "driverName",
DROP COLUMN "materialDescription",
DROP COLUMN "subSerialFrom",
DROP COLUMN "subSerialTo",
ADD COLUMN     "materialDescriptionId" TEXT NOT NULL,
ADD COLUMN     "subSerialNumberFrom" TEXT,
ADD COLUMN     "subSerialNumberTo" TEXT,
ADD COLUMN     "truckDriverName" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_materialDescriptionId_fkey" FOREIGN KEY ("materialDescriptionId") REFERENCES "material_descriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
