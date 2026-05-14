const express = require('express');
const { logActivity } = require('../utils/activityLogger');
const { auth, isOwner } = require('../middleware/auth');

const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: TNs
 *   description: TN management
 */

/**
 * @swagger
 * /tns:
 *   get:
 *     summary: Retrieve a list of all TNs
 *     tags: [TNs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of TNs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TN'
 */
router.get('/', auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const tns = await prisma.TN.findMany({
      where: { supplyTenderId: supplyTenderId },
    });
    res.json(tns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /tns/{id}:
 *   get:
 *     summary: Get a TN by ID
 *     tags: [TNs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The TN ID
 *     responses:
 *       200:
 *         description: The TN description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TN'
 *       404:
 *         description: The TN was not found
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const tn = await prisma.TN.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });
    if (!tn) return res.status(404).json({ error: 'TN not found' });
    res.json(tn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /tns:
 *   post:
 *     summary: Create a new TN
 *     tags: [TNs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TN'
 *     responses:
 *       201:
 *         description: The TN was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TN'
 *       400:
 *         description: Bad request
 */
router.post('/', auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.body;
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const tn = await prisma.TN.create({
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(req.user.userId, 'CREATE', 'TN', tn.id, null, tn);
    res.status(201).json(tn);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /tns/{id}:
 *   put:
 *     summary: Update a TN
 *     tags: [TNs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The TN ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TN'
 *     responses:
 *       200:
 *         description: The TN was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TN'
 *       404:
 *         description: The TN was not found
 *       500:
 *         description: Some error happened
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.body;
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const existingTn = await prisma.TN.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (!existingTn) {
      return res.status(404).json({ error: 'TN not found or does not belong to the specified supplyTenderId' });
    }

    const updatedTn = await prisma.TN.update({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(req.user.userId, 'UPDATE', 'TN', updatedTn.id, existingTn, updatedTn);
    res.json(updatedTn);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /tns/{id}:
 *   delete:
 *     summary: Delete a TN
 *     tags: [TNs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The TN ID
 *     responses:
 *       204:
 *         description: The TN was deleted
 *       404:
 *         description: The TN was not found
 */
router.delete('/:id', auth, isOwner, async (req, res) => {
  try {
    const { supplyTenderId } = req.query; // Assuming supplyTenderId is passed as a query parameter for deletion
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const existingTn = await prisma.TN.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (!existingTn) {
      return res.status(404).json({ error: 'TN not found or does not belong to the specified supplyTenderId' });
    }

    await prisma.TN.delete({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });
    await logActivity(req.user.userId, 'DELETE', 'TN', req.params.id, existingTn, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
