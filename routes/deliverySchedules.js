const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { paginate } = require("../utils/pagination");
const { logActivity } = require("../utils/activityLogger");
const { auth, isOwner } = require("../middleware/auth");
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
      if (!dateString || typeof dateString !== "string") return null;
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
      // Fallback for other date formats if needed
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

    const groupedData = [];
    let currentMainRow = null;
    let currentSubRows = [];

    for (const row of dataWithRows) {
      if (row.Company && row.Discom && row.tnNumber) {
        if (currentMainRow) {
          groupedData.push({ main: currentMainRow, subs: currentSubRows });
        }
        currentMainRow = row;
        currentSubRows = []; // Reset for the new main row
      } else {
        if (currentMainRow) {
          currentSubRows.push(row);
        }
      }
    }
    if (currentMainRow) {
      groupedData.push({ main: currentMainRow, subs: currentSubRows });
    }

    const parsedData = [];
    const invalidRecords = [];

    for (const group of groupedData) {
      const firstRow = group.main;
      const allRows = [firstRow, ...group.subs];
      const errorsForGroup = [];

      if (!firstRow.Company) {
        errorsForGroup.push("'Company' is a required field.");
      }
      if (!firstRow.Discom) {
        errorsForGroup.push("'Discom' is a required field.");
      }
      if (!firstRow.tnNumber) {
        errorsForGroup.push("'tnNumber' (Tender No) is a required field.");
      }

      let company;
      if (firstRow.Company) {
        company = await prisma.company.findFirst({
          where: { name: firstRow.Company },
        });
        if (!company) {
          errorsForGroup.push(`Company '${firstRow.Company}' not found.`);
        }
      }

      let supplyTender;
      if (company && firstRow.Discom) {
        supplyTender = await prisma.supplyTender.findFirst({
          where: { name: firstRow.Discom, companyId: company.id },
        });
        if (!supplyTender) {
          errorsForGroup.push(
            `Discom '${firstRow.Discom}' not found for Company '${firstRow.Company}'.`,
          );
        }
      }

      if (supplyTender && firstRow.tnNumber) {
        const existingSchedule = await prisma.deliverySchedule.findFirst({
          where: {
            tnNumber: firstRow.tnNumber,
            supplyTenderId: supplyTender.id,
          },
        });
        if (existingSchedule) {
          errorsForGroup.push(
            `Delivery Schedule with Tender No '${firstRow.tnNumber}' already exists for this Discom.`,
          );
        }
      }

      if (errorsForGroup.length > 0) {
        invalidRecords.push({
          tnNumber: firstRow.tnNumber || "N/A",
          row: firstRow.__rowNum,
          errors: errorsForGroup,
        });
        continue;
      }

      const imposedLetters = [];
      const liftingLetters = [];
      const deliverySchedule = [];
      const imposedSet = new Set();
      const liftingSet = new Set();
      const scheduleSet = new Set();

      allRows.forEach((row) => {
        if (row.imposedLetterNo && !imposedSet.has(row.imposedLetterNo)) {
          imposedLetters.push({
            imposedLetterNo: row.imposedLetterNo,
            date: parseDate(row.imposedDate),
          });
          imposedSet.add(row.imposedLetterNo);
        }
        if (row.liftingLetterNo && !liftingSet.has(row.liftingLetterNo)) {
          liftingLetters.push({
            liftingLetterNo: row.liftingLetterNo,
            date: parseDate(row.liftingDate),
          });
          liftingSet.add(row.liftingLetterNo);
        }
        const scheduleKey = `${row.delivery_period_start}-${row.delivery_period_end}`;
        if (row.delivery_period_start && !scheduleSet.has(scheduleKey)) {
          deliverySchedule.push({
            start: parseDate(row.delivery_period_start),
            end: parseDate(row.delivery_period_end),
            quantity: row.delivery_period_quantity,
          });
          scheduleSet.add(scheduleKey);
        }
      });

      const record = {
        supplyTenderId: supplyTender.id,
        tnNumber: firstRow.tnNumber,
        rating: firstRow.rating ? parseInt(firstRow.rating, 10) : null,
        wound: firstRow.wound,
        phase: firstRow.phase,
        loa: firstRow.loa,
        loaDate: parseDate(firstRow.loaDate),
        po: firstRow.po,
        poDate: parseDate(firstRow.poDate),
        commencementDays: firstRow.commencementDays
          ? parseInt(firstRow.commencementDays, 10)
          : null,
        commencementDate: parseDate(firstRow.commencementDate),
        deliveryScheduleDate: parseDate(firstRow.deliveryScheduleDate),
        guaranteePeriodMonths: firstRow.guaranteePeriodMonths
          ? parseInt(firstRow.guaranteePeriodMonths, 10)
          : null,
        totalQuantity: firstRow.totalQuantity
          ? parseInt(firstRow.totalQuantity, 10)
          : null,
        chalanDescription: firstRow.particulars,
        imposedLetters,
        liftingLetters,
        deliverySchedule: deliverySchedule.map((ds) => ({
          ...ds,
          quantity: ds.quantity ? parseInt(ds.quantity, 10) : null,
        })),
      };

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
    console.error("Bulk upload error:", error);
    res.status(500).json({
      error: "Something went wrong during bulk upload",
      details: error.message,
    });
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
          currentDeliveryDate.setDate(
            currentDeliveryDate.getDate() + diffDays + 1,
          );
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
router.delete("/:id", auth, isOwner, async (req, res) => {
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
