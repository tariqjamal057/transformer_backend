/*
  Warnings:

  - The `serialNo` column on the `damaged_transformers` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "damaged_transformers" DROP COLUMN "serialNo",
ADD COLUMN     "serialNo" TEXT[];
