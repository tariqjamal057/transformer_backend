const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all material offered but nomination pending with pagination
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

// Get all nomination done with pagination
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

// Get all inspection done with pagination
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

// Get all di received with pagination
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

// Get all production planning with pagination
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

// Get all new gp transformers with pagination
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

// Get all new gp summary with pagination
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

// Get all supply gp expired statement with pagination
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

// Get all gp extended warranty information with pagination
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
