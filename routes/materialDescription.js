const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all material descriptions with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const materialDescriptions = await prisma.materialDescription.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalMaterialDescriptions = await prisma.materialDescription.count();
    res.json({
      data: materialDescriptions,
      totalPages: Math.ceil(totalMaterialDescriptions / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new material description
router.post('/', async (req, res) => {
  try {
    const newMaterialDescription = await prisma.materialDescription.create({
      data: req.body,
    });
    res.status(201).json(newMaterialDescription);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
