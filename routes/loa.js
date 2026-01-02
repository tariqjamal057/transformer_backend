const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all loas with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const loas = await prisma.lOA.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalLoas = await prisma.lOA.count();
    res.json({
      data: loas,
      totalPages: Math.ceil(totalLoas / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new loa
router.post('/', async (req, res) => {
  try {
    const newLoa = await prisma.lOA.create({
      data: req.body,
    });
    res.status(201).json(newLoa);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
