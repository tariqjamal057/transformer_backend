const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, isOwner } = require('../middleware/auth');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Chalan Descriptions
 *   description: Chalan description management
 */

/**
 * @swagger
 * /chalan-descriptions:
 *   get:
 *     summary: Retrieve a list of chalan descriptions with pagination
 *     tags: [Chalan Descriptions]
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
 *         description: A list of chalan descriptions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChalanDescription'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, supplyTenderId } = req.query;
  try {
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const chalanDescriptions = await prisma.chalanDescription.findMany({
      where: { supplyTenderId: supplyTenderId },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalChalanDescriptions = await prisma.chalanDescription.count({
      where: { supplyTenderId: supplyTenderId },
    });
    res.json({
      data: chalanDescriptions,
      totalPages: Math.ceil(totalChalanDescriptions / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /chalan-descriptions:
 *   post:
 *     summary: Create a new chalan description
 *     tags: [Chalan Descriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChalanDescription'
 *     responses:
 *       201:
 *         description: The chalan description was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChalanDescription'
 *       500:
 *         description: Something went wrong
 */
router.post('/', auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.body;
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const newChalanDescription = await prisma.chalanDescription.create({
      data: { ...req.body, supplyTenderId },
    });
    res.status(201).json(newChalanDescription);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.delete("/:id", auth, isOwner, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.chalanDescription.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
