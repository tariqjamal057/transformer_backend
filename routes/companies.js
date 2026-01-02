const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all companies with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const companies = await prisma.company.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalCompanies = await prisma.company.count();
    res.json({
      data: companies,
      totalPages: Math.ceil(totalCompanies / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new company
router.post('/', async (req, res) => {
  try {
    const newCompany = await prisma.company.create({
      data: req.body,
    });
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
