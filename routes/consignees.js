const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, dataFeederOnly, moduleAccess } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all consignees
router.get('/', async (req, res) => {
  try {
    const consignees = await prisma.consignee.findMany({
      include: {
        finalInspectionConsignees: true,
        deliveryChallans: true,
      },
    });
    res.json(consignees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get consignee by ID
router.get('/:id', async (req, res) => {
  try {
    const consignee = await prisma.consignee.findUnique({
      where: { id: req.params.id },
      include: {
        finalInspectionConsignees: true,
        deliveryChallans: true,
      },
    });
    if (!consignee) return res.status(404).json({ error: 'Consignee not found' });
    res.json(consignee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create consignee
router.post('/', async (req, res) => {
  try {
    const consignee = await prisma.consignee.create({
      data: req.body,
    });
    res.status(201).json(consignee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update consignee
router.put('/:id', async (req, res) => {
  try {
    const consignee = await prisma.consignee.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(consignee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete consignee
router.delete('/:id', async (req, res) => {
  try {
    await prisma.consignee.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
