const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

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
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'TN', tn.id, null, tn);
    res.status(201).json(tn);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update TN
router.put('/:id', async (req, res) => {
  try {
    const existingTn = await prisma.tn.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTn) {
      return res.status(404).json({ error: 'TN not found' });
    }

    const updatedTn = await prisma.tn.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'TN', updatedTn.id, existingTn, updatedTn);
    res.json(updatedTn);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete TN
router.delete('/:id', async (req, res) => {
  try {
    const existingTn = await prisma.tn.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTn) {
      return res.status(404).json({ error: 'TN not found' });
    }

    await prisma.tn.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'TN', req.params.id, existingTn, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
