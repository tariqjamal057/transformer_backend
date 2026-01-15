/*
  Warnings:

  - You are about to drop the column `dateOfExpiry` on the `failure_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfSupply` on the `failure_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `locationOfFailure` on the `failure_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `phase` on the `failure_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `failure_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `sinNo` on the `failure_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `subDivision` on the `failure_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `tnNumber` on the `failure_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `trfSiNo` on the `failure_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `wound` on the `failure_analyses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[newGPReceiptRecordId]` on the table `failure_analyses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gpFailureId]` on the table `failure_analyses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gpFailureId` to the `failure_analyses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `newGPReceiptRecordId` to the `failure_analyses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "failure_analyses" DROP COLUMN "dateOfExpiry",
DROP COLUMN "dateOfSupply",
DROP COLUMN "locationOfFailure",
DROP COLUMN "phase",
DROP COLUMN "rating",
DROP COLUMN "sinNo",
DROP COLUMN "subDivision",
DROP COLUMN "tnNumber",
DROP COLUMN "trfSiNo",
DROP COLUMN "wound",
ADD COLUMN     "gpFailureId" TEXT NOT NULL,
ADD COLUMN     "newGPReceiptRecordId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "failure_analyses_newGPReceiptRecordId_key" ON "failure_analyses"("newGPReceiptRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "failure_analyses_gpFailureId_key" ON "failure_analyses"("gpFailureId");

-- AddForeignKey
ALTER TABLE "failure_analyses" ADD CONSTRAINT "failure_analyses_newGPReceiptRecordId_fkey" FOREIGN KEY ("newGPReceiptRecordId") REFERENCES "new_gp_receipt_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failure_analyses" ADD CONSTRAINT "failure_analyses_gpFailureId_fkey" FOREIGN KEY ("gpFailureId") REFERENCES "gp_failures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
