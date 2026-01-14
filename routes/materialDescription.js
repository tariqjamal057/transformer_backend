const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { paginate } = require('../utils/pagination');
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ storage: multer.memoryStorage() });
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Material Descriptions
 *   description: Material Description management
 */

/**
 * @swagger
 * /material-descriptions:
 *   get:
 *     summary: Retrieve a list of material descriptions with pagination
 *     tags: [Material Descriptions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number
 *     responses:
 *       200:
 *         description: A list of material descriptions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaterialDescription'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  try {
    const { all, page = 1, search = '' } = req.query;

    if (all === 'true') {
      const materialDescriptions = await prisma.materialDescription.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.json(materialDescriptions);
    }

    const pageSize = 10;
    const materialDescriptions = await prisma.materialDescription.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    const paginatedData = paginate(materialDescriptions, page, pageSize);
    res.json(paginatedData);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const requiredFields = ['name', 'phase', 'rating', 'wound', 'description'];
    for (const item of data) {
      for (const field of requiredFields) {
        if (item[field] === undefined || item[field] === null) {
          return res.status(400).json({ error: `Missing required field "${field}" in one of the rows.` });
        }
      }
    }

    const createdDescriptions = await prisma.materialDescription.createMany({
      data: data,
      skipDuplicates: true,
    });

    res.status(201).json({ message: 'Bulk upload successful', createdDescriptions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /material-descriptions:
 *   post:
 *     summary: Create a new material description
 *     tags: [Material Descriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialDescription'
 *     responses:
 *       201:
 *         description: The material description was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaterialDescription'
 *       500:
 *         description: Something went wrong
 */
router.post('/', async (req, res) => {
  try {
    const newMaterialDescription = await prisma.materialDescription.create({
      data: req.body,
    });
    res.status(201).json(newMaterialDescription);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /material-descriptions/{id}:
 *   put:
 *     summary: Update a material description
 *     tags: [Material Descriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The material description ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phase:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: The material description was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaterialDescription'
 *       500:
 *         description: Something went wrong
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phase, description } = req.body;
  try {
    const updatedMaterialDescription = await prisma.materialDescription.update({
      where: { id },
      data: { name, phase, description },
    });
    res.json(updatedMaterialDescription);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /material-descriptions/{id}:
 *   delete:
 *     summary: Delete a material description
 *     tags: [Material Descriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The material description ID
 *     responses:
 *       204:
 *         description: The material description was deleted
 *       500:
 *         description: Something went wrong
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.materialDescription.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
