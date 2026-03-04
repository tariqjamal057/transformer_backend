const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");
const multer = require("multer");
const xlsx = require("xlsx");
const { logActivity } = require("../utils/activityLogger");
const prisma = new PrismaClient();

const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Delivery Details
 *   description: Delivery detail management
 */

/**
 * @swagger
 * /delivery-details:
 *   get:
 *     summary: Retrieve a list of delivery details with pagination
 *     tags: [Delivery Details]
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
 *         description: A list of delivery details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryDetail'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    let where = { supplyTenderId: supplyTenderId };
    if (search) {
      where.OR = [
        {
          receiptedChallanNo: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          deliveryChallan: {
            challanNo: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          deliveryChallan: {
            finalInspection: {
              diNo: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const deliveryDetails = await prisma.deliveryDetail.findMany({
      where,
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      take: parseInt(limit, 10),
      include: {
        deliveryChallan: {
          include: {
            finalInspection: {
              include: {
                deliverySchedule: true,
              },
            },
            consignee: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalDeliveryDetails = await prisma.deliveryDetail.count({ where });

    res.json({
      items: deliveryDetails,
      totalPages: Math.ceil(totalDeliveryDetails / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * @swagger
 * /delivery-details:
 *   post:
 *     summary: Create a new delivery detail
 *     tags: [Delivery Details]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryDetail'
 *     responses:
 *       201:
 *         description: The delivery detail was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryDetail'
 *       500:
 *         description: Something went wrong
 */
router.post("/", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const newDeliveryDetail = await prisma.deliveryDetail.create({
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "DeliveryDetail",
      newDeliveryDetail.id,
      null,
      newDeliveryDetail,
    );
    res.status(201).json(newDeliveryDetail);
  } catch (error) {
    console.log(error);
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

    // Fetch existing delivery challan IDs for validation, filtered by supplyTenderId
    const existingDeliveryChallanIds = (
      await prisma.deliveryChallan.findMany({
        where: { supplyTenderId: supplyTenderId },
        select: { id: true },
      })
    ).map((dc) => dc.id);

    const parsedData = [];
    const invalidRecords = [];

    for (const item of data) {
      const record = {
        deliveryChalanId: item.deliveryChalanId,
        receiptedChallanNo: item.receiptedChallanNo,
        receiptedChallanDate: new Date(item.receiptedChallanDate),
        supplyTenderId: supplyTenderId, // Add supplyTenderId to each item
      };

      // Basic validation
      if (
        !record.deliveryChalanId ||
        !existingDeliveryChallanIds.includes(record.deliveryChalanId)
      ) {
        invalidRecords.push({
          item,
          error:
            "Invalid or missing deliveryChalanId or it does not belong to the specified supplyTenderId",
        });
        continue;
      }
      if (!record.receiptedChallanNo || !record.receiptedChallanDate) {
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

    const createdDetails = await prisma.deliveryDetail.createMany({
      data: parsedData,
      skipDuplicates: true,
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "DeliveryDetail",
      null,
      null,
      parsedData,
    );

    res.status(201).json({ message: "Bulk upload successful", createdDetails });
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
 * /delivery-details/{id}:
 *   put:
 *     summary: Update a delivery detail
 *     tags: [Delivery Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery detail ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryDetail'
 *     responses:
 *       200:
 *         description: The delivery detail was successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryDetail'
 *       404:
 *         description: The delivery detail was not found
 *       500:
 *         description: Something went wrong
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const existingDeliveryDetail = await prisma.deliveryDetail.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (!existingDeliveryDetail) {
      return res.status(404).json({
        error:
          "Delivery detail not found or does not belong to the specified supplyTenderId",
      });
    }

    const updatedDeliveryDetail = await prisma.deliveryDetail.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await logActivity(
      req.user.userId,
      "UPDATE",
      "DeliveryDetail",
      req.params.id,
      existingDeliveryDetail,
      updatedDeliveryDetail,
    );

    res.json(updatedDeliveryDetail);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * @swagger
 * /delivery-details/{id}:
 *   delete:
 *     summary: Delete a delivery detail
 *     tags: [Delivery Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery detail ID
 *     responses:
 *       204:
 *         description: The delivery detail was deleted
 *       404:
 *         description: The delivery detail was not found
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const existingDeliveryDetail = await prisma.deliveryDetail.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (!existingDeliveryDetail) {
      return res.status(404).json({
        error:
          "Delivery detail not found or does not belong to the specified supplyTenderId",
      });
    }

    await prisma.deliveryDetail.delete({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "DELETE",
      "DeliveryDetail",
      req.params.id,
      existingDeliveryDetail,
      null,
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
