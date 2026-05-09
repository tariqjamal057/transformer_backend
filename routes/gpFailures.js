const express = require("express");
const { PrismaClient } = require("@prisma/client");
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
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      search = "",
      all,
      includeRelations,
      supplyTenderId,
    } = req.query;
    const pageSize = 10;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    let where = { supplyTenderId: supplyTenderId };
    if (search) {
      where.OR = [
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
      ];
    }

    const include = {
      deliveryChallan: {
        include: {
          finalInspection: {
            include: {
              deliverySchedule: {
                include: {
                  tn: true,
                },
              },
            },
          },
          consignee: true,
          materialDescription: true,
        },
      },
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
router.get("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const gpFailure = await prisma.gPFailure.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
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
router.post("/", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const { trfsiNo, rating } = req.body;

    // Check if a GP failure with the same trfsiNo and rating already exists for this supply tender
    const existingFailure = await prisma.gPFailure.findFirst({
      where: {
        trfsiNo,
        rating,
        supplyTenderId,
      },
    });

    if (existingFailure) {
      return res
        .status(400)
        .json({
          message: `GP Failure with TRFSI No '${trfsiNo}' and Rating '${rating}' already exists.`,
        });
    }

    const gpFailure = await prisma.gPFailure.create({
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "GPFailure",
      gpFailure.id,
      null,
      gpFailure,
    );
    res.status(201).json(gpFailure);
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

    const dataWithRows = data.map((row, index) => ({
      ...row,
      __rowNum: index + 2,
    }));

    const groupedData = [];
    let currentRecord = null;

    for (const row of dataWithRows) {
      const isNewRecord = row['Challan No'] || row['TRFSI No'] || row['Rating'];
      if (isNewRecord) {
        if (currentRecord) groupedData.push(currentRecord);
        currentRecord = { ...row, failureDetailsList: [], __firstRowNum: row.__rowNum };
      }
      
      if (currentRecord && (row['Failure Date'] || row['Information Date'] || row['Place'])) {
        currentRecord.failureDetailsList.push({
          failureDate: parseDate(row['Failure Date']),
          informationDate: parseDate(row['Information Date']),
          place: row['Place'] || ''
        });
      }
    }
    if (currentRecord) groupedData.push(currentRecord);

    const parsedData = [];
    const invalidRecords = [];
    const existingFailures = await prisma.gPFailure.findMany({
      where: { supplyTenderId },
      select: { trfsiNo: true, rating: true },
    });
    const existingFailureSet = new Set(existingFailures.map((f) => `${f.trfsiNo}-${f.rating}`));

    for (const record of groupedData) {
      const challanNo = String(record['Challan No'] || '');
      const trfsiNo = String(record['TRFSI No'] || '');
      const rating = String(record['Rating'] || '');
      const duplicateKey = `${trfsiNo}-${rating}`;

      if (existingFailureSet.has(duplicateKey)) {
        invalidRecords.push({ row: record.__firstRowNum, error: `GP Failure '${trfsiNo}' already exists.` });
        continue;
      }

      const challan = await prisma.deliveryChallan.findFirst({
        where: { challanNo, supplyTenderId },
      });

      if (!challan) {
        invalidRecords.push({ row: record.__firstRowNum, error: `Challan '${challanNo}' not found.` });
        continue;
      }

      parsedData.push({
        deliveryChallanId: challan.id,
        trfsiNo: trfsiNo,
        rating: rating,
        subDivision: record['Sub Division'] || '',
        failureDetails: record.failureDetailsList,
        guaranteeExpiry: parseDate(record['Guarantee Expiry']),
        guaranteeStatus: record['Guarantee Status'] || 'Under Guarantee',
        supplyTenderId: supplyTenderId,
      });
    }

    if (invalidRecords.length > 0) {
      return res.status(400).json({ error: "Bulk upload failed due to invalid data.", details: invalidRecords });
    }

    const createdFailures = await prisma.gPFailure.createMany({ data: parsedData });
    await logActivity(req.user.userId, "CREATE", "GPFailure", null, null, parsedData);

    res.status(201).json({ message: "Bulk upload successful", createdFailures });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: "Something went wrong during bulk upload", details: error.message });
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
router.put("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const existingGpFailure = await prisma.gPFailure.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (!existingGpFailure) {
      return res
        .status(404)
        .json({
          error:
            "GP failure not found or does not belong to the specified supplyTenderId",
        });
    }

    const updatedGpFailure = await prisma.gPFailure.update({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "UPDATE",
      "GPFailure",
      updatedGpFailure.id,
      existingGpFailure,
      updatedGpFailure,
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
router.delete("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query; // Assuming supplyTenderId is passed as a query parameter for deletion
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const existingGpFailure = await prisma.gPFailure.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (!existingGpFailure) {
      return res
        .status(404)
        .json({
          error:
            "GP failure not found or does not belong to the specified supplyTenderId",
        });
    }

    await prisma.gPFailure.delete({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "DELETE",
      "GPFailure",
      req.params.id,
      existingGpFailure,
      null,
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
