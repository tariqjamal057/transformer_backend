const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all TNs
router.get('/', async (req, res) => {
  try {
    const tns = await prisma.tn.findMany();
    res.json(tns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TN by ID
router.get('/:id', async (req, res) => {
  try {
    const tn = await prisma.tn.findUnique({
      where: { id: req.params.id },
    });
    if (!tn) return res.status(404).json({ error: 'TN not found' });
    res.json(tn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create TN
router.post('/', async (req, res) => {
  try {
    const tn = await prisma.tn.create({
      data: req.body,
    });
    res.status(201).json(tn);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update TN
router.put('/:id', async (req, res) => {
  try {
    const tn = await prisma.tn.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(tn);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete TN
router.delete('/:id', async (req, res) => {
  try {
    await prisma.tn.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
