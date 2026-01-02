const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all supply tenders with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const supplyTenders = await prisma.supplyTender.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalSupplyTenders = await prisma.supplyTender.count();
    res.json({
      data: supplyTenders,
      totalPages: Math.ceil(totalSupplyTenders / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new supply tender
router.post('/', async (req, res) => {
  try {
    const newSupplyTender = await prisma.supplyTender.create({
      data: req.body,
    });
    res.status(201).json(newSupplyTender);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});



// Update a supply tender
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const supplyTender = await prisma.supplyTender.findUnique({
      where: { id },
    });

    if (!supplyTender) {
      return res.status(404).json({ error: 'Supply tender not found' });
    }

    const updatedSupplyTender = await prisma.supplyTender.update({
      where: { id },
      data: req.body,
    });

    res.json(updatedSupplyTender);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Delete a supply tender
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const supplyTender = await prisma.supplyTender.findUnique({
      where: { id },
    });

    if (!supplyTender) {
      return res.status(404).json({ error: 'Supply tender not found' });
    }

    await prisma.supplyTender.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});


module.exports = router;
