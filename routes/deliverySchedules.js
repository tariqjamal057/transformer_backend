const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Delivery Schedules
 *   description: Delivery Schedule management
 */

/**
 * @swagger
 * /delivery-schedules:
 *   get:
 *     summary: Retrieve a list of all delivery schedules
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of delivery schedules.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliverySchedule'
 */
router.get('/', async (req, res) => {
  try {
    const deliverySchedules = await prisma.deliverySchedule.findMany({
      include: { finalInspections: true },
    });
    res.json(deliverySchedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-schedules/{id}:
 *   get:
 *     summary: Get a delivery schedule by ID
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery schedule ID
 *     responses:
 *       200:
 *         description: The delivery schedule description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliverySchedule'
 *       404:
 *         description: The delivery schedule was not found
 */
router.get('/:id', async (req, res) => {
  try {
    const deliverySchedule = await prisma.deliverySchedule.findUnique({
      where: { id: req.params.id },
      include: { finalInspections: true },
    });
    if (!deliverySchedule) return res.status(404).json({ error: 'Delivery schedule not found' });
    res.json(deliverySchedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-schedules:
 *   post:
 *     summary: Create a new delivery schedule
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliverySchedule'
 *     responses:
 *       201:
 *         description: The delivery schedule was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliverySchedule'
 *       400:
 *         description: Bad request
 */
router.post('/', async (req, res) => {
  try {
    const deliverySchedule = await prisma.deliverySchedule.create({
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'DeliverySchedule', deliverySchedule.id, null, deliverySchedule);
    res.status(201).json(deliverySchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-schedules/{id}:
 *   put:
 *     summary: Update a delivery schedule
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliverySchedule'
 *     responses:
 *       200:
 *         description: The delivery schedule was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliverySchedule'
 *       404:
 *         description: The delivery schedule was not found
 *       500:
 *         description: Some error happened
 */
router.put('/:id', async (req, res) => {
  try {
    const existingDeliverySchedule = await prisma.deliverySchedule.findUnique({
      where: { id: req.params.id },
    });

    if (!existingDeliverySchedule) {
      return res.status(404).json({ error: 'Delivery schedule not found' });
    }

    const updatedDeliverySchedule = await prisma.deliverySchedule.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'DeliverySchedule', updatedDeliverySchedule.id, existingDeliverySchedule, updatedDeliverySchedule);
    res.json(updatedDeliverySchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /delivery-schedules/{id}:
 *   delete:
 *     summary: Delete a delivery schedule
 *     tags: [Delivery Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The delivery schedule ID
 *     responses:
 *       204:
 *         description: The delivery schedule was deleted
 *       404:
 *         description: The delivery schedule was not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const existingDeliverySchedule = await prisma.deliverySchedule.findUnique({
      where: { id: req.params.id },
    });

    if (!existingDeliverySchedule) {
      return res.status(404).json({ error: 'Delivery schedule not found' });
    }

    await prisma.deliverySchedule.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'DeliverySchedule', req.params.id, existingDeliverySchedule, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

