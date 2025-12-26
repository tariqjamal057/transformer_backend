const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all failure analyses
router.get('/', async (req, res) => {
  try {
    const failureAnalyses = await prisma.failureAnalysis.findMany();
    res.json(failureAnalyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get failure analysis by ID
router.get('/:id', async (req, res) => {
  try {
    const failureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id: req.params.id },
    });
    if (!failureAnalysis) return res.status(404).json({ error: 'Failure analysis not found' });
    res.json(failureAnalysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create failure analysis
router.post('/', async (req, res) => {
  try {
    const failureAnalysis = await prisma.failureAnalysis.create({
      data: req.body,
    });
    res.status(201).json(failureAnalysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update failure analysis
router.put('/:id', async (req, res) => {
  try {
    const failureAnalysis = await prisma.failureAnalysis.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(failureAnalysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete failure analysis
router.delete('/:id', async (req, res) => {
  try {
    await prisma.failureAnalysis.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
