const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: MIS Reports
 *   description: Management Information System Reports
 */

/**
 * @swagger
 * /mis-reports/material-offered-but-nomination-pending:
 *   get:
 *     summary: Retrieve a list of material offered but nomination pending
 *     tags: [MIS Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of material offered but nomination pending.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaterialOfferedButNominationPending'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/material-offered-but-nomination-pending', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const data = await prisma.materialOfferedButNominationPending.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.materialOfferedButNominationPending.count();
        res.json({
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

/**
 * @swagger
 * /mis-reports/nomination-done:
 *   get:
 *     summary: Retrieve a list of nomination done
 *     tags: [MIS Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of nomination done.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NominationDone'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/nomination-done', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const data = await prisma.nominationDone.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.nominationDone.count();
        res.json({
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

/**
 * @swagger
 * /mis-reports/inspection-done:
 *   get:
 *     summary: Retrieve a list of inspection done
 *     tags: [MIS Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of inspection done.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InspectionDone'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/inspection-done', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const data = await prisma.inspectionDone.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.inspectionDone.count();
        res.json({
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

/**
 * @swagger
 * /mis-reports/di-received:
 *   get:
 *     summary: Retrieve a list of DI received
 *     tags: [MIS Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of DI received.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DIReceived'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/di-received', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const data = await prisma.diReceived.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.diReceived.count();
        res.json({
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

/**
 * @swagger
 * /mis-reports/production-planning:
 *   get:
 *     summary: Retrieve a list of production planning
 *     tags: [MIS Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of production planning.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductionPlanning'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/production-planning', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const data = await prisma.productionPlanning.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.productionPlanning.count();
        res.json({
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

/**
 * @swagger
 * /mis-reports/new-gp-transformers:
 *   get:
 *     summary: Retrieve a list of new GP transformers
 *     tags: [MIS Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of new GP transformers.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NewGPTransformer'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/new-gp-transformers', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const data = await prisma.newGPTransformer.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.newGPTransformer.count();
        res.json({
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

/**
 * @swagger
 * /mis-reports/new-gp-summary:
 *   get:
 *     summary: Retrieve a list of new GP summaries
 *     tags: [MIS Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of new GP summaries.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NewGPSummary'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/new-gp-summary', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const data = await prisma.newGPSummary.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.newGPSummary.count();
        res.json({
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

/**
 * @swagger
 * /mis-reports/supply-gp-expired-statement:
 *   get:
 *     summary: Retrieve a list of supply GP expired statements
 *     tags: [MIS Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of supply GP expired statements.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupplyGPExpiredStatement'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/supply-gp-expired-statement', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const data = await prisma.supplyGPExpiredStatement.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.supplyGPExpiredStatement.count();
        res.json({
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

/**
 * @swagger
 * /mis-reports/gp-extended-warranty-information:
 *   get:
 *     summary: Retrieve a list of GP extended warranty information
 *     tags: [MIS Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of GP extended warranty information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GPExtendedWarrantyInformation'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/gp-extended-warranty-information', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const data = await prisma.gPExtendedWarrantyInformation.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.gPExtendedWarrantyInformation.count();
        res.json({
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

module.exports = router;
