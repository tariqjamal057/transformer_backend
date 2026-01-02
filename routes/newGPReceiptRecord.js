const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: New GP Receipt Records
 *   description: New GP Receipt Record management
 */

/**
 * @swagger
 * /new-gp-receipt-records:
 *   get:
 *     summary: Retrieve a list of new GP receipt records with pagination
 *     tags: [New GP Receipt Records]
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
 *     responses:
 *       200:
 *         description: A list of new GP receipt records.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NewGPReceiptRecord'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const newGPReceiptRecords = await prisma.newGPReceiptRecord.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalNewGPReceiptRecords = await prisma.newGPReceiptRecord.count();
    res.json({
      data: newGPReceiptRecords,
      totalPages: Math.ceil(totalNewGPReceiptRecords / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /new-gp-receipt-records:
 *   post:
 *     summary: Create a new new GP receipt record
 *     tags: [New GP Receipt Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewGPReceiptRecord'
 *     responses:
 *       201:
 *         description: The new GP receipt record was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewGPReceiptRecord'
 *       500:
 *         description: Something went wrong
 */
router.post('/', async (req, res) => {
  try {
    const newNewGPReceiptRecord = await prisma.newGPReceiptRecord.create({
      data: req.body,
    });
    res.status(201).json(newNewGPReceiptRecord);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
