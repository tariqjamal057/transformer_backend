const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: GP Failures
 *   description: GP Failure management
 */

/**
 * @swagger
 * /gp-failures:
 *   get:
 *     summary: Retrieve a list of all GP failures
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of GP failures.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GPFailure'
 */
router.get('/', async (req, res) => {
  try {
    const gpFailures = await prisma.gpFailure.findMany({
      include: { deliveryChallan: true },
    });
    res.json(gpFailures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-failures/{id}:
 *   get:
 *     summary: Get a GP failure by ID
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The GP failure ID
 *     responses:
 *       200:
 *         description: The GP failure description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPFailure'
 *       404:
 *         description: The GP failure was not found
 */
router.get('/:id', async (req, res) => {
  try {
    const gpFailure = await prisma.gpFailure.findUnique({
      where: { id: req.params.id },
      include: { deliveryChallan: true },
    });
    if (!gpFailure) return res.status(404).json({ error: 'GP failure not found' });
    res.json(gpFailure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-failures:
 *   post:
 *     summary: Create a new GP failure
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GPFailure'
 *     responses:
 *       201:
 *         description: The GP failure was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPFailure'
 *       400:
 *         description: Bad request
 */
router.post('/', async (req, res) => {
  try {
    const gpFailure = await prisma.gpFailure.create({
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'GPFailure', gpFailure.id, null, gpFailure);
    res.status(201).json(gpFailure);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-failures/{id}:
 *   put:
 *     summary: Update a GP failure
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The GP failure ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GPFailure'
 *     responses:
 *       200:
 *         description: The GP failure was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPFailure'
 *       404:
 *         description: The GP failure was not found
 *       500:
 *         description: Some error happened
 */
router.put('/:id', async (req, res) => {
  try {
    const existingGpFailure = await prisma.gpFailure.findUnique({
      where: { id: req.params.id },
    });

    if (!existingGpFailure) {
      return res.status(404).json({ error: 'GP failure not found' });
    }

    const updatedGpFailure = await prisma.gpFailure.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'GPFailure', updatedGpFailure.id, existingGpFailure, updatedGpFailure);
    res.json(updatedGpFailure);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /gp-failures/{id}:
 *   delete:
 *     summary: Delete a GP failure
 *     tags: [GP Failures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The GP failure ID
 *     responses:
 *       204:
 *         description: The GP failure was deleted
 *       404:
 *         description: The GP failure was not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const existingGpFailure = await prisma.gpFailure.findUnique({
      where: { id: req.params.id },
    });

    if (!existingGpFailure) {
      return res.status(404).json({ error: 'GP failure not found' });
    }

    await prisma.gpFailure.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'GPFailure', req.params.id, existingGpFailure, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
