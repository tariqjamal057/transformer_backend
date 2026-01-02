const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all offer letter and sealing statements with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const offerLetterAndSealingStatements = await prisma.offerLetterAndSealingStatement.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalOfferLetterAndSealingStatements = await prisma.offerLetterAndSealingStatement.count();
    res.json({
      data: offerLetterAndSealingStatements,
      totalPages: Math.ceil(totalOfferLetterAndSealingStatements / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new offer letter and sealing statement
router.post('/', async (req, res) => {
  try {
    const newOfferLetterAndSealingStatement = await prisma.offerLetterAndSealingStatement.create({
      data: req.body,
    });
    res.status(201).json(newOfferLetterAndSealingStatement);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
