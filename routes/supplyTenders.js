const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Supply Tenders
 *   description: Supply Tender management
 */

/**
 * @swagger
 * /supply-tenders:
 *   get:
 *     summary: Retrieve a list of supply tenders with pagination
 *     tags: [Supply Tenders]
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
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: The company ID to filter by
 *     responses:
 *       200:
 *         description: A list of supply tenders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupplyTender'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get("/", async (req, res) => {
  const { page = 1, limit = 10, companyId, all } = req.query;
  const where = companyId ? { companyId } : {};
  try {
    const supplyTenders = await prisma.supplyTender.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        company: true,
      },
    });
    if (all === "true") {
      return res.json(supplyTenders);
    }
    const totalSupplyTenders = await prisma.supplyTender.count({ where });
    res.json({
      data: supplyTenders,
      totalPages: Math.ceil(totalSupplyTenders / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * @swagger
 * /supply-tenders/{id}:
 *   get:
 *     summary: Retrieve a single supply tender by ID
 *     tags: [Supply Tenders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The supply tender ID
 *     responses:
 *       200:
 *         description: A single supply tender.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplyTender'
 *       404:
 *         description: Supply tender not found
 *       500:
 *         description: Something went wrong
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const supplyTender = await prisma.supplyTender.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
    if (!supplyTender) {
      return res.status(404).json({ error: "Supply tender not found" });
    }
    res.json(supplyTender);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * @swagger
 * /supply-tenders:
 *   post:
 *     summary: Create a new supply tender
 *     tags: [Supply Tenders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplyTender'
 *     responses:
 *       201:
 *         description: The supply tender was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplyTender'
 *       500:
 *         description: Something went wrong
 */
router.post("/", async (req, res) => {
  const { name, tenderNo, tenderDate, companyId } = req.body;
  try {
    const newSupplyTender = await prisma.supplyTender.create({
      data: {
        name,
        tenderNo,
        tenderDate,
        company: {
          connect: {
            id: companyId,
          },
        },
      },
    });
    res.status(201).json(newSupplyTender);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * @swagger
 * /supply-tenders/{id}:
 *   put:
 *     summary: Update a supply tender
 *     tags: [Supply Tenders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The supply tender ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplyTender'
 *     responses:
 *       200:
 *         description: The supply tender was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplyTender'
 *       404:
 *         description: The supply tender was not found
 *       500:
 *         description: Some error happened
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, tenderNo, tenderDate, companyId } = req.body;
  try {
    const supplyTender = await prisma.supplyTender.findUnique({
      where: { id },
    });

    if (!supplyTender) {
      return res.status(404).json({ error: "Supply tender not found" });
    }

    const updatedSupplyTender = await prisma.supplyTender.update({
      where: { id },
      data: {
        name,
        tenderNo,
        tenderDate,
        company: {
          connect: {
            id: companyId,
          },
        },
      },
    });

    res.json(updatedSupplyTender);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * @swagger
 * /supply-tenders/{id}:
 *   delete:
 *     summary: Delete a supply tender
 *     tags: [Supply Tenders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The supply tender ID
 *     responses:
 *       204:
 *         description: The supply tender was deleted
 *       404:
 *         description: The supply tender was not found
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const supplyTender = await prisma.supplyTender.findUnique({
      where: { id },
    });

    if (!supplyTender) {
      return res.status(404).json({ error: "Supply tender not found" });
    }

    await prisma.supplyTender.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
