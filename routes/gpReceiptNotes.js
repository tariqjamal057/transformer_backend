const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: GP Receipt Notes
 *   description: GP Receipt Note management
 */

/**
 * @swagger
 * /gp-receipt-notes:
 *   get:
 *     summary: Retrieve a list of all GP receipt notes
 *     tags: [GP Receipt Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of GP receipt notes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GPReceiptNote'
 */
router.get('/', async (req, res) => {
  try {
    const gpReceiptNotes = await prisma.gpReceiptNote.findMany();
    res.json(gpReceiptNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-receipt-notes/{id}:
 *   get:
 *     summary: Get a GP receipt note by ID
 *     tags: [GP Receipt Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The GP receipt note ID
 *     responses:
 *       200:
 *         description: The GP receipt note description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPReceiptNote'
 *       404:
 *         description: The GP receipt note was not found
 */
router.get('/:id', async (req, res) => {
  try {
    const gpReceiptNote = await prisma.gpReceiptNote.findUnique({
      where: { id: req.params.id },
    });
    if (!gpReceiptNote) return res.status(404).json({ error: 'GP receipt note not found' });
    res.json(gpReceiptNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-receipt-notes:
 *   post:
 *     summary: Create a new GP receipt note
 *     tags: [GP Receipt Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GPReceiptNote'
 *     responses:
 *       201:
 *         description: The GP receipt note was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPReceiptNote'
 *       400:
 *         description: Bad request
 */
router.post('/', async (req, res) => {
  try {
    const gpReceiptNote = await prisma.gpReceiptNote.create({
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'GPReceiptNote', gpReceiptNote.id, null, gpReceiptNote);
    res.status(201).json(gpReceiptNote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-receipt-notes/{id}:
 *   put:
 *     summary: Update a GP receipt note
 *     tags: [GP Receipt Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The GP receipt note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GPReceiptNote'
 *     responses:
 *       200:
 *         description: The GP receipt note was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPReceiptNote'
 *       404:
 *         description: The GP receipt note was not found
 *       500:
 *         description: Some error happened
 */
router.put('/:id', async (req, res) => {
  try {
    const existingGpReceiptNote = await prisma.gpReceiptNote.findUnique({
      where: { id: req.params.id },
    });

    if (!existingGpReceiptNote) {
      return res.status(404).json({ error: 'GP receipt note not found' });
    }

    const updatedGpReceiptNote = await prisma.gpReceiptNote.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'GPReceiptNote', updatedGpReceiptNote.id, existingGpReceiptNote, updatedGpReceiptNote);
    res.json(updatedGpReceiptNote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-receipt-notes/{id}:
 *   delete:
 *     summary: Delete a GP receipt note
 *     tags: [GP Receipt Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The GP receipt note ID
 *     responses:
 *       204:
 *         description: The GP receipt note was deleted
 *       404:
 *         description: The GP receipt note was not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const existingGpReceiptNote = await prisma.gpReceiptNote.findUnique({
      where: { id: req.params.id },
    });

    if (!existingGpReceiptNote) {
      return res.status(404).json({ error: 'GP receipt note not found' });
    }

    await prisma.gpReceiptNote.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'GPReceiptNote', req.params.id, existingGpReceiptNote, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
