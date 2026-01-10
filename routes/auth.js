const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Login
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Logs in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loginId:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user was successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Bad request
 */
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    const user = await prisma.user.findUnique({ where: { loginId } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const companies = await prisma.company.findMany();
    const token = jwt.sign({ userId: user.id, role: user.role, pages: user.pages }, process.env.JWT_SECRET);
    res.json({ token, user, companies });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/select-company:
 *   post:
 *     summary: Selects a company and returns a list of supply tenders
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user was successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supplyTenders:
 *                   type: array
 *                   items:
 *                      $ref: '#/components/schemas/SupplyTender'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Bad request
 */
router.post('/select-company', async (req, res) => {
  try {
    const { companyId } = req.body;
    const supplyTenders = await prisma.supplyTender.findMany({ where: { companyId } });
    res.json({ supplyTenders });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/select-supply-tender:
 *   post:
 *     summary: Selects a supply tender and returns a new token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplyTenderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user was successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Bad request
 */
router.post('/select-supply-tender', async (req, res) => {
    try {
        const { supplyTenderId } = req.body;
        const { userId, role, pages } = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        const token = jwt.sign({ userId, role, pages, supplyTenderId }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


module.exports = router;
