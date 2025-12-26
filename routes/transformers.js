const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

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
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'Transformer', transformer.id, null, transformer);
    res.status(201).json(transformer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update transformer
router.put('/:id', async (req, res) => {
  try {
    const existingTransformer = await prisma.transformer.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTransformer) {
      return res.status(404).json({ error: 'Transformer not found' });
    }

    const updatedTransformer = await prisma.transformer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'Transformer', updatedTransformer.id, existingTransformer, updatedTransformer);
    res.json(updatedTransformer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transformer
router.delete('/:id', async (req, res) => {
  try {
    const existingTransformer = await prisma.transformer.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTransformer) {
      return res.status(404).json({ error: 'Transformer not found' });
    }

    await prisma.transformer.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'Transformer', req.params.id, existingTransformer, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
