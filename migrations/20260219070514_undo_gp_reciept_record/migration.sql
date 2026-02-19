/*
  Warnings:

  - You are about to drop the column `recChallanItemDate` on the `damaged_transformers` table. All the data in the column will be lost.
  - You are about to drop the column `recChallanItemNo` on the `damaged_transformers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "damaged_transformers" DROP COLUMN "recChallanItemDate",
DROP COLUMN "recChallanItemNo";
