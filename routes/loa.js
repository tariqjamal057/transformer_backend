const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: LOAs
 *   description: LOA management
 */

/**
 * @swagger
 * /loas:
 *   get:
 *     summary: Retrieve a list of LOAs with pagination
 *     tags: [LOAs]
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
 *         description: A list of LOAs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LOA'
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
    const loas = await prisma.lOA.findMany({
      where: { supplyTenderId: supplyTenderId },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalLoas = await prisma.lOA.count({
      where: { supplyTenderId: supplyTenderId },
    });
    res.json({
      data: loas,
      totalPages: Math.ceil(totalLoas / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /loas:
 *   post:
 *     summary: Create a new LOA
 *     tags: [LOAs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LOA'
 *     responses:
 *       201:
 *         description: The LOA was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LOA'
 *       500:
 *         description: Something went wrong
 */
router.post('/', auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.body;
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const newLoa = await prisma.lOA.create({
      data: { ...req.body, supplyTenderId },
    });
    res.status(201).json(newLoa);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
