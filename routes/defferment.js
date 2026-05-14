const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, isOwner } = require('../middleware/auth');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Defferments
 *   description: Defferment management
 */

/**
 * @swagger
 * /defferments:
 *   get:
 *     summary: Retrieve a list of defferments with pagination
 *     tags: [Defferments]
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
 *         description: A list of defferments.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Defferment'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, supplyTenderId } = req.query;
  try {
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const defferments = await prisma.defferment.findMany({
      where: { supplyTenderId: supplyTenderId },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalDefferments = await prisma.defferment.count({
      where: { supplyTenderId: supplyTenderId },
    });
    res.json({
      data: defferments,
      totalPages: Math.ceil(totalDefferments / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /defferments:
 *   post:
 *     summary: Create a new defferment
 *     tags: [Defferments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Defferment'
 *     responses:
 *       201:
 *         description: The defferment was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Defferment'
 *       500:
 *         description: Something went wrong
 */
router.post('/', auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.body;
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const newDefferment = await prisma.defferment.create({
      data: { ...req.body, supplyTenderId },
    });
    res.status(201).json(newDefferment);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /defferments/{id}:
 *   delete:
 *     summary: Delete a defferment
 *     tags: [Defferments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The defferment ID
 *     responses:
 *       204:
 *         description: The defferment was deleted
 *       404:
 *         description: The defferment was not found
 */
router.delete("/:id", auth, isOwner, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.defferment.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Defferment not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
