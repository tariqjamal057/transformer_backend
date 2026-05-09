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
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({
        error: "supplyTenderId is required as a query parameter for bulk upload",
      });
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
      return !isNaN(parsedDate.getTime()) ? parsedDate : null;
    };

    const createdRecords = [];
    const invalidRecords = [];

    for (const item of data) {
      const challanNo = String(item["Challan No"] || "");
      if (!challanNo) {
        invalidRecords.push({ item, error: "Challan No is required." });
        continue;
      }

      const challan = await prisma.deliveryChallan.findFirst({
        where: { challanNo, supplyTenderId },
      });

      if (!challan) {
        invalidRecords.push({ item, error: `Challan '${challanNo}' not found.` });
        continue;
      }

      const record = {
        deliveryChallanId: challan.id,
        accountReceiptNoteNo: String(item["Account Receipt Note No"] || ""),
        accountReceiptNoteDate: parseDate(item["Account Receipt Note Date"]),
        sinNo: String(item["SIN No"] || ""),
        consigneeName: String(item["Consignee Name"] || ""),
        discomReceiptNoteNo: String(item["Discom Receipt Note No"] || ""),
        discomReceiptNoteDate: parseDate(item["Discom Receipt Note Date"]),
        recChallanItemNo: String(item["Rec. Challan Item No"] || ""),
        recChallanItemDate: parseDate(item["Rec. Challan Item Date"]),
        remarks: String(item["Remarks"] || ""),
        trfsiNo: String(item["TRFSI No"] || ""),
        rating: String(item["Rating"] || ""),
        sealNoTimeOfGPReceived: String(item["Seal No Time Of GP Received"] || ""),
        consigneeTFRSerialNo: String(item["Consignee TFR Serial No"] || ""),
        originalTfrSrNo: String(item["Original Tfr Sr No"] || ""),
        oilLevel: String(item["Oil Level"] || ""),
        hvBushing: String(item["HV Bushing"] || ""),
        lvBushing: String(item["LV Bushing"] || ""),
        htMetalParts: String(item["HT Metal Parts"] || ""),
        ltMetalParts: String(item["LT Metal Parts"] || ""),
        mAndpBox: String(item["M and P Box"] || ""),
        mAndpBoxCover: String(item["M and P Box Cover"] || ""),
        mccb: String(item["MCCB"] || ""),
        icb: String(item["ICB"] || ""),
        copperFlexibleCable: String(item["Copper Flexible Cable"] || ""),
        alWire: String(item["AL Wire"] || ""),
        conservator: String(item["Conservator"] || ""),
        radiator: String(item["Radiator"] || ""),
        fuse: String(item["Fuse"] || ""),
        channel: String(item["Channel"] || ""),
        core: String(item["Core"] || ""),
        polySealNo: String(item["Poly Seal No"] || ""),
        deliveredToAcos: String(item["Delivered to ACOS"] || ""),
        supplyTenderId: supplyTenderId,
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

    if (invalidRecords.length > 0 && createdRecords.length === 0) {
      return res.status(400).json({ error: "Bulk upload failed.", details: invalidRecords });
    }

    res.status(201).json({
      message: "Bulk upload successful",
      count: createdRecords.length,
      invalidCount: invalidRecords.length,
      details: invalidRecords,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
