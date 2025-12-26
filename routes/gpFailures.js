const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

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
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'GPFailure', gpFailure.id, null, gpFailure);
    res.status(201).json(gpFailure);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update GP failure
router.put('/:id', async (req, res) => {
  try {
    const existingGpFailure = await prisma.gpFailure.findUnique({
      where: { id: req.params.id },
    });

    if (!existingGpFailure) {
      return res.status(404).json({ error: 'GP failure not found' });
    }

    const updatedGpFailure = await prisma.gpFailure.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'GPFailure', updatedGpFailure.id, existingGpFailure, updatedGpFailure);
    res.json(updatedGpFailure);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete GP failure
router.delete('/:id', async (req, res) => {
  try {
    const existingGpFailure = await prisma.gpFailure.findUnique({
      where: { id: req.params.id },
    });

    if (!existingGpFailure) {
      return res.status(404).json({ error: 'GP failure not found' });
    }

    await prisma.gpFailure.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'GPFailure', req.params.id, existingGpFailure, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
