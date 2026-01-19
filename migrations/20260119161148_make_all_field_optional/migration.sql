/*
  Warnings:

  - Added the required column `updatedAt` to the `final_inspection_consignees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `final_inspection_transformers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_doneByUserId_fkey";

-- DropForeignKey
ALTER TABLE "chalan_descriptions" DROP CONSTRAINT "chalan_descriptions_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "consignees" DROP CONSTRAINT "consignees_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "damaged_transformers" DROP CONSTRAINT "damaged_transformers_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "defferments" DROP CONSTRAINT "defferments_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "delivery_challans" DROP CONSTRAINT "delivery_challans_consigneeId_fkey";

-- DropForeignKey
ALTER TABLE "delivery_challans" DROP CONSTRAINT "delivery_challans_finalInspectionId_fkey";

-- DropForeignKey
ALTER TABLE "delivery_challans" DROP CONSTRAINT "delivery_challans_materialDescriptionId_fkey";

-- DropForeignKey
ALTER TABLE "delivery_challans" DROP CONSTRAINT "delivery_challans_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "delivery_details" DROP CONSTRAINT "delivery_details_deliveryChalanId_fkey";

-- DropForeignKey
ALTER TABLE "delivery_details" DROP CONSTRAINT "delivery_details_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "delivery_schedules" DROP CONSTRAINT "delivery_schedules_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "di_receiveds" DROP CONSTRAINT "di_receiveds_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "failure_analyses" DROP CONSTRAINT "failure_analyses_gpFailureId_fkey";

-- DropForeignKey
ALTER TABLE "failure_analyses" DROP CONSTRAINT "failure_analyses_newGPReceiptRecordId_fkey";

-- DropForeignKey
ALTER TABLE "failure_analyses" DROP CONSTRAINT "failure_analyses_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "final_inspection_consignees" DROP CONSTRAINT "final_inspection_consignees_consigneeId_fkey";

-- DropForeignKey
ALTER TABLE "final_inspection_consignees" DROP CONSTRAINT "final_inspection_consignees_finalInspectionId_fkey";

-- DropForeignKey
ALTER TABLE "final_inspection_transformers" DROP CONSTRAINT "final_inspection_transformers_finalInspectionId_fkey";

-- DropForeignKey
ALTER TABLE "final_inspection_transformers" DROP CONSTRAINT "final_inspection_transformers_transformerId_fkey";

-- DropForeignKey
ALTER TABLE "final_inspections" DROP CONSTRAINT "final_inspections_deliveryScheduleId_fkey";

-- DropForeignKey
ALTER TABLE "final_inspections" DROP CONSTRAINT "final_inspections_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "gp_extended_warranty_informations" DROP CONSTRAINT "gp_extended_warranty_informations_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "gp_failures" DROP CONSTRAINT "gp_failures_deliveryChallanId_fkey";

-- DropForeignKey
ALTER TABLE "gp_failures" DROP CONSTRAINT "gp_failures_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "gp_receipt_notes" DROP CONSTRAINT "gp_receipt_notes_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "inspection_dones" DROP CONSTRAINT "inspection_dones_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "loas" DROP CONSTRAINT "loas_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "material_descriptions" DROP CONSTRAINT "material_descriptions_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "material_offered_but_nomination_pendings" DROP CONSTRAINT "material_offered_but_nomination_pendings_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "new_gp_information" DROP CONSTRAINT "new_gp_information_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "new_gp_information_records" DROP CONSTRAINT "new_gp_information_records_newGPInformationId_fkey";

-- DropForeignKey
ALTER TABLE "new_gp_information_records" DROP CONSTRAINT "new_gp_information_records_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "new_gp_receipt_records" DROP CONSTRAINT "new_gp_receipt_records_deliveryChallanId_fkey";

-- DropForeignKey
ALTER TABLE "new_gp_receipt_records" DROP CONSTRAINT "new_gp_receipt_records_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "new_gp_summaries" DROP CONSTRAINT "new_gp_summaries_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "new_gp_transformers" DROP CONSTRAINT "new_gp_transformers_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "nomination_dones" DROP CONSTRAINT "nomination_dones_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "production_plannings" DROP CONSTRAINT "production_plannings_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "supply_gp_expired_statements" DROP CONSTRAINT "supply_gp_expired_statements_supplyTenderId_fkey";

-- DropForeignKey
ALTER TABLE "supply_tenders" DROP CONSTRAINT "supply_tenders_companyId_fkey";

-- DropForeignKey
ALTER TABLE "tns" DROP CONSTRAINT "tns_supplyTenderId_fkey";

-- DropIndex
DROP INDEX "companies_name_key";

-- DropIndex
DROP INDEX "damaged_transformers_serialNo_key";

-- DropIndex
DROP INDEX "delivery_details_deliveryChalanId_key";

-- DropIndex
DROP INDEX "failure_analyses_gpFailureId_key";

-- DropIndex
DROP INDEX "failure_analyses_newGPReceiptRecordId_key";

-- DropIndex
DROP INDEX "final_inspection_consignees_finalInspectionId_consigneeId_key";

-- DropIndex
DROP INDEX "final_inspection_transformers_finalInspectionId_transformer_key";

-- DropIndex
DROP INDEX "new_gp_receipt_records_deliveryChallanId_key";

-- DropIndex
DROP INDEX "supply_tenders_tenderNo_key";

-- DropIndex
DROP INDEX "tns_tnNumber_key";

-- DropIndex
DROP INDEX "transformers_serialNo_key";

-- DropIndex
DROP INDEX "users_loginId_key";

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "modelName" DROP NOT NULL,
ALTER COLUMN "timestamp" DROP NOT NULL,
ALTER COLUMN "timestamp" DROP DEFAULT,
ALTER COLUMN "doneByUserId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "chalan_descriptions" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "gstNo" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "logo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "consignees" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "gstNo" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "damaged_transformers" ALTER COLUMN "serialNo" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "defferments" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "delivery_challans" ALTER COLUMN "finalInspectionId" DROP NOT NULL,
ALTER COLUMN "challanNo" DROP NOT NULL,
ALTER COLUMN "consignorName" DROP NOT NULL,
ALTER COLUMN "consignorAddress" DROP NOT NULL,
ALTER COLUMN "consignorPhone" DROP NOT NULL,
ALTER COLUMN "consignorGST" DROP NOT NULL,
ALTER COLUMN "consignorEmail" DROP NOT NULL,
ALTER COLUMN "consigneeId" DROP NOT NULL,
ALTER COLUMN "lorryNo" DROP NOT NULL,
ALTER COLUMN "challanDescription" DROP NOT NULL,
ALTER COLUMN "materialDescriptionId" DROP NOT NULL,
ALTER COLUMN "truckDriverName" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "delivery_details" ALTER COLUMN "deliveryChalanId" DROP NOT NULL,
ALTER COLUMN "receiptedChallanDate" DROP NOT NULL,
ALTER COLUMN "receiptedChallanNo" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "delivery_schedules" ALTER COLUMN "rating" DROP NOT NULL,
ALTER COLUMN "wound" DROP NOT NULL,
ALTER COLUMN "phase" DROP NOT NULL,
ALTER COLUMN "loa" DROP NOT NULL,
ALTER COLUMN "loaDate" DROP NOT NULL,
ALTER COLUMN "po" DROP NOT NULL,
ALTER COLUMN "poDate" DROP NOT NULL,
ALTER COLUMN "commencementDays" DROP NOT NULL,
ALTER COLUMN "commencementDate" DROP NOT NULL,
ALTER COLUMN "deliveryScheduleDate" DROP NOT NULL,
ALTER COLUMN "imposedLetters" DROP NOT NULL,
ALTER COLUMN "liftingLetters" DROP NOT NULL,
ALTER COLUMN "guaranteePeriodMonths" DROP NOT NULL,
ALTER COLUMN "totalQuantity" DROP NOT NULL,
ALTER COLUMN "chalanDescription" DROP NOT NULL,
ALTER COLUMN "deliverySchedule" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "di_receiveds" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "failure_analyses" ALTER COLUMN "acosName" DROP NOT NULL,
ALTER COLUMN "reasonOfFailure" DROP NOT NULL,
ALTER COLUMN "gpFailureId" DROP NOT NULL,
ALTER COLUMN "newGPReceiptRecordId" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "final_inspection_consignees" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "finalInspectionId" DROP NOT NULL,
ALTER COLUMN "consigneeId" DROP NOT NULL,
ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "subSerialNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "final_inspection_transformers" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "finalInspectionId" DROP NOT NULL,
ALTER COLUMN "transformerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "final_inspections" ALTER COLUMN "deliveryScheduleId" DROP NOT NULL,
ALTER COLUMN "serialNumberFrom" DROP NOT NULL,
ALTER COLUMN "serialNumberTo" DROP NOT NULL,
ALTER COLUMN "offerDate" DROP NOT NULL,
ALTER COLUMN "offeredQuantity" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "gp_extended_warranty_informations" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "gp_failures" ALTER COLUMN "deliveryChallanId" DROP NOT NULL,
ALTER COLUMN "trfsiNo" DROP NOT NULL,
ALTER COLUMN "rating" DROP NOT NULL,
ALTER COLUMN "subDivision" DROP NOT NULL,
ALTER COLUMN "failureDetails" DROP NOT NULL,
ALTER COLUMN "guaranteeExpiry" DROP NOT NULL,
ALTER COLUMN "guaranteeStatus" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "gp_receipt_notes" ALTER COLUMN "accountReceiptNoteNo" DROP NOT NULL,
ALTER COLUMN "accountReceiptNoteDate" DROP NOT NULL,
ALTER COLUMN "discomReceiptNoteNo" DROP NOT NULL,
ALTER COLUMN "discomReceiptNoteDate" DROP NOT NULL,
ALTER COLUMN "acos" DROP NOT NULL,
ALTER COLUMN "selectDateFrom" DROP NOT NULL,
ALTER COLUMN "selectDateTo" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "inspection_dones" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "loas" ALTER COLUMN "tnDetail" DROP NOT NULL,
ALTER COLUMN "loa" DROP NOT NULL,
ALTER COLUMN "po" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "material_descriptions" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "phase" DROP NOT NULL,
ALTER COLUMN "rating" DROP NOT NULL,
ALTER COLUMN "wound" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "material_offered_but_nomination_pendings" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_information" ALTER COLUMN "challanReceiptedItemNo" DROP NOT NULL,
ALTER COLUMN "challanReceiptedDate" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_information_records" ALTER COLUMN "newGPInformationId" DROP NOT NULL,
ALTER COLUMN "trfsiNo" DROP NOT NULL,
ALTER COLUMN "rating" DROP NOT NULL,
ALTER COLUMN "polyCarbonateSealNo" DROP NOT NULL,
ALTER COLUMN "challanNo" DROP NOT NULL,
ALTER COLUMN "consigneeName" DROP NOT NULL,
ALTER COLUMN "isMatched" DROP NOT NULL,
ALTER COLUMN "isMatched" DROP DEFAULT,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_receipt_records" ALTER COLUMN "accountReceiptNoteDate" DROP NOT NULL,
ALTER COLUMN "accountReceiptNoteNo" DROP NOT NULL,
ALTER COLUMN "alWire" DROP NOT NULL,
ALTER COLUMN "channel" DROP NOT NULL,
ALTER COLUMN "conservator" DROP NOT NULL,
ALTER COLUMN "consigneeName" DROP NOT NULL,
ALTER COLUMN "consigneeTFRSerialNo" DROP NOT NULL,
ALTER COLUMN "copperFlexibleCable" DROP NOT NULL,
ALTER COLUMN "core" DROP NOT NULL,
ALTER COLUMN "deliveryChallanId" DROP NOT NULL,
ALTER COLUMN "discomReceiptNoteDate" DROP NOT NULL,
ALTER COLUMN "discomReceiptNoteNo" DROP NOT NULL,
ALTER COLUMN "fuse" DROP NOT NULL,
ALTER COLUMN "htMetalParts" DROP NOT NULL,
ALTER COLUMN "hvBushing" DROP NOT NULL,
ALTER COLUMN "icb" DROP NOT NULL,
ALTER COLUMN "ltMetalParts" DROP NOT NULL,
ALTER COLUMN "lvBushing" DROP NOT NULL,
ALTER COLUMN "mAndpBox" DROP NOT NULL,
ALTER COLUMN "mAndpBoxCover" DROP NOT NULL,
ALTER COLUMN "mccb" DROP NOT NULL,
ALTER COLUMN "oilLevel" DROP NOT NULL,
ALTER COLUMN "originalTfrSrNo" DROP NOT NULL,
ALTER COLUMN "polySealNo" DROP NOT NULL,
ALTER COLUMN "radiator" DROP NOT NULL,
ALTER COLUMN "rating" DROP NOT NULL,
ALTER COLUMN "sealNoTimeOfGPReceived" DROP NOT NULL,
ALTER COLUMN "sinNo" DROP NOT NULL,
ALTER COLUMN "trfsiNo" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_summaries" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "new_gp_transformers" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "nomination_dones" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "production_plannings" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "supply_gp_expired_statements" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "supply_tenders" ALTER COLUMN "tenderNo" DROP NOT NULL,
ALTER COLUMN "tenderDate" DROP NOT NULL,
ALTER COLUMN "companyId" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tns" ALTER COLUMN "tnNumber" DROP NOT NULL,
ALTER COLUMN "discom" DROP NOT NULL,
ALTER COLUMN "supplyTenderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transformers" ALTER COLUMN "serialNo" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "loginId" DROP NOT NULL,
ALTER COLUMN "number" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "pages" DROP NOT NULL,
ALTER COLUMN "isActive" DROP NOT NULL,
ALTER COLUMN "isActive" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "consignees" ADD CONSTRAINT "consignees_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_schedules" ADD CONSTRAINT "delivery_schedules_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspections" ADD CONSTRAINT "final_inspections_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspections" ADD CONSTRAINT "final_inspections_deliveryScheduleId_fkey" FOREIGN KEY ("deliveryScheduleId") REFERENCES "delivery_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspection_consignees" ADD CONSTRAINT "final_inspection_consignees_finalInspectionId_fkey" FOREIGN KEY ("finalInspectionId") REFERENCES "final_inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspection_consignees" ADD CONSTRAINT "final_inspection_consignees_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "consignees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspection_transformers" ADD CONSTRAINT "final_inspection_transformers_finalInspectionId_fkey" FOREIGN KEY ("finalInspectionId") REFERENCES "final_inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspection_transformers" ADD CONSTRAINT "final_inspection_transformers_transformerId_fkey" FOREIGN KEY ("transformerId") REFERENCES "transformers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_finalInspectionId_fkey" FOREIGN KEY ("finalInspectionId") REFERENCES "final_inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "consignees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_materialDescriptionId_fkey" FOREIGN KEY ("materialDescriptionId") REFERENCES "material_descriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_failures" ADD CONSTRAINT "gp_failures_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_failures" ADD CONSTRAINT "gp_failures_deliveryChallanId_fkey" FOREIGN KEY ("deliveryChallanId") REFERENCES "delivery_challans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_receipt_notes" ADD CONSTRAINT "gp_receipt_notes_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failure_analyses" ADD CONSTRAINT "failure_analyses_newGPReceiptRecordId_fkey" FOREIGN KEY ("newGPReceiptRecordId") REFERENCES "new_gp_receipt_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failure_analyses" ADD CONSTRAINT "failure_analyses_gpFailureId_fkey" FOREIGN KEY ("gpFailureId") REFERENCES "gp_failures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failure_analyses" ADD CONSTRAINT "failure_analyses_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tns" ADD CONSTRAINT "tns_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loas" ADD CONSTRAINT "loas_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_information" ADD CONSTRAINT "new_gp_information_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_information_records" ADD CONSTRAINT "new_gp_information_records_newGPInformationId_fkey" FOREIGN KEY ("newGPInformationId") REFERENCES "new_gp_information"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_information_records" ADD CONSTRAINT "new_gp_information_records_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_doneByUserId_fkey" FOREIGN KEY ("doneByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_tenders" ADD CONSTRAINT "supply_tenders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defferments" ADD CONSTRAINT "defferments_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_details" ADD CONSTRAINT "delivery_details_deliveryChalanId_fkey" FOREIGN KEY ("deliveryChalanId") REFERENCES "delivery_challans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_details" ADD CONSTRAINT "delivery_details_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_descriptions" ADD CONSTRAINT "material_descriptions_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chalan_descriptions" ADD CONSTRAINT "chalan_descriptions_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damaged_transformers" ADD CONSTRAINT "damaged_transformers_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_receipt_records" ADD CONSTRAINT "new_gp_receipt_records_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_receipt_records" ADD CONSTRAINT "new_gp_receipt_records_deliveryChallanId_fkey" FOREIGN KEY ("deliveryChallanId") REFERENCES "delivery_challans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_offered_but_nomination_pendings" ADD CONSTRAINT "material_offered_but_nomination_pendings_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_dones" ADD CONSTRAINT "nomination_dones_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_dones" ADD CONSTRAINT "inspection_dones_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "di_receiveds" ADD CONSTRAINT "di_receiveds_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_plannings" ADD CONSTRAINT "production_plannings_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_transformers" ADD CONSTRAINT "new_gp_transformers_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_gp_summaries" ADD CONSTRAINT "new_gp_summaries_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_gp_expired_statements" ADD CONSTRAINT "supply_gp_expired_statements_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_extended_warranty_informations" ADD CONSTRAINT "gp_extended_warranty_informations_supplyTenderId_fkey" FOREIGN KEY ("supplyTenderId") REFERENCES "supply_tenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
