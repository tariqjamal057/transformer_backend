/*
  Warnings:

  - Added the required column `name` to the `supply_tenders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "supply_tenders" ADD COLUMN     "name" TEXT NOT NULL;
