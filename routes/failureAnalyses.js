const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Failure Analyses
 *   description: Failure Analysis management
 */

/**
 * @swagger
 * /failure-analyses:
 *   get:
 *     summary: Retrieve a list of all failure analyses
 *     tags: [Failure Analyses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of failure analyses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FailureAnalysis'
 */
router.get('/', async (req, res) => {
  try {
    const failureAnalyses = await prisma.failureAnalysis.findMany();
    res.json(failureAnalyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /failure-analyses/{id}:
 *   get:
 *     summary: Get a failure analysis by ID
 *     tags: [Failure Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The failure analysis ID
 *     responses:
 *       200:
 *         description: The failure analysis description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FailureAnalysis'
 *       404:
 *         description: The failure analysis was not found
 */
router.get('/:id', async (req, res) => {
  try {
    const failureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id: req.params.id },
    });
    if (!failureAnalysis) return res.status(404).json({ error: 'Failure analysis not found' });
    res.json(failureAnalysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /failure-analyses:
 *   post:
 *     summary: Create a new failure analysis
 *     tags: [Failure Analyses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FailureAnalysis'
 *     responses:
 *       201:
 *         description: The failure analysis was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FailureAnalysis'
 *       400:
 *         description: Bad request
 */
router.post('/', async (req, res) => {
  try {
    const failureAnalysis = await prisma.failureAnalysis.create({
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'FailureAnalysis', failureAnalysis.id, null, failureAnalysis);
    res.status(201).json(failureAnalysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /failure-analyses/{id}:
 *   put:
 *     summary: Update a failure analysis
 *     tags: [Failure Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The failure analysis ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FailureAnalysis'
 *     responses:
 *       200:
 *         description: The failure analysis was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FailureAnalysis'
 *       404:
 *         description: The failure analysis was not found
 *       500:
 *         description: Some error happened
 */
router.put('/:id', async (req, res) => {
  try {
    const existingFailureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id: req.params.id },
    });

    if (!existingFailureAnalysis) {
      return res.status(404).json({ error: 'Failure analysis not found' });
    }

    const updatedFailureAnalysis = await prisma.failureAnalysis.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'FailureAnalysis', updatedFailureAnalysis.id, existingFailureAnalysis, updatedFailureAnalysis);
    res.json(updatedFailureAnalysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /failure-analyses/{id}:
 *   delete:
 *     summary: Delete a failure analysis
 *     tags: [Failure Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The failure analysis ID
 *     responses:
 *       204:
 *         description: The failure analysis was deleted
 *       404:
 *         description: The failure analysis was not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const existingFailureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id: req.params.id },
    });

    if (!existingFailureAnalysis) {
      return res.status(404).json({ error: 'Failure analysis not found' });
    }

    await prisma.failureAnalysis.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'FailureAnalysis', req.params.id, existingFailureAnalysis, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
