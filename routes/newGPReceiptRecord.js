const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");
const prisma = new PrismaClient();
const multer = require("multer");
const xlsx = require("xlsx");
const { logActivity } = require("../utils/activityLogger");
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: New GP Receipt Records
 *   description: New GP Receipt Record management
 */

/**
 * @swagger
 * /new-gp-receipt-records:
 *   get:
 *     summary: Retrieve a list of new GP receipt records with pagination
 *     tags: [New GP Receipt Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of items to return
 *     responses:
 *       200:
 *         description: A list of new GP receipt records.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NewGPReceiptRecord'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      all,
      supplyTenderId,
    } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    let where = { supplyTenderId: supplyTenderId };
    if (search) {
      where.OR = [
        { accountReceiptNoteNo: { contains: search, mode: "insensitive" } },
        { sinNo: { contains: search, mode: "insensitive" } },
        { consigneeName: { contains: search, mode: "insensitive" } },
        { discomReceiptNoteNo: { contains: search, mode: "insensitive" } },
        { trfsiNo: { contains: search, mode: "insensitive" } },
        {
          deliveryChallan: {
            challanNo: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const include = {
      deliveryChallan: {
        include: {
          finalInspection: {
            include: {
              deliverySchedule: true,
            },
          },
          consignee: true,
          materialDescription: true,
        },
      },
    };

    if (all === "true") {
      const allRecords = await prisma.newGPReceiptRecord.findMany({
        where,
        include,
        orderBy: {
          createdAt: "desc",
        },
      });
      return res.json(allRecords);
    }

    const totalItems = await prisma.newGPReceiptRecord.count({ where });
    const newGPReceiptRecords = await prisma.newGPReceiptRecord.findMany({
      where,
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      take: parseInt(limit, 10),
      include,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      items: newGPReceiptRecords,
      totalPages: Math.ceil(totalItems / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      totalItems,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /new-gp-receipt-records:
 *   post:
 *     summary: Create a new new GP receipt record
 *     tags: [New GP Receipt Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewGPReceiptRecord'
 *     responses:
 *       201:
 *         description: The new GP receipt record was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewGPReceiptRecord'
 *       500:
 *         description: Something went wrong
 */
router.post("/", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const newGPReceiptRecord = await prisma.newGPReceiptRecord.create({
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "NewGPReceiptRecord",
      newGPReceiptRecord.id,
      null,
      newGPReceiptRecord,
    );
    res.status(201).json(newGPReceiptRecord);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const existingRecord = await prisma.newGPReceiptRecord.findUnique({
      where: { id, supplyTenderId },
    });

    if (!existingRecord) {
      return res.status(404).json({
        error:
          "New GP Receipt Record not found or does not belong to the specified supplyTenderId.",
      });
    }

    const updatedRecord = await prisma.newGPReceiptRecord.update({
      where: { id, supplyTenderId },
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "UPDATE",
      "NewGPReceiptRecord",
      updatedRecord.id,
      existingRecord,
      updatedRecord,
    );
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/bulk-upload", auth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const { supplyTenderId } = req.query;
  if (!supplyTenderId) {
    return res.status(400).json({
      error: "supplyTenderId is required as a query parameter for bulk upload",
    });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const createdRecords = [];
    for (const item of data) {
      // Basic validation
      if (!item.deliveryChallanId || !item.accountReceiptNoteNo) {
        console.warn("Skipping row due to missing required fields:", item);
        continue;
      }

      const record = {
        ...item,
        accountReceiptNoteDate: new Date(item.accountReceiptNoteDate),
        discomReceiptNoteDate: new Date(item.discomReceiptNoteDate),
        supplyTenderId: supplyTenderId, // Add supplyTenderId to each item
      };

      const createdRecord = await prisma.newGPReceiptRecord.create({
        data: record,
      });
      createdRecords.push(createdRecord);
      await logActivity(
        req.user.userId,
        "CREATE",
        "NewGPReceiptRecord",
        createdRecord.id,
        null,
        createdRecord,
      );
    }

    res.status(201).json({
      message: "Bulk upload successful",
      createdRecords,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
