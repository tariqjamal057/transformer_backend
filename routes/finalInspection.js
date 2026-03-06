const express = require("express");
const router = express.Router();
const { PrismaClient, Prisma } = require("@prisma/client");
const { paginate } = require("../utils/pagination");
const { logActivity } = require("../utils/activityLogger");
const auth = require("../middleware/auth");
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
    const { supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const result = await prisma.finalInspection.aggregate({
      _sum: {
        inspectedQuantity: true,
      },
      where: {
        supplyTenderId: supplyTenderId,
      },
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
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: "The uploaded file is empty." });
    }

    const dataWithRows = data.map((row, index) => ({
      ...row,
      __rowNum: index + 2, // Excel rows are 1-based, plus 1 for the header
    }));

    const logicalRecords = [];
    let currentLogicalRecord = null;
    const allInvalidRecords = []; // Collect all errors encountered during initial grouping

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
        // This row is a continuation
        if (currentLogicalRecord) {
          currentLogicalRecord.allRows.push(row);
        } else {
          // Error: Continuation row found without a preceding main row
          allInvalidRecords.push({
            key: `Row ${row.__rowNum}`,
            row: row.__rowNum,
            errors: ["Continuation row found without main record identifiers."],
          });
          // Continue to next row, effectively skipping this rogue continuation
        }
      }
    }

    if (currentLogicalRecord) {
      logicalRecords.push(currentLogicalRecord); // Push the last record after the loop
    }

    if (allInvalidRecords.length > 0) {
      // Return early if there were issues in grouping
      return res.status(400).json({
        error: "Bulk upload failed due to invalid file structure.",
        details: allInvalidRecords,
      });
    }

    const parsedFinalInspections = [];
    const invalidRecords = []; // For validation errors per logical record

    for (const logicalRecord of logicalRecords) {
      const firstRow = logicalRecord.allRows[0]; // The first Excel row of this logical record
      const group = logicalRecord.allRows; // All Excel rows for this logical record
      const errorsForGroup = [];
      const recordKey = `${logicalRecord.Company}-${logicalRecord.Discom}-${logicalRecord.TNNumber}-${logicalRecord.serialNumberFrom}-${logicalRecord.serialNumberTo}`;

      // --- Validation Phase ---
      if (!logicalRecord.Company)
        errorsForGroup.push("'Company' is a required field.");
      if (!logicalRecord.Discom)
        errorsForGroup.push(
          "'Discom' (Supply Tender Name) is a required field.",
        );
      if (!logicalRecord.TNNumber)
        errorsForGroup.push("'TNNumber' is a required field.");
      if (!logicalRecord.serialNumberFrom)
        errorsForGroup.push("'serialNumberFrom' is a required field.");
      if (!logicalRecord.serialNumberTo)
        errorsForGroup.push("'serialNumberTo' is a required field.");
      if (!firstRow.offeredQuantity)
        errorsForGroup.push("'offeredQuantity' is a required field.");
      if (!firstRow.inspectedQuantity)
        errorsForGroup.push("'inspectedQuantity' is a required field.");

      const parsedSerialNumberFrom = parseInt(
        logicalRecord.serialNumberFrom,
        10,
      );
      const parsedSerialNumberTo = parseInt(logicalRecord.serialNumberTo, 10);
      const parsedOfferedQuantity = parseInt(firstRow.offeredQuantity, 10);
      const parsedInspectedQuantity = parseInt(firstRow.inspectedQuantity, 10);

      if (isNaN(parsedSerialNumberFrom))
        errorsForGroup.push("'serialNumberFrom' must be a valid number.");
      if (isNaN(parsedSerialNumberTo))
        errorsForGroup.push("'serialNumberTo' must be a valid number.");
      if (isNaN(parsedOfferedQuantity))
        errorsForGroup.push("'offeredQuantity' must be a valid number.");
      if (isNaN(parsedInspectedQuantity))
        errorsForGroup.push("'inspectedQuantity' must be a valid number.");

      let company;
      if (logicalRecord.Company) {
        company = await prisma.company.findFirst({
          where: { name: logicalRecord.Company },
        });
        if (!company)
          errorsForGroup.push(`Company '${logicalRecord.Company}' not found.`);
      }

      let supplyTender;
      if (company && logicalRecord.Discom) {
        supplyTender = await prisma.supplyTender.findFirst({
          where: { name: logicalRecord.Discom, companyId: company.id },
        });
        if (!supplyTender) {
          errorsForGroup.push(
            `Discom '${logicalRecord.Discom}' not found for Company '${logicalRecord.Company}'.`,
          );
        }
      }

      let deliverySchedule;
      if (supplyTender && logicalRecord.TNNumber) {
        deliverySchedule = await prisma.deliverySchedule.findFirst({
          where: {
            tnNumber: String(logicalRecord.TNNumber),
            supplyTenderId: supplyTender.id,
          },
        });
        if (!deliverySchedule) {
          errorsForGroup.push(
            `Delivery Schedule with TNNumber '${logicalRecord.TNNumber}' not found for Discom '${logicalRecord.Discom}'.`,
          );
        }
      }

      // --- Collect all errors for the group before proceeding ---
      if (errorsForGroup.length > 0) {
        invalidRecords.push({
          key: recordKey,
          row: logicalRecord.__firstRowNum,
          errors: errorsForGroup,
        });
        continue; // Skip to the next logical record
      }

      // --- Aggregate List Data ---
      const inspectionOfficers = [];
      const consignees = [];
      const sealingDetails = [];
      const officersSet = new Set();
      const consigneesSet = new Set();
      const sealingSet = new Set();

      for (const row of group) {
        if (row.inspectionOfficer && !officersSet.has(row.inspectionOfficer)) {
          inspectionOfficers.push(String(row.inspectionOfficer));
          officersSet.add(String(row.inspectionOfficer));
        }

        if (
          row.ConsigneeName &&
          row.ConsigneeQuantity &&
          row.ConsigneeSubSerialNumber
        ) {
          const consigneeKey = `${row.ConsigneeName}-${row.ConsigneeQuantity}-${row.ConsigneeSubSerialNumber}`;
          if (!consigneesSet.has(consigneeKey)) {
            const consigneeDb = await prisma.consignee.findFirst({
              where: {
                name: String(row.ConsigneeName),
                supplyTenderId: supplyTender.id,
              },
            });
            if (consigneeDb) {
              consignees.push({
                consigneeId: consigneeDb.id,
                quantity: parseInt(row.ConsigneeQuantity, 10),
                subSnNumber: String(row.ConsigneeSubSerialNumber),
                consigneeName: String(row.ConsigneeName),
              });
              consigneesSet.add(consigneeKey);
            } else {
              errorsForGroup.push(
                `Consignee '${row.ConsigneeName}' not found for this Discom. (Excel Row: ${row.__rowNum})`,
              );
            }
          }
        } else if (
          row.ConsigneeName ||
          row.ConsigneeQuantity ||
          row.ConsigneeSubSerialNumber
        ) {
          errorsForGroup.push(
            `Incomplete consignee details. All of 'Consignee Name', 'Consignee Quantity', 'Consignee Sub Serial Number' are required together. (Excel Row: ${row.__rowNum})`,
          );
        }

        if (row.TRFSINo && row.PolySealNo) {
          const sealKey = `${row.TRFSINo}-${row.PolySealNo}`;
          if (!sealingSet.has(sealKey)) {
            sealingDetails.push({
              trfSiNo: String(row.TRFSINo),
              polySealNo: String(row.PolySealNo),
            });
            sealingSet.add(sealKey);
          }
        } else if (row.TRFSINo || row.PolySealNo) {
          errorsForGroup.push(
            `Incomplete sealing details. Both 'TRF SI No' and 'Poly Seal No' are required together. (Excel Row: ${row.__rowNum})`,
          );
        }
      }

      // Re-check for errors after list aggregations
      if (errorsForGroup.length > 0) {
        invalidRecords.push({
          key: recordKey,
          row: logicalRecord.__firstRowNum,
          errors: errorsForGroup,
        });
        continue;
      }

      // --- Construct the main record ---
      const record = {
        supplyTenderId: supplyTender.id,
        deliveryScheduleId: deliverySchedule.id,
        serialNumberFrom: parsedSerialNumberFrom,
        serialNumberTo: parsedSerialNumberTo,
        offerDate: firstRow.offerDate ? new Date(firstRow.offerDate) : null,
        offeredQuantity: parsedOfferedQuantity,
        inspectionDate: firstRow.inspectionDate
          ? new Date(firstRow.inspectionDate)
          : null,
        inspectedQuantity: parsedInspectedQuantity,
        inspectionOfficers: inspectionOfficers,
        nominationLetterNo: firstRow.nominationLetterNo || null,
        nominationDate: firstRow.nominationDate
          ? new Date(firstRow.nominationDate)
          : null,
        diNo: firstRow.diNo || null,
        diDate: firstRow.diDate ? new Date(firstRow.diDate) : null,
        warranty: firstRow.warranty || null,
        status: firstRow.status || "Active",
        consignees: consignees,
        sealingDetails: sealingDetails,
      };
      parsedFinalInspections.push(record);
    }
    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error: "Bulk upload failed due to invalid data.",
        details: invalidRecords,
      });
    }

    if (parsedFinalInspections.length === 0) {
      return res.status(400).json({ error: "No valid records to upload." });
    }

    const createdInspections = await prisma.finalInspection.createMany({
      data: parsedFinalInspections,
      skipDuplicates: true,
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "FinalInspection",
      null,
      null,
      createdInspections,
    );

    res
      .status(201)
      .json({ message: "Bulk upload successful", createdInspections });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      error: "Something went wrong during bulk upload",
      details: error.message,
    });
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

    const newFinalInspection = await prisma.$transaction(async (prisma) => {
      const createdInspection = await prisma.finalInspection.create({
        data: { ...rest, repaired_transformer_srno, grandTotal, supplyTenderId },
      });

      if (repaired_transformer_srno && repaired_transformer_srno.length > 0) {
        await prisma.damagedTransformer.updateMany({
          where: {
            id: {
              in: repaired_transformer_srno,
            },
          },
          data: {
            used: true,
          },
        });
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
        await prisma.damagedTransformer.updateMany({
          where: {
            id: {
              in: removedSrNos,
            },
          },
          data: {
            used: false,
          },
        });
      }

      if (addedSrNos.length > 0) {
        await prisma.damagedTransformer.updateMany({
          where: {
            id: {
              in: addedSrNos,
            },
          },
          data: {
            used: true,
          },
        });
      }

      const updatedInspection = await prisma.finalInspection.update({
        where: { id, supplyTenderId },
        data: { ...rest, repaired_transformer_srno, grandTotal, supplyTenderId },
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

module.exports = router;
