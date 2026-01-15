/*
  Warnings:

  - You are about to drop the column `challanDate` on the `new_gp_information` table. All the data in the column will be lost.
  - You are about to drop the column `challanNo` on the `new_gp_information` table. All the data in the column will be lost.
  - You are about to drop the column `consigneeName` on the `new_gp_information` table. All the data in the column will be lost.
  - You are about to drop the column `inspectionDate` on the `new_gp_information` table. All the data in the column will be lost.
  - You are about to drop the column `isMatched` on the `new_gp_information` table. All the data in the column will be lost.
  - You are about to drop the column `polyCarbonateSealNo` on the `new_gp_information` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `new_gp_information` table. All the data in the column will be lost.
  - You are about to drop the column `receivedFromACOS` on the `new_gp_information` table. All the data in the column will be lost.
  - You are about to drop the column `trfsiNo` on the `new_gp_information` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "new_gp_information" DROP COLUMN "challanDate",
DROP COLUMN "challanNo",
DROP COLUMN "consigneeName",
DROP COLUMN "inspectionDate",
DROP COLUMN "isMatched",
DROP COLUMN "polyCarbonateSealNo",
DROP COLUMN "rating",
DROP COLUMN "receivedFromACOS",
DROP COLUMN "trfsiNo";

-- CreateTable
CREATE TABLE "new_gp_information_records" (
    "id" TEXT NOT NULL,
    "newGPInformationId" TEXT NOT NULL,
    "trfsiNo" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "polyCarbonateSealNo" TEXT NOT NULL,
    "receivedFromACOS" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "challanNo" TEXT NOT NULL,
    "challanDate" TIMESTAMP(3),
    "consigneeName" TEXT NOT NULL,
    "isMatched" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "new_gp_information_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "new_gp_information_records" ADD CONSTRAINT "new_gp_information_records_newGPInformationId_fkey" FOREIGN KEY ("newGPInformationId") REFERENCES "new_gp_information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
