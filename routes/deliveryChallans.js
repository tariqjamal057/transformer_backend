const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all delivery challans
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

// Get delivery challan by ID
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

// Create delivery challan
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

// Update delivery challan
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

// Delete delivery challan
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
