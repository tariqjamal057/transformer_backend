-- CreateEnum
CREATE TYPE "TransformerStatus" AS ENUM ('AVAILABLE', 'DAMAGED', 'REPAIRED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'DATA_FEEDER', 'SUPERVISOR');

-- CreateTable
CREATE TABLE "consignees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "gstNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_schedules" (
    "id" TEXT NOT NULL,
    "tnNumber" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "wound" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "loa" TEXT NOT NULL,
    "loaDate" TIMESTAMP(3) NOT NULL,
    "po" TEXT NOT NULL,
    "poDate" TIMESTAMP(3) NOT NULL,
    "commencementDays" INTEGER NOT NULL,
    "commencementDate" TIMESTAMP(3) NOT NULL,
    "deliveryScheduleDate" TIMESTAMP(3) NOT NULL,
    "imposedLetters" JSONB NOT NULL,
    "liftingLetters" JSONB NOT NULL,
    "guaranteePeriodMonths" INTEGER NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "chalanDescription" TEXT NOT NULL,
    "deliverySchedule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_inspections" (
    "id" TEXT NOT NULL,
    "deliveryScheduleId" TEXT NOT NULL,
    "serialNumberFrom" INTEGER NOT NULL,
    "serialNumberTo" INTEGER NOT NULL,
    "offerDate" TIMESTAMP(3) NOT NULL,
    "offeredQuantity" INTEGER NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectedQuantity" INTEGER NOT NULL,
    "inspectionOfficers" JSONB NOT NULL,
    "diNo" TEXT NOT NULL,
    "diDate" TIMESTAMP(3) NOT NULL,
    "warranty" TEXT NOT NULL,
    "consignees" JSONB NOT NULL,
    "sealingDetails" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "final_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transformers" (
    "id" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "status" "TransformerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transformers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_inspection_consignees" (
    "id" TEXT NOT NULL,
    "finalInspectionId" TEXT NOT NULL,
    "consigneeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subSerialNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "final_inspection_consignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_inspection_transformers" (
    "id" TEXT NOT NULL,
    "finalInspectionId" TEXT NOT NULL,
    "transformerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "final_inspection_transformers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_challans" (
    "id" TEXT NOT NULL,
    "finalInspectionId" TEXT NOT NULL,
    "challanNo" TEXT NOT NULL,
    "subSerialFrom" TEXT,
    "subSerialTo" TEXT,
    "consignorName" TEXT NOT NULL,
    "consignorAddress" TEXT NOT NULL,
    "consignorPhone" TEXT NOT NULL,
    "consignorGST" TEXT NOT NULL,
    "consignorEmail" TEXT NOT NULL,
    "consigneeId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "lorryNo" TEXT NOT NULL,
    "challanDescription" TEXT NOT NULL,
    "materialDescription" TEXT NOT NULL,
    "challanCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_challans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_failures" (
    "id" TEXT NOT NULL,
    "deliveryChallanId" TEXT NOT NULL,
    "trfsiNo" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "subDivision" TEXT NOT NULL,
    "failureDetails" JSONB NOT NULL,
    "guaranteeExpiry" TIMESTAMP(3) NOT NULL,
    "guaranteeStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_failures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_receipt_notes" (
    "id" TEXT NOT NULL,
    "accountReceiptNoteNo" TEXT NOT NULL,
    "accountReceiptNoteDate" TIMESTAMP(3) NOT NULL,
    "sinNo" TEXT NOT NULL,
    "consigneeName" TEXT NOT NULL,
    "discomReceiptNoteNo" TEXT NOT NULL,
    "discomReceiptNoteDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "trfsiNo" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "challanNo" TEXT NOT NULL,
    "sealNoTimeOfGPReceived" TEXT NOT NULL,
    "consigneeTFRSerialNo" TEXT NOT NULL,
    "oilLevel" TEXT NOT NULL,
    "hvBushing" TEXT NOT NULL,
    "lvBushing" TEXT NOT NULL,
    "htMetalParts" TEXT NOT NULL,
    "ltMetalParts" TEXT NOT NULL,
    "mAndpBox" TEXT NOT NULL,
    "mAndpBoxCover" TEXT NOT NULL,
    "mccb" TEXT NOT NULL,
    "icb" TEXT NOT NULL,
    "copperFlexibleCable" TEXT NOT NULL,
    "alWire" TEXT NOT NULL,
    "conservator" TEXT NOT NULL,
    "radiator" TEXT NOT NULL,
    "fuse" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "core" TEXT NOT NULL,
    "polySealNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_receipt_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failure_analyses" (
    "id" TEXT NOT NULL,
    "sinNo" TEXT NOT NULL,
    "acosName" TEXT NOT NULL,
    "trfSiNo" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "wound" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "tnNumber" TEXT NOT NULL,
    "subDivision" TEXT NOT NULL,
    "locationOfFailure" TEXT NOT NULL,
    "dateOfSupply" TIMESTAMP(3) NOT NULL,
    "dateOfExpiry" TIMESTAMP(3) NOT NULL,
    "reasonOfFailure" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "failure_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tns" (
    "id" TEXT NOT NULL,
    "tnNumber" TEXT NOT NULL,
    "discom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loas" (
    "id" TEXT NOT NULL,
    "tnDetail" TEXT NOT NULL,
    "loa" TEXT NOT NULL,
    "po" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "pages" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "new_gp_information" (
    "id" TEXT NOT NULL,
    "challanReceiptedItemNo" TEXT NOT NULL,
    "challanReceiptedDate" TIMESTAMP(3) NOT NULL,
    "trfsiNo" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "polyCarbonateSealNo" TEXT NOT NULL,
    "receivedFromACOS" TEXT,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "challanNo" TEXT NOT NULL,
    "challanDate" TIMESTAMP(3) NOT NULL,
    "consigneeName" TEXT NOT NULL,
    "isMatched" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "new_gp_information_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_schedules_tnNumber_key" ON "delivery_schedules"("tnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "transformers_serialNo_key" ON "transformers"("serialNo");

-- CreateIndex
CREATE UNIQUE INDEX "final_inspection_consignees_finalInspectionId_consigneeId_key" ON "final_inspection_consignees"("finalInspectionId", "consigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "final_inspection_transformers_finalInspectionId_transformer_key" ON "final_inspection_transformers"("finalInspectionId", "transformerId");

-- CreateIndex
CREATE UNIQUE INDEX "tns_tnNumber_key" ON "tns"("tnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "final_inspections" ADD CONSTRAINT "final_inspections_deliveryScheduleId_fkey" FOREIGN KEY ("deliveryScheduleId") REFERENCES "delivery_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspection_consignees" ADD CONSTRAINT "final_inspection_consignees_finalInspectionId_fkey" FOREIGN KEY ("finalInspectionId") REFERENCES "final_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspection_consignees" ADD CONSTRAINT "final_inspection_consignees_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "consignees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspection_transformers" ADD CONSTRAINT "final_inspection_transformers_finalInspectionId_fkey" FOREIGN KEY ("finalInspectionId") REFERENCES "final_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspection_transformers" ADD CONSTRAINT "final_inspection_transformers_transformerId_fkey" FOREIGN KEY ("transformerId") REFERENCES "transformers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_finalInspectionId_fkey" FOREIGN KEY ("finalInspectionId") REFERENCES "final_inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "consignees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_failures" ADD CONSTRAINT "gp_failures_deliveryChallanId_fkey" FOREIGN KEY ("deliveryChallanId") REFERENCES "delivery_challans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
