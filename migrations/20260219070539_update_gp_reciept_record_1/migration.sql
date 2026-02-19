-- AlterTable
ALTER TABLE "new_gp_receipt_records" ADD COLUMN     "deliveredToAcos" TEXT,
ADD COLUMN     "recChallanItemDate" TIMESTAMP(3),
ADD COLUMN     "recChallanItemNo" TEXT;
