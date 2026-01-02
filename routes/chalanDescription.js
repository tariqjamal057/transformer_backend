const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all chalan descriptions with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const chalanDescriptions = await prisma.chalanDescription.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalChalanDescriptions = await prisma.chalanDescription.count();
    res.json({
      data: chalanDescriptions,
      totalPages: Math.ceil(totalChalanDescriptions / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new chalan description
router.post('/', async (req, res) => {
  try {
    const newChalanDescription = await prisma.chalanDescription.create({
      data: req.body,
    });
    res.status(201).json(newChalanDescription);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
