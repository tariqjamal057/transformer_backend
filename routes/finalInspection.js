const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all final inspections with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const finalInspections = await prisma.finalInspection.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalFinalInspections = await prisma.finalInspection.count();
    res.json({
      data: finalInspections,
      totalPages: Math.ceil(totalFinalInspections / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new final inspection
router.post('/', async (req, res) => {
  try {
    const newFinalInspection = await prisma.finalInspection.create({
      data: req.body,
    });
    res.status(201).json(newFinalInspection);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
