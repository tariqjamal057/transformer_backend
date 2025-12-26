const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all GP receipt notes
router.get('/', async (req, res) => {
  try {
    const gpReceiptNotes = await prisma.gpReceiptNote.findMany();
    res.json(gpReceiptNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get GP receipt note by ID
router.get('/:id', async (req, res) => {
  try {
    const gpReceiptNote = await prisma.gpReceiptNote.findUnique({
      where: { id: req.params.id },
    });
    if (!gpReceiptNote) return res.status(404).json({ error: 'GP receipt note not found' });
    res.json(gpReceiptNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create GP receipt note
router.post('/', async (req, res) => {
  try {
    const gpReceiptNote = await prisma.gpReceiptNote.create({
      data: req.body,
    });
    res.status(201).json(gpReceiptNote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update GP receipt note
router.put('/:id', async (req, res) => {
  try {
    const gpReceiptNote = await prisma.gpReceiptNote.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(gpReceiptNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete GP receipt note
router.delete('/:id', async (req, res) => {
  try {
    await prisma.gpReceiptNote.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
