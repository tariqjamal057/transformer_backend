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
        consignees: {
          equals: [],
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
        deliveryChallans: true,
      },
      orderBy: {
        createdAt: "desc",
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
        consignees: {
          not: [],
        },
        inspectionDate: {
          equals: Prisma.DbNull
        },
        inspectionDate: null,
        inspectionOfficers: {
          equals: []
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
      },
      orderBy: {
        createdAt: "desc",
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
        orderBy: { createdAt: "desc" },
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
        createdAt: "desc",
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

router.post("/bulk-upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({
        error:
          "supplyTenderId is required as a query parameter for bulk upload",
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

    // Fetch all existing delivery schedule IDs for validation
    const existingDeliveryScheduleIds = (
      await prisma.deliverySchedule.findMany({
        where: { supplyTenderId: supplyTenderId },
        select: { id: true },
      })
    ).map((ds) => ds.id);

    const parsedData = [];
    const invalidRecords = [];

    data.forEach((item, index) => {
      // Helper to safely parse JSON fields
      const parseJsonField = (field) => {
        try {
          return field ? JSON.parse(field) : [];
        } catch (e) {
          console.error(
            `Failed to parse JSON for row ${index + 2}, field: ${field}`,
            e,
          );
          return null; // Indicate parsing error
        }
      };

      const record = {
        // Ensure integer fields are parsed correctly
        serialNumberFrom: parseInt(item.serialNumberFrom, 10),
        serialNumberTo: parseInt(item.serialNumberTo, 10),
        offeredQuantity: parseInt(item.offeredQuantity, 10),
        inspectedQuantity: parseInt(item.inspectedQuantity, 10),

        // Ensure date fields are correctly formatted
        offerDate: item.offerDate ? new Date(item.offerDate) : undefined,
        inspectionDate: item.inspectionDate
          ? new Date(item.inspectionDate)
          : undefined,
        diDate: item.diDate ? new Date(item.diDate) : undefined,
        nominationDate: item.nominationDate
          ? new Date(item.nominationDate)
          : undefined, // Optional field

        // Other fields
        deliveryScheduleId: item.deliveryScheduleId,
        nominationLetterNo: item.nominationLetterNo, // Optional field
        diNo: item.diNo,
        warranty: item.warranty,
        supplyTenderId: supplyTenderId, // Add supplyTenderId to each item

        // Safely parse JSON fields
        inspectionOfficers: parseJsonField(item.inspectionOfficers),
        consignees: parseJsonField(item.consignees),
        sealingDetails: parseJsonField(item.sealingDetails),
      };

      // Validate deliveryScheduleId
      if (!existingDeliveryScheduleIds.includes(record.deliveryScheduleId)) {
        invalidRecords.push({
          row: index + 2,
          deliveryScheduleId: record.deliveryScheduleId,
          error:
            "Invalid deliveryScheduleId or it does not belong to the provided supplyTenderId",
        });
      } else if (
        isNaN(record.serialNumberFrom) ||
        isNaN(record.serialNumberTo) ||
        isNaN(record.offeredQuantity) ||
        isNaN(record.inspectedQuantity)
      ) {
        invalidRecords.push({
          row: index + 2,
          error: "Invalid number format for serial numbers or quantities",
        });
      } else if (
        record.inspectionOfficers === null ||
        record.consignees === null ||
        record.sealingDetails === null
      ) {
        invalidRecords.push({
          row: index + 2,
          error:
            "Invalid JSON format for inspectionOfficers, consignees, or sealingDetails",
        });
      } else {
        parsedData.push(record);
      }
    });

    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error: "Bulk upload failed due to invalid data.",
        details: invalidRecords,
      });
    }

    if (parsedData.length === 0) {
      return res.status(400).json({ error: "No valid records to upload." });
    }

    const createdInspections = await prisma.finalInspection.createMany({
      data: parsedData,
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
    console.error("Bulk upload error:", error); // Log the full error
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
    const newFinalInspection = await prisma.finalInspection.create({
      data: { ...req.body, supplyTenderId },
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

    const existingFinalInspection = await prisma.finalInspection.findUnique({
      where: { id, supplyTenderId },
    });

    if (!existingFinalInspection) {
      return res
        .status(404)
        .json({
          error:
            "Final Inspection not found or does not belong to the specified supplyTenderId",
        });
    }

    const updatedFinalInspection = await prisma.finalInspection.update({
      where: { id, supplyTenderId },
      data: { ...req.body, supplyTenderId }, // Ensure supplyTenderId is not accidentally changed
    });

    await logActivity(
      req.user.userId,
      "UPDATE",
      "FinalInspection",
      updatedFinalInspection.id,
      existingFinalInspection,
      updatedFinalInspection,
    );

    res.json(updatedFinalInspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
