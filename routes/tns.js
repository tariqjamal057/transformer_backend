const express = require('express');
const { logActivity } = require('../utils/activityLogger');

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
router.get('/', async (req, res) => {
  try {
    const tns = await prisma.TN.findMany();
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
router.get('/:id', async (req, res) => {
  try {
    const tn = await prisma.TN.findUnique({
      where: { id: req.params.id },
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
router.post('/', async (req, res) => {
  try {
    const tn = await prisma.TN.create({
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'TN', tn.id, null, tn);
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
router.put('/:id', async (req, res) => {
  try {
    const existingTn = await prisma.TN.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTn) {
      return res.status(404).json({ error: 'TN not found' });
    }

    const updatedTn = await prisma.TN.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'TN', updatedTn.id, existingTn, updatedTn);
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
router.delete('/:id', async (req, res) => {
  try {
    const existingTn = await prisma.TN.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTn) {
      return res.status(404).json({ error: 'TN not found' });
    }

    await prisma.TN.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'TN', req.params.id, existingTn, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
