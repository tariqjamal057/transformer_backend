const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Material Descriptions
 *   description: Material Description management
 */

/**
 * @swagger
 * /material-descriptions:
 *   get:
 *     summary: Retrieve a list of material descriptions with pagination
 *     tags: [Material Descriptions]
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
 *         description: A list of material descriptions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaterialDescription'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const materialDescriptions = await prisma.materialDescription.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalMaterialDescriptions = await prisma.materialDescription.count();
    res.json({
      data: materialDescriptions,
      totalPages: Math.ceil(totalMaterialDescriptions / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /material-descriptions:
 *   post:
 *     summary: Create a new material description
 *     tags: [Material Descriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialDescription'
 *     responses:
 *       201:
 *         description: The material description was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaterialDescription'
 *       500:
 *         description: Something went wrong
 */
router.post('/', async (req, res) => {
  try {
    const newMaterialDescription = await prisma.materialDescription.create({
      data: req.body,
    });
    res.status(201).json(newMaterialDescription);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
