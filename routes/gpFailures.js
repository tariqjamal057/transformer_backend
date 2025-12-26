const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all GP failures
router.get('/', async (req, res) => {
  try {
    const gpFailures = await prisma.gpFailure.findMany({
      include: { deliveryChallan: true },
    });
    res.json(gpFailures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get GP failure by ID
router.get('/:id', async (req, res) => {
  try {
    const gpFailure = await prisma.gpFailure.findUnique({
      where: { id: req.params.id },
      include: { deliveryChallan: true },
    });
    if (!gpFailure) return res.status(404).json({ error: 'GP failure not found' });
    res.json(gpFailure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create GP failure
router.post('/', async (req, res) => {
  try {
    const gpFailure = await prisma.gpFailure.create({
      data: req.body,
    });
    res.status(201).json(gpFailure);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update GP failure
router.put('/:id', async (req, res) => {
  try {
    const gpFailure = await prisma.gpFailure.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(gpFailure);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete GP failure
router.delete('/:id', async (req, res) => {
  try {
    await prisma.gpFailure.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
