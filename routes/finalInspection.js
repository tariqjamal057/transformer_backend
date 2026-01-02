const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Final Inspections
 *   description: Final Inspection management
 */

/**
 * @swagger
 * /final-inspections:
 *   get:
 *     summary: Retrieve a list of final inspections with pagination
 *     tags: [Final Inspections]
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
 *         description: A list of final inspections.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FinalInspection'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const finalInspections = await prisma.finalInspection.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalFinalInspections = await prisma.finalInspection.count();
    res.json({
      data: finalInspections,
      totalPages: Math.ceil(totalFinalInspections / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /final-inspections:
 *   post:
 *     summary: Create a new final inspection
 *     tags: [Final Inspections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinalInspection'
 *     responses:
 *       201:
 *         description: The final inspection was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinalInspection'
 *       500:
 *         description: Something went wrong
 */
router.post('/', async (req, res) => {
  try {
    const newFinalInspection = await prisma.finalInspection.create({
      data: req.body,
    });
    res.status(201).json(newFinalInspection);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
