const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { paginate } = require("../utils/pagination");
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

router.get("/nomination-pending", async (req, res) => {
  try {
    const nominationPendingInspections = await prisma.finalInspection.findMany({
      // where: {
      //   nominationLetterNo: null,
      // },
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
router.get("/", async (req, res) => {
  try {
    const { all, page = 1, search = "" } = req.query;

    if (all === "true") {
      const finalInspections = await prisma.finalInspection.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          deliverySchedule: true,
          transformers: {
            include: {
              transformer: true,
            },
          },
        },
      });
      return res.json(finalInspections);
    }
    const pageSize = 10;

    let where = {};
    if (search) {
      const searchNumber = !isNaN(parseInt(search)) ? parseInt(search) : -1; // Use -1 or another value that won't exist
      where = {
        OR: [
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
        ],
      };
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

router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

    // Fetch all existing delivery schedule IDs for validation
    const existingDeliveryScheduleIds = (
      await prisma.deliverySchedule.findMany({ select: { id: true } })
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
        offerDate: new Date(item.offerDate),
        inspectionDate: new Date(item.inspectionDate),
        diDate: new Date(item.diDate),
        nominationDate: item.nominationDate
          ? new Date(item.nominationDate)
          : undefined, // Optional field

        // Other fields
        deliveryScheduleId: item.deliveryScheduleId,
        nominationLetterNo: item.nominationLetterNo, // Optional field
        diNo: item.diNo,
        warranty: item.warranty,

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
          error: "Invalid deliveryScheduleId",
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
router.post("/", async (req, res) => {
  try {
    const newFinalInspection = await prisma.finalInspection.create({
      data: req.body,
    });
    res.status(201).json(newFinalInspection);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
