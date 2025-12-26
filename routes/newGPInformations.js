const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all New GP Informations
router.get('/', async (req, res) => {
  try {
    const newGPInformations = await prisma.newGPInformation.findMany();
    res.json(newGPInformations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get New GP Information by ID
router.get('/:id', async (req, res) => {
  try {
    const newGPInformation = await prisma.newGPInformation.findUnique({
      where: { id: req.params.id },
    });
    if (!newGPInformation) return res.status(404).json({ error: 'New GP Information not found' });
    res.json(newGPInformation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create New GP Information
router.post('/', async (req, res) => {
  try {
    const newGPInformation = await prisma.newGPInformation.create({
      data: req.body,
    });
    res.status(201).json(newGPInformation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update New GP Information
router.put('/:id', async (req, res) => {
  try {
    const newGPInformation = await prisma.newGPInformation.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(newGPInformation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete New GP Information
router.delete('/:id', async (req, res) => {
  try {
    await prisma.newGPInformation.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
