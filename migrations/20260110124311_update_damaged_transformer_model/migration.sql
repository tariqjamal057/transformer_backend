-- AlterTable
ALTER TABLE "damaged_transformers" ADD COLUMN     "ctlReportDate" TIMESTAMP(3),
ADD COLUMN     "ctlReportNo" TEXT,
ADD COLUMN     "finalInspectionId" TEXT,
ADD COLUMN     "liftingFromAcos" TEXT,
ADD COLUMN     "liftingLetterDate" TIMESTAMP(3),
ADD COLUMN     "liftingLetterNo" TEXT,
ADD COLUMN     "reasonOfDamaged" TEXT,
ADD COLUMN     "snNumberRange" TEXT;
