const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { paginate } = require("../utils/pagination");
const { logActivity } = require("../utils/activityLogger");
const auth = require("../middleware/auth");
const multer = require("multer");
const xlsx = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Delivery Schedules
 *   description: Delivery Schedule management
 */

/**
 * @swagger
 * /delivery-schedules:
 *   get:
 *     summary: Retrieve a list of all delivery schedules
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of delivery schedules.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliverySchedule'
 */
router.get("/", auth, async (req, res) => {
  try {
    const { all, supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    let deliverySchedules = await prisma.deliverySchedule.findMany({
      where: { supplyTenderId: supplyTenderId },
      orderBy: { createdAt: "desc" },
      include: { finalInspections: true },
    });

    // Dynamically calculate status
    deliverySchedules = deliverySchedules.map((schedule) => {
      const imposedCount = Array.isArray(schedule.imposedLetters)
        ? schedule.imposedLetters.length
        : 0;
      const liftingCount = Array.isArray(schedule.liftingLetters)
        ? schedule.liftingLetters.length
        : 0;
      schedule.status = imposedCount > liftingCount ? "On Hold" : "Active";
      return schedule;
    });

    if (all === "true") {
      return res.json(deliverySchedules);
    }

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 10;
    const paginatedData = paginate(deliverySchedules, page, pageSize);
    res.json(paginatedData);
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
        error:
          "supplyTenderId is required as a query parameter for bulk upload",
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const parsedData = data.map((item) => ({
      ...item,
      supplyTenderId, // Add supplyTenderId to each item
      imposedLetters: item.imposedLetters
        ? JSON.parse(item.imposedLetters)
        : [],
      liftingLetters: item.liftingLetters
        ? JSON.parse(item.liftingLetters)
        : [],
      deliverySchedule: item.deliverySchedule
        ? JSON.parse(item.deliverySchedule)
        : [],
    }));

    const createdSchedules = await prisma.deliverySchedule.createMany({
      data: parsedData,
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "DeliverySchedule",
      null,
      null,
      parsedData,
    );

    res
      .status(201)
      .json({ message: "Bulk upload successful", createdSchedules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-schedules/{id}:
 *   get:
 *     summary: Get a delivery schedule by ID
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery schedule ID
 *     responses:
 *       200:
 *         description: The delivery schedule description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliverySchedule'
 *       404:
 *         description: The delivery schedule was not found
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const deliverySchedule = await prisma.deliverySchedule.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
      include: { finalInspections: true },
    });
    if (!deliverySchedule)
      return res.status(404).json({ error: "Delivery schedule not found" });

    // Dynamically calculate status
    const imposedCount = Array.isArray(deliverySchedule.imposedLetters)
      ? deliverySchedule.imposedLetters.length
      : 0;
    const liftingCount = Array.isArray(deliverySchedule.liftingLetters)
      ? deliverySchedule.liftingLetters.length
      : 0;
    deliverySchedule.status =
      imposedCount > liftingCount ? "On Hold" : "Active";

    res.json(deliverySchedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-schedules:
 *   post:
 *     summary: Create a new delivery schedule
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliverySchedule'
 *     responses:
 *       201:
 *         description: The delivery schedule was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliverySchedule'
 *       400:
 *         description: Bad request
 */
router.post("/", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const deliverySchedule = await prisma.deliverySchedule.create({
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "DeliverySchedule",
      deliverySchedule.id,
      null,
      deliverySchedule,
    );
    res.status(201).json(deliverySchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-schedules/{id}:
 *   put:
 *     summary: Update a delivery schedule
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliverySchedule'
 *     responses:
 *       200:
 *         description: The delivery schedule was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliverySchedule'
 *       404:
 *         description: The delivery schedule was not found
 *       500:
 *         description: Some error happened
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingDeliverySchedule = await prisma.deliverySchedule.findUnique({
      where: { id },
    });

    if (!existingDeliverySchedule) {
      return res.status(404).json({ error: "Delivery schedule not found" });
    }

    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    let { deliveryScheduleDate, imposedLetters, liftingLetters, ...restData } =
      data;

    let newImposedLetters =
      imposedLetters || existingDeliverySchedule.imposedLetters;
    let newLiftingLetters =
      liftingLetters || existingDeliverySchedule.liftingLetters;

    // Date calculation logic
    if (
      liftingLetters &&
      liftingLetters.length >
        (existingDeliverySchedule.liftingLetters?.length || 0)
    ) {
      const lastImposed =
        newImposedLetters && newImposedLetters.length > 0
          ? newImposedLetters[newImposedLetters.length - 1]
          : null;
      const lastLifting =
        newLiftingLetters && newLiftingLetters.length > 0
          ? newLiftingLetters[newLiftingLetters.length - 1]
          : null;

      if (lastImposed?.date && lastLifting?.date) {
        const imposedDate = new Date(lastImposed.date);
        const liftingDate = new Date(lastLifting.date);
        if (liftingDate > imposedDate) {
          const diffTime = Math.abs(liftingDate - imposedDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          const currentDeliveryDate = new Date(
            existingDeliverySchedule.deliveryScheduleDate,
          );
          currentDeliveryDate.setDate(currentDeliveryDate.getDate() + diffDays + 1);
          deliveryScheduleDate = currentDeliveryDate;
        }
      }
    }

    const updatedDeliverySchedule = await prisma.deliverySchedule.update({
      where: { id },
      data: {
        ...restData,
        deliveryScheduleDate,
        imposedLetters: newImposedLetters,
        liftingLetters: newLiftingLetters,
        supplyTenderId,
      },
    });

    await logActivity(
      req.user.userId,
      "UPDATE",
      "DeliverySchedule",
      updatedDeliverySchedule.id,
      existingDeliverySchedule,
      updatedDeliverySchedule,
    );

    res.json(updatedDeliverySchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-schedules/{id}:
 *   delete:
 *     summary: Delete a delivery schedule
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery schedule ID
 *     responses:
 *       204:
 *         description: The delivery schedule was deleted
 *       404:
 *         description: The delivery schedule was not found
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const existingDeliverySchedule = await prisma.deliverySchedule.findUnique({
      where: { id: req.params.id },
    });

    if (!existingDeliverySchedule) {
      return res.status(404).json({ error: "Delivery schedule not found" });
    }

    await prisma.deliverySchedule.delete({
      where: { id: req.params.id },
    });
    await logActivity(
      req.user.userId,
      "DELETE",
      "DeliverySchedule",
      req.params.id,
      existingDeliverySchedule,
      null,
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
