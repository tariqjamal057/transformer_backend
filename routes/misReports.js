const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');
const { paginate } = require('../utils/pagination');
const { logActivity } = require('../utils/activityLogger');

// G.P. Extended Warranty Information
router.get('/gp-extended-warranty', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, supplyTenderId } = req.query;

        if (!supplyTenderId) {
            return res.status(400).json({ error: 'supplyTenderId is required' });
        }

        const where = { supplyTenderId: supplyTenderId };
        const totalItems = await prisma.gPExtendedWarrantyInformation.count({ where });
        const items = await prisma.gPExtendedWarrantyInformation.findMany({
            where,
            skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            take: parseInt(limit, 10),
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            items,
            totalPages: Math.ceil(totalItems / parseInt(limit, 10)),
            currentPage: parseInt(page, 10),
            totalItems,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New GP Summary
router.get('/new-gp-summary', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, supplyTenderId } = req.query;

        if (!supplyTenderId) {
            return res.status(400).json({ error: 'supplyTenderId is required' });
        }

        const where = { supplyTenderId: supplyTenderId };
        const totalItems = await prisma.newGPSummary.count({ where });
        const items = await prisma.newGPSummary.findMany({
            where,
            skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            take: parseInt(limit, 10),
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            items,
            totalPages: Math.ceil(totalItems / parseInt(limit, 10)),
            currentPage: parseInt(page, 10),
            totalItems,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New GP Transformers
router.get('/new-gp-transformers', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, supplyTenderId } = req.query;

        if (!supplyTenderId) {
            return res.status(400).json({ error: 'supplyTenderId is required' });
        }

        const where = { supplyTenderId: supplyTenderId };
        const totalItems = await prisma.newGPTransformer.count({ where });
        const items = await prisma.newGPTransformer.findMany({
            where,
            skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            take: parseInt(limit, 10),
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            items,
            totalPages: Math.ceil(totalItems / parseInt(limit, 10)),
            currentPage: parseInt(page, 10),
            totalItems,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Production Planning
router.get('/production-planning', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, supplyTenderId } = req.query;

        if (!supplyTenderId) {
            return res.status(400).json({ error: 'supplyTenderId is required' });
        }

        const where = { supplyTenderId: supplyTenderId };
        const totalItems = await prisma.productionPlanning.count({ where });
        const items = await prisma.productionPlanning.findMany({
            where,
            skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            take: parseInt(limit, 10),
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            items,
            totalPages: Math.ceil(totalItems / parseInt(limit, 10)),
            currentPage: parseInt(page, 10),
            totalItems,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Supply G.P. Expired Statement
router.get('/supply-gp-expired-statement', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, supplyTenderId } = req.query;

        if (!supplyTenderId) {
            return res.status(400).json({ error: 'supplyTenderId is required' });
        }

        const where = { supplyTenderId: supplyTenderId };
        const totalItems = await prisma.supplyGPExpiredStatement.count({ where });
        const items = await prisma.supplyGPExpiredStatement.findMany({
            where,
            skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            take: parseInt(limit, 10),
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            items,
            totalPages: Math.ceil(totalItems / parseInt(limit, 10)),
            currentPage: parseInt(page, 10),
            totalItems,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;