const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all delivery schedules
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

// Get delivery schedule by ID
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

// Create delivery schedule
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

// Update delivery schedule
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

// Delete delivery schedule
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
