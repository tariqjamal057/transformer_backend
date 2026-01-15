const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { logActivity } = require("../utils/activityLogger");
const multer = require("multer");
const xlsx = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: GP Failures
 *   description: GP Failure management
 */

/**
 * @swagger
 * /gp-failures:
 *   get:
 *     summary: Retrieve a list of all GP failures
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of GP failures.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GPFailure'
 */
router.get("/", async (req, res) => {
  try {
    const { page = 1, search = "", all, includeRelations } = req.query;
    const pageSize = 10;

    let where = {};
    if (search) {
      where = {
        OR: [
          { trfsiNo: { contains: search, mode: "insensitive" } },
          { rating: { contains: search, mode: "insensitive" } },
          {
            deliveryChallan: {
              challanNo: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      };
    }

    const include = {
      deliveryChallan:
        includeRelations === "true"
          ? {
              include: {
                finalInspection: {
                  include: {
                    deliverySchedule: true,
                  },
                },
                consignee: true,
                materialDescription: true,
              },
            }
          : true,
    };

    if (all === "true") {
      const allRecords = await prisma.gPFailure.findMany({
        where,
        include,
        orderBy: {
          createdAt: "desc",
        },
      });
      return res.json(allRecords);
    }

    const totalItems = await prisma.gPFailure.count({ where });
    const gpFailures = await prisma.gPFailure.findMany({
      where,
      skip: (parseInt(page, 10) - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
      include,
    });

    res.json({
      items: gpFailures,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: parseInt(page, 10),
      totalItems,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-failures/{id}:
 *   get:
 *     summary: Get a GP failure by ID
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The GP failure ID
 *     responses:
 *       200:
 *         description: The GP failure description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPFailure'
 *       404:
 *         description: The GP failure was not found
 */
router.get("/:id", async (req, res) => {
  try {
    const gpFailure = await prisma.gPFailure.findUnique({
      where: { id: req.params.id },
      include: {
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
      },
    });
    if (!gpFailure)
      return res.status(404).json({ error: "GP failure not found" });
    res.json(gpFailure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-failures:
 *   post:
 *     summary: Create a new GP failure
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GPFailure'
 *     responses:
 *       201:
 *         description: The GP failure was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPFailure'
 *       400:
 *         description: Bad request
 */
router.post("/", async (req, res) => {
  try {
    const gpFailure = await prisma.gPFailure.create({
      data: req.body,
    });
    await logActivity(
      req.user.userId,
      req.user.name,
      "CREATE",
      "GPFailure",
      gpFailure.id,
      null,
      gpFailure
    );
    res.status(201).json(gpFailure);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

    // Fetch existing delivery challan IDs for validation
    const existingDeliveryChallanIds = (
      await prisma.deliveryChallan.findMany({ select: { id: true } })
    ).map((dc) => dc.id);

    const parsedData = [];
    const invalidRecords = [];

    for (const item of data) {
      const record = {
        deliveryChallanId: item.deliveryChallanId,
        trfsiNo: String(item.trfsiNo),
        rating: String(item.rating),
        subDivision: item.subDivision,
        failureDetails: JSON.parse(item.failureDetails), // Assuming failureDetails is a JSON string in the excel
        guaranteeExpiry: new Date(item.guaranteeExpiry),
        guaranteeStatus: item.guaranteeStatus,
      };

      // Basic validation
      if (
        !record.deliveryChallanId ||
        !existingDeliveryChallanIds.includes(record.deliveryChallanId)
      ) {
        invalidRecords.push({
          item,
          error: "Invalid or missing deliveryChallanId",
        });
        continue;
      }
      if (
        !record.trfsiNo ||
        !record.rating ||
        !record.subDivision ||
        !record.failureDetails ||
        !record.guaranteeExpiry ||
        !record.guaranteeStatus
      ) {
        invalidRecords.push({ item, error: "Missing required fields" });
        continue;
      }

      parsedData.push(record);
    }

    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error: "Bulk upload failed due to invalid data.",
        details: invalidRecords,
      });
    }

    if (parsedData.length === 0) {
      return res.status(400).json({ error: "No valid records to upload." });
    }

    const createdFailures = await prisma.gPFailure.createMany({
      data: parsedData,
      skipDuplicates: true,
    });

    res
      .status(201)
      .json({ message: "Bulk upload successful", createdFailures });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res
      .status(500)
      .json({
        error: "Something went wrong during bulk upload",
        details: error.message,
      });
  }
});

/**
 * @swagger
 * /gp-failures/{id}:
 *   put:
 *     summary: Update a GP failure
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The GP failure ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GPFailure'
 *     responses:
 *       200:
 *         description: The GP failure was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPFailure'
 *       404:
 *         description: The GP failure was not found
 *       500:
 *         description: Some error happened
 */
router.put("/:id", async (req, res) => {
  try {
    const existingGpFailure = await prisma.gPFailure.findUnique({
      where: { id: req.params.id },
    });

    if (!existingGpFailure) {
      return res.status(404).json({ error: "GP failure not found" });
    }

    const updatedGpFailure = await prisma.gPFailure.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(
      req.user.userId,
      req.user.name,
      "UPDATE",
      "GPFailure",
      updatedGpFailure.id,
      existingGpFailure,
      updatedGpFailure
    );
    res.json(updatedGpFailure);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-failures/{id}:
 *   delete:
 *     summary: Delete a GP failure
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The GP failure ID
 *     responses:
 *       204:
 *         description: The GP failure was deleted
 *       404:
 *         description: The GP failure was not found
 */
router.delete("/:id", async (req, res) => {
  try {
    const existingGpFailure = await prisma.gPFailure.findUnique({
      where: { id: req.params.id },
    });

    if (!existingGpFailure) {
      return res.status(404).json({ error: "GP failure not found" });
    }

    await prisma.gPFailure.delete({
      where: { id: req.params.id },
    });
    await logActivity(
      req.user.userId,
      req.user.name,
      "DELETE",
      "GPFailure",
      req.params.id,
      existingGpFailure,
      null
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
