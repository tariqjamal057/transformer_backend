const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Delivery Challans
 *   description: Delivery Challan management
 */

/**
 * @swagger
 * /delivery-challans:
 *   get:
 *     summary: Retrieve a list of all delivery challans
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of delivery challans.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryChallan'
 */
router.get('/', async (req, res) => {
  try {
    const deliveryChallans = await prisma.deliveryChallan.findMany({
      include: {
        finalInspection: true,
        consignee: true,
        gpFailures: true,
      },
    });
    res.json(deliveryChallans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-challans/{id}:
 *   get:
 *     summary: Get a delivery challan by ID
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery challan ID
 *     responses:
 *       200:
 *         description: The delivery challan description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryChallan'
 *       404:
 *         description: The delivery challan was not found
 */
router.get('/:id', async (req, res) => {
  try {
    const deliveryChallan = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id },
      include: {
        finalInspection: true,
        consignee: true,
        gpFailures: true,
      },
    });
    if (!deliveryChallan) return res.status(404).json({ error: 'Delivery challan not found' });
    res.json(deliveryChallan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-challans:
 *   post:
 *     summary: Create a new delivery challan
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryChallan'
 *     responses:
 *       201:
 *         description: The delivery challan was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryChallan'
 *       400:
 *         description: Bad request
 */
router.post('/', async (req, res) => {
  try {
    const deliveryChallan = await prisma.deliveryChallan.create({
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'DeliveryChallan', deliveryChallan.id, null, deliveryChallan);
    res.status(201).json(deliveryChallan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-challans/{id}:
 *   put:
 *     summary: Update a delivery challan
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery challan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryChallan'
 *     responses:
 *       200:
 *         description: The delivery challan was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryChallan'
 *       404:
 *         description: The delivery challan was not found
 *       500:
 *         description: Some error happened
 */
router.put('/:id', async (req, res) => {
  try {
    const existingDeliveryChallan = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id },
    });

    if (!existingDeliveryChallan) {
      return res.status(404).json({ error: 'Delivery challan not found' });
    }

    const updatedDeliveryChallan = await prisma.deliveryChallan.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'DeliveryChallan', updatedDeliveryChallan.id, existingDeliveryChallan, updatedDeliveryChallan);
    res.json(updatedDeliveryChallan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-challans/{id}:
 *   delete:
 *     summary: Delete a delivery challan
 *     tags: [Delivery Challans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery challan ID
 *     responses:
 *       204:
 *         description: The delivery challan was deleted
 *       404:
 *         description: The delivery challan was not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const existingDeliveryChallan = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id },
    });

    if (!existingDeliveryChallan) {
      return res.status(404).json({ error: 'Delivery challan not found' });
    }

    await prisma.deliveryChallan.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'DeliveryChallan', req.params.id, existingDeliveryChallan, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
