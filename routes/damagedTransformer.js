const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Damaged Transformers
 *   description: Damaged Transformer management
 */

/**
 * @swagger
 * /damaged-transformers:
 *   get:
 *     summary: Retrieve a list of damaged transformers with pagination
 *     tags: [Damaged Transformers]
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
 *         description: A list of damaged transformers.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DamagedTransformer'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const damagedTransformers = await prisma.damagedTransformer.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalDamagedTransformers = await prisma.damagedTransformer.count();
    res.json({
      data: damagedTransformers,
      totalPages: Math.ceil(totalDamagedTransformers / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /damaged-transformers:
 *   post:
 *     summary: Create a new damaged transformer
 *     tags: [Damaged Transformers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DamagedTransformer'
 *     responses:
 *       201:
 *         description: The damaged transformer was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DamagedTransformer'
 *       500:
 *         description: Something went wrong
 */
router.post('/', async (req, res) => {
  try {
    const newDamagedTransformer = await prisma.damagedTransformer.create({
      data: req.body,
    });
    res.status(201).json(newDamagedTransformer);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
