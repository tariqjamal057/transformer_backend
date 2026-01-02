const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
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
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const chalanDescriptions = await prisma.chalanDescription.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalChalanDescriptions = await prisma.chalanDescription.count();
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
router.post('/', async (req, res) => {
  try {
    const newChalanDescription = await prisma.chalanDescription.create({
      data: req.body,
    });
    res.status(201).json(newChalanDescription);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
