const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all new gp receipt records with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const newGPReceiptRecords = await prisma.newGPReceiptRecord.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalNewGPReceiptRecords = await prisma.newGPReceiptRecord.count();
    res.json({
      data: newGPReceiptRecords,
      totalPages: Math.ceil(totalNewGPReceiptRecords / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new new gp receipt record
router.post('/', async (req, res) => {
  try {
    const newNewGPReceiptRecord = await prisma.newGPReceiptRecord.create({
      data: req.body,
    });
    res.status(201).json(newNewGPReceiptRecord);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
