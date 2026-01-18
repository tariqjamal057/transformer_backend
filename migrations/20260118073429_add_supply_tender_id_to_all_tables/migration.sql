/*
  Warnings:

  - Added the required column `supplyTenderId` to the `chalan_descriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `consignees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `damaged_transformers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `defferments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `delivery_challans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `delivery_details` table without a default value. This is not possible if the table is not empty.
  - Made the column `supplyTenderId` on table `delivery_schedules` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `supplyTenderId` to the `di_receiveds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `failure_analyses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `final_inspections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `gp_extended_warranty_informations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `gp_failures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `gp_receipt_notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `inspection_dones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `loas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `material_descriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `material_offered_but_nomination_pendings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `new_gp_information` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `new_gp_information_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `new_gp_receipt_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `new_gp_summaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `new_gp_transformers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `nomination_dones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `production_plannings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `supply_gp_expired_statements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyTenderId` to the `tns` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "delivery_schedules" DROP CONSTRAINT "delivery_schedules_supplyTenderId_fkey";

-- AlterTable
ALTER TABLE "chalan_descriptions" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "consignees" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "damaged_transformers" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "defferments" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "delivery_challans" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "delivery_details" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "delivery_schedules" ALTER COLUMN "supplyTenderId" SET NOT NULL;

-- AlterTable
ALTER TABLE "di_receiveds" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "failure_analyses" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "final_inspections" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "gp_extended_warranty_informations" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "gp_failures" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "gp_receipt_notes" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inspection_dones" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "loas" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "material_descriptions" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "material_offered_but_nomination_pendings" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_information" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_information_records" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_receipt_records" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_summaries" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_transformers" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "nomination_dones" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "production_plannings" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "supply_gp_expired_statements" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tns" ADD COLUMN     "supplyTenderId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "consignees" ADD CONSTRAINT "consignees_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_schedules" ADD CONSTRAINT "delivery_schedules_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspections" ADD CONSTRAINT "final_inspections_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_failures" ADD CONSTRAINT "gp_failures_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_receipt_notes" ADD CONSTRAINT "gp_receipt_notes_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failure_analyses" ADD CONSTRAINT "failure_analyses_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tns" ADD CONSTRAINT "tns_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loas" ADD CONSTRAINT "loas_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_information" ADD CONSTRAINT "new_gp_information_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_information_records" ADD CONSTRAINT "new_gp_information_records_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defferments" ADD CONSTRAINT "defferments_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_details" ADD CONSTRAINT "delivery_details_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_descriptions" ADD CONSTRAINT "material_descriptions_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chalan_descriptions" ADD CONSTRAINT "chalan_descriptions_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damaged_transformers" ADD CONSTRAINT "damaged_transformers_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_receipt_records" ADD CONSTRAINT "new_gp_receipt_records_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_offered_but_nomination_pendings" ADD CONSTRAINT "material_offered_but_nomination_pendings_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_dones" ADD CONSTRAINT "nomination_dones_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_dones" ADD CONSTRAINT "inspection_dones_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "di_receiveds" ADD CONSTRAINT "di_receiveds_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_plannings" ADD CONSTRAINT "production_plannings_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_transformers" ADD CONSTRAINT "new_gp_transformers_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_summaries" ADD CONSTRAINT "new_gp_summaries_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_gp_expired_statements" ADD CONSTRAINT "supply_gp_expired_statements_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_extended_warranty_informations" ADD CONSTRAINT "gp_extended_warranty_informations_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
