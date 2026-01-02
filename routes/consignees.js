const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Consignees
 *   description: Consignee management
 */

/**
 * @swagger
 * /consignees:
 *   get:
 *     summary: Retrieve a list of all consignees
 *     tags: [Consignees]
 *     responses:
 *       200:
 *         description: A list of consignees.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Consignee'
 */
router.get('/', async (req, res) => {
  try {
    const consignees = await prisma.consignee.findMany({
      include: {
        finalInspectionConsignees: true,
        deliveryChallans: true,
      },
    });
    res.json(consignees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /consignees/{id}:
 *   get:
 *     summary: Get a consignee by ID
 *     tags: [Consignees]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The consignee ID
 *     responses:
 *       200:
 *         description: The consignee description by ID
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Consignee'
 *       404:
 *         description: The consignee was not found
 */
router.get('/:id', async (req, res) => {
  try {
    const consignee = await prisma.consignee.findUnique({
      where: { id: req.params.id },
      include: {
        finalInspectionConsignees: true,
        deliveryChallans: true,
      },
    });
    if (!consignee) return res.status(404).json({ error: 'Consignee not found' });
    res.json(consignee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /consignees:
 *   post:
 *     summary: Create a new consignee
 *     tags: [Consignees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Consignee'
 *     responses:
 *       201:
 *         description: The consignee was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Consignee'
 *       400:
 *         description: Bad request
 */
router.post('/', async (req, res) => {
  try {
    const consignee = await prisma.consignee.create({
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'Consignee', consignee.id, null, consignee);
    res.status(201).json(consignee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /consignees/{id}:
 *   put:
 *     summary: Update a consignee
 *     tags: [Consignees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The consignee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Consignee'
 *     responses:
 *       200:
 *         description: The consignee was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Consignee'
 *       404:
 *         description: The consignee was not found
 *       500:
 *         description: Some error happened
 */
router.put('/:id', async (req, res) => {
  try {
    const existingConsignee = await prisma.consignee.findUnique({
      where: { id: req.params.id },
    });

    if (!existingConsignee) {
      return res.status(404).json({ error: 'Consignee not found' });
    }

    const updatedConsignee = await prisma.consignee.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'Consignee', updatedConsignee.id, existingConsignee, updatedConsignee);
    res.json(updatedConsignee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /consignees/{id}:
 *   delete:
 *     summary: Delete a consignee
 *     tags: [Consignees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The consignee ID
 *     responses:
 *       204:
 *         description: The consignee was deleted
 *       404:
 *         description: The consignee was not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const existingConsignee = await prisma.consignee.findUnique({
      where: { id: req.params.id },
    });

    if (!existingConsignee) {
      return res.status(404).json({ error: 'Consignee not found' });
    }

    await prisma.consignee.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'Consignee', req.params.id, existingConsignee, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
