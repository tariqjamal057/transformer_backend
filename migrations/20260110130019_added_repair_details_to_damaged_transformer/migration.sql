-- AlterTable
ALTER TABLE "damaged_transformers" ADD COLUMN     "challanDate" TIMESTAMP(3),
ADD COLUMN     "challanNo" TEXT,
ADD COLUMN     "dateOfInspectionAfterRepair" TIMESTAMP(3),
ADD COLUMN     "deliveredToAcos" TEXT;
