const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { logActivity } = require("../utils/activityLogger");
const { paginate } = require("../utils/pagination");
const auth = require("../middleware/auth");
const multer = require("multer");
const xlsx = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Consignees
 *   description: Consignee management
 */

/**
 * @swagger
 * /consignees:
 *   get:
 *     summary: Retrieve a paginated list of consignees
 *     tags: [Consignees]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number for pagination
 *     responses:
 *       200:
 *         description: A paginated list of consignees.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Consignee'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalItems:
 *                    type: integer
 */
router.get("/", auth, async (req, res) => {
  try {
    const { all, supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    if (all === "true") {
      const consignees = await prisma.consignee.findMany({
        where: { supplyTenderId: supplyTenderId },
        orderBy: { createdAt: "desc" },
      });
      return res.json(consignees);
    }

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 10; // Or from query param
    const consignees = await prisma.consignee.findMany({
      where: { supplyTenderId: supplyTenderId },
      orderBy: {
        createdAt: "desc",
      },
    });
    const paginatedData = paginate(consignees, page, pageSize);
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

    // Basic validation to ensure required fields are present
    const requiredFields = ["name", "address", "gstNo", "email", "phone"];
    for (const item of data) {
      for (const field of requiredFields) {
        if (!item[field]) {
          return res.status(400).json({
            error: `Missing required field "${field}" in one of the rows.`,
          });
        }
      }
      item.supplyTenderId = supplyTenderId; // Add supplyTenderId to each item
    }

    const createdConsignees = await prisma.consignee.createMany({
      data: data,
      skipDuplicates: true, // Optional: useful if you want to avoid errors on duplicate entries
    });
    await logActivity(req.user.userId, "CREATE", "Consignee", null, null, data);

    res
      .status(201)
      .json({ message: "Bulk upload successful", createdConsignees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /consignees/{id}:
 *   get:
 *     summary: Get a consignee by ID
 *     tags: [Consignees]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The consignee ID
 *     responses:
 *       200:
 *         description: The consignee description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Consignee'
 *       404:
 *         description: The consignee was not found
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const consignee = await prisma.consignee.findUnique({
      where: { id: req.params.id },
      include: {
        finalInspectionConsignees: true,
        deliveryChallans: true,
      },
    });
    if (!consignee)
      return res.status(404).json({ error: "Consignee not found" });
    res.json(consignee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /consignees:
 *   post:
 *     summary: Create a new consignee
 *     tags: [Consignees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Consignee'
 *     responses:
 *       201:
 *         description: The consignee was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Consignee'
 *       400:
 *         description: Bad request
 */
router.post("/", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const consignee = await prisma.consignee.create({
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "Consignee",
      consignee.id,
      null,
      consignee,
    );
    res.status(201).json(consignee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /consignees/{id}:
 *   put:
 *     summary: Update a consignee
 *     tags: [Consignees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The consignee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Consignee'
 *     responses:
 *       200:
 *         description: The consignee was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Consignee'
 *       404:
 *         description: The consignee was not found
 *       500:
 *         description: Some error happened
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const existingConsignee = await prisma.consignee.findUnique({
      where: { id: req.params.id },
    });

    if (!existingConsignee) {
      return res.status(404).json({ error: "Consignee not found" });
    }

    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const updatedConsignee = await prisma.consignee.update({
      where: { id: req.params.id },
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "UPDATE",
      "Consignee",
      updatedConsignee.id,
      existingConsignee,
      updatedConsignee,
    );
    res.json(updatedConsignee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /consignees/{id}:
 *   delete:
 *     summary: Delete a consignee
 *     tags: [Consignees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The consignee ID
 *     responses:
 *       204:
 *         description: The consignee was deleted
 *       404:
 *         description: The consignee was not found
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const existingConsignee = await prisma.consignee.findUnique({
      where: { id: req.params.id },
    });

    if (!existingConsignee) {
      return res.status(404).json({ error: "Consignee not found" });
    }

    await prisma.consignee.delete({
      where: { id: req.params.id },
    });
    await logActivity(
      req.user.userId,
      "DELETE",
      "Consignee",
      req.params.id,
      existingConsignee,
      null,
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
