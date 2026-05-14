const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');
const { auth, isOwner } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Transformers
 *   description: Transformer management
 */

/**
 * @swagger
 * /transformers:
 *   get:
 *     summary: Retrieve a list of all transformers
 *     tags: [Transformers]
 *     responses:
 *       200:
 *         description: A list of transformers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transformer'
 */
router.get('/', auth, async (req, res) => {
  try {
    const transformers = await prisma.transformer.findMany({
      include: { finalInspections: true },
    });
    res.json(transformers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /transformers/{id}:
 *   get:
 *     summary: Get a transformer by ID
 *     tags: [Transformers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The transformer ID
 *     responses:
 *       200:
 *         description: The transformer description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transformer'
 *       404:
 *         description: The transformer was not found
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const transformer = await prisma.transformer.findUnique({
      where: { id: req.params.id },
      include: { finalInspections: true },
    });
    if (!transformer) return res.status(404).json({ error: 'Transformer not found' });
    res.json(transformer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /transformers:
 *   post:
 *     summary: Create a new transformer
 *     tags: [Transformers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transformer'
 *     responses:
 *       201:
 *         description: The transformer was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transformer'
 *       400:
 *         description: Bad request
 */
router.post('/', auth, async (req, res) => {
  try {
    const transformer = await prisma.transformer.create({
      data: req.body,
    });
    await logActivity(req.user.userId, 'CREATE', 'Transformer', transformer.id, null, transformer);
    res.status(201).json(transformer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /transformers/{id}:
 *   put:
 *     summary: Update a transformer
 *     tags: [Transformers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The transformer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transformer'
 *     responses:
 *       200:
 *         description: The transformer was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transformer'
 *       404:
 *         description: The transformer was not found
 *       500:
 *         description: Some error happened
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const existingTransformer = await prisma.transformer.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTransformer) {
      return res.status(404).json({ error: 'Transformer not found' });
    }

    const updatedTransformer = await prisma.transformer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, 'UPDATE', 'Transformer', updatedTransformer.id, existingTransformer, updatedTransformer);
    res.json(updatedTransformer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /transformers/{id}:
 *   delete:
 *     summary: Delete a transformer
 *     tags: [Transformers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The transformer ID
 *     responses:
 *       204:
 *         description: The transformer was deleted
 *       404:
 *         description: The transformer was not found
 */
router.delete('/:id', auth, isOwner, async (req, res) => {
  try {
    const existingTransformer = await prisma.transformer.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTransformer) {
      return res.status(404).json({ error: 'Transformer not found' });
    }

    await prisma.transformer.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, 'DELETE', 'Transformer', req.params.id, existingTransformer, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
