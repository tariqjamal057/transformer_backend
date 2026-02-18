/*
  Warnings:

  - You are about to drop the column `status` on the `delivery_challans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "delivery_challans" DROP COLUMN "status",
ADD COLUMN     "repairedSerialNumbers" JSONB,
ADD COLUMN     "selectedTransformers" JSONB;
