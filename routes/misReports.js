const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// G.P. Extended Warranty Information
router.get('/gp-extended-warranty', async (req, res) => {
    res.json([]);
});

// New GP Summary
router.get('/new-gp-summary', async (req, res) => {
    res.json([]);
});

// New GP Transformers
router.get('/new-gp-transformers', async (req, res) => {
    res.json([]);
});

// Production Planning
router.get('/production-planning', async (req, res) => {
    res.json([]);
});

// Supply G.P. Expired Statement
router.get('/supply-gp-expired-statement', async (req, res) => {
    res.json([]);
});

module.exports = router;