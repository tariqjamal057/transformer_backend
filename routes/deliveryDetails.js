const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Delivery Details
 *   description: Delivery detail management
 */

/**
 * @swagger
 * /delivery-details:
 *   get:
 *     summary: Retrieve a list of delivery details with pagination
 *     tags: [Delivery Details]
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
 *         description: A list of delivery details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryDetail'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const deliveryDetails = await prisma.deliveryDetail.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalDeliveryDetails = await prisma.deliveryDetail.count();
    res.json({
      data: deliveryDetails,
      totalPages: Math.ceil(totalDeliveryDetails / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /delivery-details:
 *   post:
 *     summary: Create a new delivery detail
 *     tags: [Delivery Details]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryDetail'
 *     responses:
 *       201:
 *         description: The delivery detail was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryDetail'
 *       500:
 *         description: Something went wrong
 */
router.post('/', async (req, res) => {
  try {
    const newDeliveryDetail = await prisma.deliveryDetail.create({
      data: req.body,
    });
    res.status(201).json(newDeliveryDetail);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
