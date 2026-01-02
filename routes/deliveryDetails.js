const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all delivery details with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const deliveryDetails = await prisma.deliveryDetail.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalDeliveryDetails = await prisma.deliveryDetail.count();
    res.json({
      data: deliveryDetails,
      totalPages: Math.ceil(totalDeliveryDetails / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new delivery detail
router.post('/', async (req, res) => {
  try {
    const newDeliveryDetail = await prisma.deliveryDetail.create({
      data: req.body,
    });
    res.status(201).json(newDeliveryDetail);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
