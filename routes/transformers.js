const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all transformers
router.get('/', async (req, res) => {
  try {
    const transformers = await prisma.transformer.findMany({
      include: { finalInspections: true },
    });
    res.json(transformers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transformer by ID
router.get('/:id', async (req, res) => {
  try {
    const transformer = await prisma.transformer.findUnique({
      where: { id: req.params.id },
      include: { finalInspections: true },
    });
    if (!transformer) return res.status(404).json({ error: 'Transformer not found' });
    res.json(transformer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transformer
router.post('/', async (req, res) => {
  try {
    const transformer = await prisma.transformer.create({
      data: req.body,
    });
    res.status(201).json(transformer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update transformer
router.put('/:id', async (req, res) => {
  try {
    const transformer = await prisma.transformer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(transformer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transformer
router.delete('/:id', async (req, res) => {
  try {
    await prisma.transformer.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
