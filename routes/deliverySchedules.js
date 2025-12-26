const express = require('express');
const { PrismaClient } = require('@prisma/client');

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
    res.status(201).json(deliverySchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update delivery schedule
router.put('/:id', async (req, res) => {
  try {
    const deliverySchedule = await prisma.deliverySchedule.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(deliverySchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete delivery schedule
router.delete('/:id', async (req, res) => {
  try {
    await prisma.deliverySchedule.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
