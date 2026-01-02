const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all defferments with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const defferments = await prisma.defferment.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalDefferments = await prisma.defferment.count();
    res.json({
      data: defferments,
      totalPages: Math.ceil(totalDefferments / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new defferment
router.post('/', async (req, res) => {
  try {
    const newDefferment = await prisma.defferment.create({
      data: req.body,
    });
    res.status(201).json(newDefferment);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
