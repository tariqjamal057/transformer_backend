const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Offer Letter and Sealing Statements
 *   description: Offer Letter and Sealing Statement management
 */

/**
 * @swagger
 * /offer-letter-and-sealing-statements:
 *   get:
 *     summary: Retrieve a list of offer letter and sealing statements with pagination
 *     tags: [Offer Letter and Sealing Statements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of items to return
 *     responses:
 *       200:
 *         description: A list of offer letter and sealing statements.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OfferLetterAndSealingStatement'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
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

/**
 * @swagger
 * /offer-letter-and-sealing-statements:
 *   post:
 *     summary: Create a new offer letter and sealing statement
 *     tags: [Offer Letter and Sealing Statements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OfferLetterAndSealingStatement'
 *     responses:
 *       201:
 *         description: The offer letter and sealing statement was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OfferLetterAndSealingStatement'
 *       500:
 *         description: Something went wrong
 */
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
