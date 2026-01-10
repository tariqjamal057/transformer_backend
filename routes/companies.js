const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management
 */

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Retrieve a list of companies with pagination
 *     tags: [Companies]
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
 *         description: A list of companies.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const companies = await prisma.company.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalCompanies = await prisma.company.count();
    res.json({
      data: companies,
      totalPages: Math.ceil(totalCompanies / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Retrieve a single company by ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The company ID
 *     responses:
 *       200:
 *         description: A single company.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found
 *       500:
 *         description: Something went wrong
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const company = await prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});


/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: The company was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       500:
 *         description: Something went wrong
 */
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const { name, address, phone, gstNo, email } = req.body;
    const logo = req.file ? req.file.path : null;

    const newCompany = await prisma.company.create({
      data: {
        name,
        address,
        phone,
        gstNo,
        email,
        logo
      },
    });
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update a company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The company ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: The company was successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found
 *       500:
 *         description: Something went wrong
 */
router.put('/:id', upload.single('logo'), async (req, res) => {
  const { id } = req.params;
  try {
    const { name, address, phone, gstNo, email } = req.body;
    const logo = req.file ? req.file.path : undefined;

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        gstNo,
        email,
        logo
      },
    });
    res.json(updatedCompany);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Delete a company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The company ID
 *     responses:
 *       204:
 *         description: The company was successfully deleted
 *       404:
 *         description: Company not found
 *       500:
 *         description: Something went wrong
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.company.delete({
      where: { id },
    });
    res.status(204).send();
  }
  catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
});


module.exports = router;
