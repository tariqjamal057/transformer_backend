const express = require("express");
const router = express.Router();
const { PrismaClient, Prisma } = require("@prisma/client");
const { paginate } = require("../utils/pagination");
const { logActivity } = require("../utils/activityLogger");
const { auth, isOwner } = require("../middleware/auth");
const multer = require("multer");
const xlsx = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() });
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Final Inspections
 *   description: Final Inspection management
 */

router.get("/nomination-pending", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const nominationPendingInspections = await prisma.finalInspection.findMany({
      where: {
        offeredQuantity: {
          not: null,
        },
        nominationDate: {
          equals: null,
        },
        inspectionDate: {
          equals: null,
        }
      },
      include: {
        deliverySchedule: {
          include: {
            supplyTender: {
              include: {
                company: true,
              },
            },
            tn: true,
          },
        },
        deliveryChallans: true,
        finalInspectionConsignees: {
          include: {
            consignee: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    res.json(nominationPendingInspections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/nomination-done", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const nominationDoneInspections = await prisma.finalInspection.findMany({
      where: {
        inspectionDate: {
          equals: null,
        },
        inspectionOfficers: {
          not: [],
        },
        nominationDate: {
          not: null,
        },
      },
      include: {
        deliverySchedule: {
          include: {
            supplyTender: {
              include: {
                company: true,
              },
            },
            tn: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const inspectionsWithSnNumber = nominationDoneInspections.map(
      (inspection) => ({
        ...inspection,
        snNumber: `${inspection.serialNumberFrom} TO ${inspection.serialNumberTo}`,
      }),
    );

    res.json(inspectionsWithSnNumber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /final-inspections:
 *   get:
 *     summary: Retrieve a list of final inspections with pagination
 *     tags: [Final Inspections]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number
 *     responses:
 *       200:
 *         description: A list of final inspections.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FinalInspection'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get("/", auth, async (req, res) => {
  try {
    const { all, page = 1, search = "", supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    if (all === "true") {
      const finalInspections = await prisma.finalInspection.findMany({
        where: { supplyTenderId: supplyTenderId },
        orderBy: { createdAt: "asc" },
        include: {
          deliverySchedule: true,
          transformers: {
            include: {
              transformer: true,
            },
          },
          finalInspectionConsignees: {
            include: {
              consignee: true,
            },
          },
        },
      });
      return res.json(finalInspections);
    }
    const pageSize = 10;

    let where = { supplyTenderId: supplyTenderId };
    if (search) {
      const searchNumber = !isNaN(parseInt(search)) ? parseInt(search) : -1; // Use -1 or another value that won't exist
      where.OR = [
        {
          deliverySchedule: {
            tnNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          deliverySchedule: {
            rating: {
              equals: searchNumber,
            },
          },
        },
        {
          inspectionOfficers: {
            has: search,
          },
        },
      ];
    }

    const totalItems = await prisma.finalInspection.count({ where });
    const finalInspections = await prisma.finalInspection.findMany({
      where,
      skip: (parseInt(page, 10) - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: "asc",
      },
      include: {
        deliverySchedule: true,
        transformers: {
          include: {
            transformer: true,
          },
        },
        finalInspectionConsignees: {
          include: {
            consignee: true,
          },
        },
      },
    });

    res.json({
      items: finalInspections,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: parseInt(page, 10),
      totalItems,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * @swagger
 * /final-inspections/total-inspected-quantity:
 *   get:
 *     summary: Get the total inspected quantity for a given supplyTenderId
 *     tags: [Final Inspections]
 *     parameters:
 *       - in: query
 *         name: supplyTenderId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the supply tender
 *     responses:
 *       200:
 *         description: Total inspected quantity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalInspectedQuantity:
 *                   type: number
 *       500:
 *         description: Something went wrong
 */
router.get("/total-inspected-quantity", auth, async (req, res) => {
  try {
    const { supplyTenderId, deliveryScheduleId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const whereClause = {
      supplyTenderId: supplyTenderId,
    };

    if (deliveryScheduleId) {
      whereClause.deliveryScheduleId = deliveryScheduleId;
    }

    const result = await prisma.finalInspection.aggregate({
      _sum: {
        inspectedQuantity: true,
      },
      where: whereClause,
    });
    

    const totalInspectedQuantity = result._sum.inspectedQuantity || 0;

    res.json({ totalInspectedQuantity });
  } catch (error) {
    console.error("Error fetching total inspected quantity:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/bulk-upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: "dd/mm/yyyy",
    });

    if (data.length === 0) {
      return res.status(400).json({ error: "The uploaded file is empty." });
    }

    const parseDate = (dateString) => {
      if (!dateString) return null;
      if (dateString instanceof Date) return dateString;
      
      const parts = String(dateString).split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
      
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
      return null;
    };

    const dataWithRows = data.map((row, index) => ({
      ...row,
      __rowNum: index + 2,
    }));

    const logicalRecords = [];
    let currentLogicalRecord = null;
    const allInvalidRecords = [];

    for (const row of dataWithRows) {
      const isNewRecordStart =
        row.Company ||
        row.Discom ||
        row.TNNumber ||
        row.serialNumberFrom ||
        row.serialNumberTo;

      if (isNewRecordStart) {
        if (currentLogicalRecord) {
          logicalRecords.push(currentLogicalRecord);
        }
        currentLogicalRecord = {
          Company: row.Company,
          Discom: row.Discom,
          TNNumber: row.TNNumber,
          serialNumberFrom: row.serialNumberFrom,
          serialNumberTo: row.serialNumberTo,
          allRows: [row],
          __firstRowNum: row.__rowNum,
        };
      } else {
        if (currentLogicalRecord) {
          currentLogicalRecord.allRows.push(row);
        } else {
          allInvalidRecords.push({
            key: `Row ${row.__rowNum}`,
            row: row.__rowNum,
            errors: ["Continuation row found without main record identifiers."],
          });
        }
      }
    }

    if (currentLogicalRecord) {
      logicalRecords.push(currentLogicalRecord);
    }

    if (allInvalidRecords.length > 0) {
      return res.status(400).json({
        error: "Bulk upload failed due to invalid file structure.",
        details: allInvalidRecords,
      });
    }

    const parsedFinalInspections = [];
    const invalidRecords = [];

    for (const logicalRecord of logicalRecords) {
      const firstRow = logicalRecord.allRows[0];
      const group = logicalRecord.allRows;
      const errorsForGroup = [];
      const recordKey = `${logicalRecord.Company}-${logicalRecord.Discom}-${logicalRecord.TNNumber}-${logicalRecord.serialNumberFrom}-${logicalRecord.serialNumberTo}`;

      if (!logicalRecord.Company) errorsForGroup.push("'Company' is required.");
      if (!logicalRecord.Discom) errorsForGroup.push("'Discom' is required.");
      if (!logicalRecord.TNNumber) errorsForGroup.push("'TNNumber' is required.");
      if (!logicalRecord.serialNumberFrom) errorsForGroup.push("'serialNumberFrom' is required.");
      if (!logicalRecord.serialNumberTo) errorsForGroup.push("'serialNumberTo' is required.");

      const parsedSerialNumberFrom = parseInt(logicalRecord.serialNumberFrom, 10);
      const parsedSerialNumberTo = parseInt(logicalRecord.serialNumberTo, 10);
      const parsedOfferedQuantity = parseInt(firstRow.offeredQuantity, 10);
      const parsedInspectedQuantity = parseInt(firstRow.inspectedQuantity, 10);

      if (isNaN(parsedSerialNumberFrom)) errorsForGroup.push("'serialNumberFrom' must be a number.");
      if (isNaN(parsedSerialNumberTo)) errorsForGroup.push("'serialNumberTo' must be a number.");

      let company = logicalRecord.Company ? await prisma.company.findFirst({ where: { name: logicalRecord.Company } }) : null;
      if (logicalRecord.Company && !company) errorsForGroup.push(`Company '${logicalRecord.Company}' not found.`);

      let supplyTender = (company && logicalRecord.Discom) ? await prisma.supplyTender.findFirst({ where: { name: logicalRecord.Discom, companyId: company.id } }) : null;
      if (company && logicalRecord.Discom && !supplyTender) errorsForGroup.push(`Discom '${logicalRecord.Discom}' not found.`);

      let deliverySchedule = (supplyTender && logicalRecord.TNNumber) ? await prisma.deliverySchedule.findFirst({
        where: { tnNumber: String(logicalRecord.TNNumber), supplyTenderId: supplyTender.id }
      }) : null;
      if (supplyTender && logicalRecord.TNNumber && !deliverySchedule) errorsForGroup.push(`Delivery Schedule '${logicalRecord.TNNumber}' not found.`);

      if (errorsForGroup.length > 0) {
        invalidRecords.push({ key: recordKey, row: logicalRecord.__firstRowNum, errors: errorsForGroup });
        continue;
      }

      const inspectionOfficers = [];
      const consignees = [];
      const sealingDetails = [];
      const repairedTransformerSrnos = [];
      const officersSet = new Set();
      const consigneesMap = new Map();
      const sealingSet = new Set();
      const repairedSet = new Set();

      for (const row of group) {
        if (row.inspectionOfficer && !officersSet.has(row.inspectionOfficer)) {
          inspectionOfficers.push(String(row.inspectionOfficer));
          officersSet.add(String(row.inspectionOfficer));
        }

        if (row.ConsigneeName) {
          const cName = String(row.ConsigneeName);
          const cQty = parseInt(row.ConsigneeQuantity, 10) || 0;
          const cSerial = row.ConsigneeSerialNumber ? String(row.ConsigneeSerialNumber) : null;
          const cSubSn = row.ConsigneeSubSerialNumber ? String(row.ConsigneeSubSerialNumber) : null;

          if (!consigneesMap.has(cName)) {
            const consigneeDb = await prisma.consignee.findFirst({
              where: { name: cName, supplyTenderId: supplyTender.id }
            });
            if (consigneeDb) {
              consigneesMap.set(cName, {
                consigneeId: consigneeDb.id,
                consigneeName: cName,
                quantity: 0,
                newQuantity: 0,
                repairedQuantity: 0,
                subSnNumber: cSerial,
                repairedTransformerIds: []
              });
            } else {
              errorsForGroup.push(`Consignee '${cName}' not found.`);
            }
          }

          const cEntry = consigneesMap.get(cName);
          if (cEntry) {
            if (cQty > 0) {
              cEntry.quantity += cQty;
              cEntry.newQuantity += cQty;
            }
            if (cSubSn) {
              if (!cEntry.repairedTransformerIds.includes(cSubSn)) {
                cEntry.repairedTransformerIds.push(cSubSn);
                cEntry.quantity += 1;
                cEntry.repairedQuantity += 1;
                if (!repairedSet.has(cSubSn)) {
                  repairedTransformerSrnos.push(cSubSn);
                  repairedSet.add(cSubSn);
                }
              }
            }
          }
        }

        if (row.TrfsiNo && row.PolyCarbonateSealNo) {
          const sealKey = `${row.TrfsiNo}-${row.PolyCarbonateSealNo}`;
          if (!sealingSet.has(sealKey)) {
            sealingDetails.push({ trfSiNo: String(row.TrfsiNo), polySealNo: String(row.PolyCarbonateSealNo) });
            sealingSet.add(sealKey);
          }
        }
      }

      if (errorsForGroup.length > 0) {
        invalidRecords.push({ key: recordKey, row: logicalRecord.__firstRowNum, errors: errorsForGroup });
        continue;
      }

      const finalConsignees = Array.from(consigneesMap.values());

      // Generate repaired_transformer_mapping (matches UI logic)
      const repairedMapping = repairedTransformerSrnos.map((sn, index) => ({
        oldSrNo: sn,
        newSrNo: parsedSerialNumberTo + 1 + index,
      }));

      const record = {
        supplyTenderId: supplyTender.id,
        deliveryScheduleId: deliverySchedule.id,
        serialNumberFrom: parsedSerialNumberFrom,
        serialNumberTo: parsedSerialNumberTo,
        offerDate: parseDate(firstRow.offerDate),
        offeredQuantity: parsedOfferedQuantity || 0,
        inspectionDate: parseDate(firstRow.inspectionDate),
        inspectedQuantity: parsedInspectedQuantity || 0,
        inspectionOfficers,
        nominationLetterNo: firstRow.nominationLetterNo || null,
        nominationDate: parseDate(firstRow.nominationDate),
        diNo: firstRow.diNo || null,
        diDate: parseDate(firstRow.diDate),
        warranty: firstRow.warranty || `${deliverySchedule.guaranteePeriodMonths} Months`,
        status: firstRow.status || "Active",
        subSerialNumber: repairedTransformerSrnos.join(", "),
        consignees: finalConsignees,
        sealingDetails: sealingDetails,
        repaired_transformer_srno: repairedTransformerSrnos,
        repaired_transformer_mapping: repairedMapping,
        grandTotal: firstRow.grandTotal ? parseInt(firstRow.grandTotal, 10) : null,
      };
      parsedFinalInspections.push(record);
    }

    if (invalidRecords.length > 0) {
      return res.status(400).json({ error: "Bulk upload failed due to invalid data.", details: invalidRecords });
    }

    if (parsedFinalInspections.length === 0) {
      return res.status(400).json({ error: "No valid records to upload." });
    }

    // Use transaction to create records and update damaged transformers
    await prisma.$transaction(async (tx) => {
      for (const record of parsedFinalInspections) {
        await tx.finalInspection.create({ data: record });
        if (record.repaired_transformer_srno.length > 0) {
          // Find damaged transformers by serial number
          const damaged = await tx.damagedTransformer.findMany({
            where: {
              supplyTenderId: record.supplyTenderId,
              // Since serialNo is Json, we might need a more complex check or use snNumberRange if it matches
            }
          });
          
          // Filter in memory since serialNo is Json
          const toUpdate = damaged.filter(d => {
            const sns = Array.isArray(d.serialNo) ? d.serialNo : [d.serialNo];
            return sns.some(sn => record.repaired_transformer_srno.includes(String(sn)));
          }).map(d => d.id);

          if (toUpdate.length > 0) {
            await tx.damagedTransformer.updateMany({
              where: { id: { in: toUpdate } },
              data: { used: true }
            });
          }
        }
      }
    });

    await logActivity(req.user.userId, "CREATE", "FinalInspection", null, null, parsedFinalInspections);

    res.status(201).json({ message: "Bulk upload successful", count: parsedFinalInspections.length });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: "Something went wrong during bulk upload", details: error.message });
  }
});


/**
 * @swagger
 * /final-inspections:
 *   post:
 *     summary: Create a new final inspection
 *     tags: [Final Inspections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinalInspection'
 *     responses:
 *       201:
 *         description: The final inspection was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinalInspection'
 *       500:
 *         description: Something went wrong
 */
router.post("/", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const { repaired_transformer_srno, grandTotal, ...rest } = req.body;
    const subSerialNumber = repaired_transformer_srno?.join(", ") || null;

    const newFinalInspection = await prisma.$transaction(async (prisma) => {
      const createdInspection = await prisma.finalInspection.create({
        data: { ...rest, repaired_transformer_srno, subSerialNumber, grandTotal, supplyTenderId },
      });

      if (repaired_transformer_srno && repaired_transformer_srno.length > 0) {
        // Find damaged transformers by serial number
        const damaged = await prisma.damagedTransformer.findMany({
          where: {
            supplyTenderId: supplyTenderId,
          }
        });
        
        // Filter in memory since serialNo is Json
        const toUpdate = damaged.filter(d => {
          const sns = Array.isArray(d.serialNo) ? d.serialNo : [d.serialNo];
          return sns.some(sn => repaired_transformer_srno.includes(String(sn)));
        }).map(d => d.id);

        if (toUpdate.length > 0) {
          await prisma.damagedTransformer.updateMany({
            where: { id: { in: toUpdate } },
            data: { used: true }
          });
        }
      }

      return createdInspection;
    });

    await logActivity(
      req.user.userId,
      "CREATE",
      "FinalInspection",
      newFinalInspection.id,
      null,
      newFinalInspection,
    );

    res.status(201).json(newFinalInspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /final-inspections/{id}:
 *   put:
 *     summary: Update a final inspection
 *     tags: [Final Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The final inspection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinalInspection'
 *     responses:
 *       200:
 *         description: The final inspection was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinalInspection'
 *       404:
 *         description: The final inspection was not found
 *       500:
 *         description: Some error happened
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const { repaired_transformer_srno, grandTotal, ...rest } = req.body;

    const updatedFinalInspection = await prisma.$transaction(async (prisma) => {
      const existingFinalInspection = await prisma.finalInspection.findUnique({
        where: { id, supplyTenderId },
      });

      if (!existingFinalInspection) {
        throw new Error("Final Inspection not found");
      }

      const oldSrNos = existingFinalInspection.repaired_transformer_srno || [];
      const newSrNos = repaired_transformer_srno || [];

      const removedSrNos = oldSrNos.filter((srNo) => !newSrNos.includes(srNo));
      const addedSrNos = newSrNos.filter((srNo) => !oldSrNos.includes(srNo));

      if (removedSrNos.length > 0) {
        const damaged = await prisma.damagedTransformer.findMany({
          where: { supplyTenderId }
        });
        const toUnuse = damaged.filter(d => {
          const sns = Array.isArray(d.serialNo) ? d.serialNo : [d.serialNo];
          return sns.some(sn => removedSrNos.includes(String(sn)));
        }).map(d => d.id);

        if (toUnuse.length > 0) {
          await prisma.damagedTransformer.updateMany({
            where: { id: { in: toUnuse } },
            data: { used: false },
          });
        }
      }

      if (addedSrNos.length > 0) {
        const damaged = await prisma.damagedTransformer.findMany({
          where: { supplyTenderId }
        });
        const toUse = damaged.filter(d => {
          const sns = Array.isArray(d.serialNo) ? d.serialNo : [d.serialNo];
          return sns.some(sn => addedSrNos.includes(String(sn)));
        }).map(d => d.id);

        if (toUse.length > 0) {
          await prisma.damagedTransformer.updateMany({
            where: { id: { in: toUse } },
            data: { used: true },
          });
        }
      }

      const updatedInspection = await prisma.finalInspection.update({
        where: { id, supplyTenderId },
        data: { ...rest, repaired_transformer_srno, subSerialNumber, grandTotal, supplyTenderId },
      });

      await logActivity(
        req.user.userId,
        "UPDATE",
        "FinalInspection",
        updatedInspection.id,
        existingFinalInspection,
        updatedInspection,
      );

      return updatedInspection;
    });

    res.json(updatedFinalInspection);
  } catch (error) {
    if (error.message === "Final Inspection not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await prisma.finalInspection.delete({
      where: { id },
    });
    await logActivity(req.user.userId, "DELETE", "FinalInspection", id, deletedRecord, null);
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Final Inspection not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
