const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Defferments
 *   description: Defferment management
 */

/**
 * @swagger
 * /defferments:
 *   get:
 *     summary: Retrieve a list of defferments with pagination
 *     tags: [Defferments]
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
 *         description: A list of defferments.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Defferment'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const defferments = await prisma.defferment.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalDefferments = await prisma.defferment.count();
    res.json({
      data: defferments,
      totalPages: Math.ceil(totalDefferments / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /defferments:
 *   post:
 *     summary: Create a new defferment
 *     tags: [Defferments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Defferment'
 *     responses:
 *       201:
 *         description: The defferment was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Defferment'
 *       500:
 *         description: Something went wrong
 */
router.post('/', async (req, res) => {
  try {
    const newDefferment = await prisma.defferment.create({
      data: req.body,
    });
    res.status(201).json(newDefferment);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
