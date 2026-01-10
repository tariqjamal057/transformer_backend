/*
  Warnings:

  - Added the required column `name` to the `material_descriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phase` to the `material_descriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `material_descriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wound` to the `material_descriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "material_descriptions" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phase" TEXT NOT NULL,
ADD COLUMN     "rating" TEXT NOT NULL,
ADD COLUMN     "wound" TEXT NOT NULL;
