const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all damaged transformers with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const damagedTransformers = await prisma.damagedTransformer.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalDamagedTransformers = await prisma.damagedTransformer.count();
    res.json({
      data: damagedTransformers,
      totalPages: Math.ceil(totalDamagedTransformers / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new damaged transformer
router.post('/', async (req, res) => {
  try {
    const newDamagedTransformer = await prisma.damagedTransformer.create({
      data: req.body,
    });
    res.status(201).json(newDamagedTransformer);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
