const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { logActivity } = require("../utils/activityLogger");
const { auth, isOwner } = require("../middleware/auth");
const multer = require("multer");
const xlsx = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const prisma = new PrismaClient();

const parseRange = (text) => {
  if (!text) return [];
  const parts = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const results = [];
  parts.forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) results.push(String(i));
      }
    } else if (part.toUpperCase().includes(" TO ")) {
      const [start, end] = part
        .toUpperCase()
        .split(" TO ")
        .map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) results.push(String(i));
      }
    } else {
      results.push(part);
    }
  });
  return results;
};

const updateConsigneeDispatchCounts = async (finalInspectionId) => {
  if (!finalInspectionId) return;

  const finalInspection = await prisma.finalInspection.findUnique({
    where: { id: finalInspectionId },
    include: { deliveryChallans: true },
  });

  if (!finalInspection || !finalInspection.consignees) return;

  const consignees = Array.isArray(finalInspection.consignees)
    ? JSON.parse(JSON.stringify(finalInspection.consignees))
    : [];

  // Reset counts and pre-parse valid serials for each consignee
  consignees.forEach((c) => {
    c.dispatch = 0;
    c.pending = c.quantity || 0;
    c._validSerials = new Set([
      ...parseRange(c.subSnNumber),
      ...(c.repairedTransformerIds || []).map(String)
    ]);
  });

  const challans = finalInspection.deliveryChallans;

  challans.forEach((dc) => {
    const dcSerials = new Set();

    // 1. New Transformers
    if (dc.selectedTransformers && Array.isArray(dc.selectedTransformers) && dc.selectedTransformers.length > 0) {
      dc.selectedTransformers.forEach((s) => dcSerials.add(String(s)));
    } else if (dc.subSerialNumberFrom && dc.subSerialNumberTo) {
      const start = parseInt(dc.subSerialNumberFrom, 10);
      const end = parseInt(dc.subSerialNumberTo, 10);
      for (let i = start; i <= end; i++) dcSerials.add(String(i));
    }

    // 2. Repaired Transformers
    if (dc.repairedSerialNumbers && Array.isArray(dc.repairedSerialNumbers)) {
      dc.repairedSerialNumbers.forEach((s) => dcSerials.add(String(s)));
    }

    // 3. Other Consignee Serial Numbers
    if (dc.otherConsigneeSerialNumbers) {
      parseRange(dc.otherConsigneeSerialNumbers).forEach((s) =>
        dcSerials.add(s),
      );
    }

    // Assign serials to correct consignee buckets
    dcSerials.forEach((serial) => {
      const consignee = consignees.find((c) => c._validSerials.has(String(serial)));

      if (consignee) {
        consignee.dispatch = (consignee.dispatch || 0) + 1;
        consignee.pending = (consignee.quantity || 0) - consignee.dispatch;
      }
    });
  });

  // Remove the temporary _validSerials set before saving
  consignees.forEach(c => delete c._validSerials);

  await prisma.finalInspection.update({
    where: { id: finalInspectionId },
    data: { consignees: consignees },
  });
};

/**
 * @swagger
 * tags:
 *   name: Delivery Challans
 *   description: Delivery Challan management
 */

/**
 * @swagger
 * /delivery-challans:
 *   get:
 *     summary: Retrieve a list of all delivery challans
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of delivery challans.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryChallan'
 */
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, search = "", all, supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    if (all === "true") {
      const deliveryChallans = await prisma.deliveryChallan.findMany({
        where: { supplyTenderId: supplyTenderId },
        include: {
          supplyTender: {
            include: {
              company: true,
            },
          },
          finalInspection: {
            include: {
              deliverySchedule: true,
            },
          },
          consignee: true,
          gpFailures: true,
          materialDescription: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return res.json(deliveryChallans);
    }
    const pageSize = 10; // You can make this configurable

    let where = { supplyTenderId: supplyTenderId };
    if (search) {
      where.OR = [
        {
          challanNo: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          consignorName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          consignee: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          materialDescription: {
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const totalItems = await prisma.deliveryChallan.count({ where });
    const deliveryChallans = await prisma.deliveryChallan.findMany({
      where,
      include: {
        supplyTender: {
          include: {
            company: true,
          },
        },
        finalInspection: {
          include: {
            deliverySchedule: true,
            transformers: {
              include: {
                transformer: true,
              },
            },
            finalInspectionConsignees: true,
          },
        },
        consignee: true,
        gpFailures: true,
        materialDescription: true,
        deliveryDetail: true,
      },
    });

    res.json({
      items: deliveryChallans,
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
 * /delivery-challans/{id}:
 *   get:
 *     summary: Get a delivery challan by ID
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery challan ID
 *     responses:
 *       200:
 *         description: The delivery challan description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryChallan'
 *       404:
 *         description: The delivery challan was not found
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const deliveryChallan = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
      include: {
        supplyTender: {
          include: {
            company: true,
          },
        },
        finalInspection: {
          include: {
            deliverySchedule: true,
            transformers: {
              include: {
                transformer: true,
              },
            },
            finalInspectionConsignees: true,
          },
        },
        consignee: true,
        gpFailures: true,
        materialDescription: true,
        deliveryDetail: true,
      },
    });
    if (!deliveryChallan)
      return res.status(404).json({ error: "Delivery challan not found" });
    res.json(deliveryChallan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-challans:
 *   post:
 *     summary: Create a new delivery challan
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryChallan'
 *     responses:
 *       201:
 *         description: The delivery challan was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryChallan'
 *       400:
 *         description: Bad request
 */
router.post("/", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const deliveryChallan = await prisma.deliveryChallan.create({
      data: { ...req.body, supplyTenderId },
    });

    if (deliveryChallan.finalInspectionId) {
      await updateConsigneeDispatchCounts(deliveryChallan.finalInspectionId);
    }

    await logActivity(
      req.user.userId,
      "CREATE",
      "DeliveryChallan",
      deliveryChallan.id,
      null,
      deliveryChallan,
    );
    res.status(201).json(deliveryChallan);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

    // Fetch existing related IDs for validation, filtered by supplyTenderId
    const existingFinalInspectionIds = (
      await prisma.finalInspection.findMany({
        where: { supplyTenderId: supplyTenderId },
        select: { id: true },
      })
    ).map((fi) => fi.id);
    const existingConsigneeIds = (
      await prisma.consignee.findMany({
        where: { supplyTenderId: supplyTenderId },
        select: { id: true },
      })
    ).map((c) => c.id);
    const existingMaterialDescriptionIds = (
      await prisma.materialDescription.findMany({
        where: { supplyTenderId: supplyTenderId },
        select: { id: true },
      })
    ).map((md) => md.id);

    const parsedData = [];
    const invalidRecords = [];

    for (const item of data) {
      const record = {
        finalInspectionId: item.finalInspectionId,
        challanNo: item.challanNo,
        subSerialNumberFrom: item.subSerialNumberFrom
          ? String(item.subSerialNumberFrom)
          : undefined, // Ensure string type
        subSerialNumberTo: item.subSerialNumberTo
          ? String(item.subSerialNumberTo)
          : undefined, // Ensure string type
        consignorName: item.consignorName,
        consignorAddress: item.consignorAddress,
        consignorPhone: item.consignorPhone
          ? String(item.consignorPhone)
          : undefined, // Ensure string type
        consignorGST: item.consignorGST,
        consignorEmail: item.consignorEmail,
        consigneeId: item.consigneeId,
        truckDriverName: item.truckDriverName,
        lorryNo: item.lorryNo,
        challanDescription: item.challanDescription,
        materialDescriptionId: item.materialDescriptionId,
        challanCreatedAt: item.challanCreatedAt
          ? new Date(item.challanCreatedAt)
          : new Date(),
        supplyTenderId: supplyTenderId, // Add supplyTenderId to each item
      };

      // Basic validation
      if (
        !record.finalInspectionId ||
        !existingFinalInspectionIds.includes(record.finalInspectionId)
      ) {
        invalidRecords.push({
          item,
          error:
            "Invalid or missing finalInspectionId or it does not belong to the specified supplyTenderId",
        });
        continue;
      }
      if (
        !record.consigneeId ||
        !existingConsigneeIds.includes(record.consigneeId)
      ) {
        invalidRecords.push({
          item,
          error:
            "Invalid or missing consigneeId or it does not belong to the specified supplyTenderId",
        });
        continue;
      }
      if (
        !record.materialDescriptionId ||
        !existingMaterialDescriptionIds.includes(record.materialDescriptionId)
      ) {
        invalidRecords.push({
          item,
          error:
            "Invalid or missing materialDescriptionId or it does not belong to the specified supplyTenderId",
        });
        continue;
      }
      if (
        !record.challanNo ||
        !record.consignorName ||
        !record.consignorAddress ||
        !record.consignorPhone ||
        !record.truckDriverName ||
        !record.lorryNo
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

    const createdChallans = await prisma.deliveryChallan.createMany({
      data: parsedData,
      skipDuplicates: true,
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "DeliveryChallan",
      null,
      null,
      parsedData,
    );

    res
      .status(201)
      .json({ message: "Bulk upload successful", createdChallans });
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
 * /delivery-challans/{id}:
 *   put:
 *     summary: Update a delivery challan
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery challan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryChallan'
 *     responses:
 *       200:
 *         description: The delivery challan was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryChallan'
 *       404:
 *         description: The delivery challan was not found
 *       500:
 *         description: Some error happened
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const existingDeliveryChallan = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (!existingDeliveryChallan) {
      return res.status(404).json({
        error:
          "Delivery challan not found or does not belong to the specified supplyTenderId",
      });
    }

    const updatedDeliveryChallan = await prisma.deliveryChallan.update({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
      data: { ...req.body, supplyTenderId },
    });

    if (updatedDeliveryChallan.finalInspectionId) {
      await updateConsigneeDispatchCounts(
        updatedDeliveryChallan.finalInspectionId,
      );
    }
    // If finalInspectionId was changed, update the old one too
    if (
      existingDeliveryChallan.finalInspectionId &&
      existingDeliveryChallan.finalInspectionId !==
        updatedDeliveryChallan.finalInspectionId
    ) {
      await updateConsigneeDispatchCounts(
        existingDeliveryChallan.finalInspectionId,
      );
    }

    await logActivity(
      req.user.userId,
      "UPDATE",
      "DeliveryChallan",
      updatedDeliveryChallan.id,
      existingDeliveryChallan,
      updatedDeliveryChallan,
    );
    res.json(updatedDeliveryChallan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-challans/{id}:
 *   delete:
 *     summary: Delete a delivery challan
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery challan ID
 *     responses:
 *       204:
 *         description: The delivery challan was deleted
 *       404:
 *         description: The delivery challan was not found
 */
router.delete("/:id", auth, isOwner, async (req, res) => {
  try {
    const { supplyTenderId } = req.query; // Assuming supplyTenderId is passed as a query parameter for deletion
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const existingDeliveryChallan = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (!existingDeliveryChallan) {
      return res.status(404).json({
        error:
          "Delivery challan not found or does not belong to the specified supplyTenderId",
      });
    }

    await prisma.deliveryChallan.delete({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (existingDeliveryChallan.finalInspectionId) {
      await updateConsigneeDispatchCounts(
        existingDeliveryChallan.finalInspectionId,
      );
    }

    await logActivity(
      req.user.userId,
      req.user.name,
      "DELETE",
      "DeliveryChallan",
      req.params.id,
      existingDeliveryChallan,
      null,
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

