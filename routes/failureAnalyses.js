const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { logActivity } = require("../utils/activityLogger");
const { paginate } = require("../utils/pagination");
const multer = require("multer");
const xlsx = require("xlsx");

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Get all Failure Analyses with pagination and search
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 10;
    const searchQuery = req.query.search || "";

    const where = {
      OR: [
        ...(searchQuery
          ? [
              { acosName: { contains: searchQuery, mode: "insensitive" } },
              {
                reasonOfFailure: { contains: searchQuery, mode: "insensitive" },
              },
              {
                newGPReceiptRecord: {
                  sinNo: { contains: searchQuery, mode: "insensitive" },
                },
              },
            ]
          : []),
      ],
    };

    const totalItems = await prisma.failureAnalysis.count({ where });
    const failureAnalyses = await prisma.failureAnalysis.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        newGPReceiptRecord: {
          include: {
            gpReceiptNote: true,
            deliveryChallan: {
              include: {
                finalInspection: {
                  include: {
                    deliverySchedule: true,
                  },
                },
                materialDescription: true,
              },
            },
          },
        },
        gpFailure: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      data: failureAnalyses,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
      totalItems: totalItems,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a failure analysis by ID
router.get("/:id", async (req, res) => {
  try {
    const failureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id: req.params.id },
      include: {
        newGPReceiptRecord: {
          include: {
            gpReceiptNote: true,
            deliveryChallan: {
              include: {
                finalInspection: {
                  include: {
                    deliverySchedule: true,
                  },
                },
                materialDescription: true,
              },
            },
          },
        },
        gpFailure: true,
      },
    });
    if (!failureAnalysis)
      return res.status(404).json({ error: "Failure analysis not found" });
    res.json(failureAnalysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new failure analysis
router.post("/", async (req, res) => {
  try {
    const { acosName, reasonOfFailure, newGPReceiptRecordId, gpFailureId } =
      req.body;

    // Validate if the newGPReceiptRecordId exists
    const newGPReceiptRecord = await prisma.newGPReceiptRecord.findUnique({
      where: { id: newGPReceiptRecordId },
    });
    if (!newGPReceiptRecord) {
      return res.status(404).json({ error: "New GP Receipt Record not found" });
    }

    // Validate if the gpFailureId exists
    const gpFailure = await prisma.gPFailure.findUnique({
      where: { id: gpFailureId },
    });
    if (!gpFailure) {
      return res.status(404).json({ error: "GP Failure Record not found" });
    }

    const failureAnalysis = await prisma.failureAnalysis.create({
      data: {
        acosName,
        reasonOfFailure,
        newGPReceiptRecordId,
        gpFailureId,
      },
    });
    await logActivity(
      req.user.userId,
      req.user.name,
      "CREATE",
      "FailureAnalysis",
      failureAnalysis.id,
      null,
      failureAnalysis
    );
    res.status(201).json(failureAnalysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a failure analysis
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { acosName, reasonOfFailure, newGPReceiptRecordId, gpFailureId } =
      req.body;

    const existingFailureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id },
    });

    if (!existingFailureAnalysis) {
      return res.status(404).json({ error: "Failure analysis not found" });
    }

    // Validate if the newGPReceiptRecordId exists
    if (newGPReceiptRecordId) {
      const newGPReceiptRecord = await prisma.newGPReceiptRecord.findUnique({
        where: { id: newGPReceiptRecordId },
      });
      if (!newGPReceiptRecord) {
        return res
          .status(404)
          .json({ error: "New GP Receipt Record not found" });
      }
    }

    // Validate if the gpFailureId exists
    if (gpFailureId) {
      const gpFailure = await prisma.gPFailure.findUnique({
        where: { id: gpFailureId },
      });
      if (!gpFailure) {
        return res.status(404).json({ error: "GP Failure Record not found" });
      }
    }

    const updatedFailureAnalysis = await prisma.failureAnalysis.update({
      where: { id },
      data: {
        acosName,
        reasonOfFailure,
        newGPReceiptRecordId,
        gpFailureId,
      },
    });
    await logActivity(
      req.user.userId,
      req.user.name,
      "UPDATE",
      "FailureAnalysis",
      updatedFailureAnalysis.id,
      existingFailureAnalysis,
      updatedFailureAnalysis
    );
    res.json(updatedFailureAnalysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk upload Failure Analyses
router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const createdAnalyses = [];
    for (const item of data) {
      // Validate if the newGPReceiptRecordId exists
      const newGPReceiptRecord = await prisma.newGPReceiptRecord.findUnique({
        where: { id: item.newGPReceiptRecordId },
      });
      if (!newGPReceiptRecord) {
        console.warn(
          `Skipping row due to New GP Receipt Record not found: ${item.newGPReceiptRecordId}`
        );
        continue;
      }

      // Validate if the gpFailureId exists
      const gpFailure = await prisma.gpFailure.findUnique({
        where: { id: item.gpFailureId },
      });
      if (!gpFailure) {
        console.warn(
          `Skipping row due to GP Failure Record not found: ${item.gpFailureId}`
        );
        continue;
      }

      const analysis = await prisma.failureAnalysis.create({
        data: {
          acosName: item.acosName,
          reasonOfFailure: item.reasonOfFailure,
          newGPReceiptRecordId: item.newGPReceiptRecordId,
          gpFailureId: item.gpFailureId,
        },
      });
      createdAnalyses.push(analysis);
    }

    res
      .status(201)
      .json({ message: "Bulk upload successful", createdAnalyses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a failure analysis
router.delete("/:id", async (req, res) => {
  try {
    const existingFailureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id: req.params.id },
    });

    if (!existingFailureAnalysis) {
      return res.status(404).json({ error: "Failure analysis not found" });
    }

    await prisma.failureAnalysis.delete({
      where: { id: req.params.id },
    });
    await logActivity(
      req.user.userId,
      req.user.name,
      "DELETE",
      "FailureAnalysis",
      req.params.id,
      existingFailureAnalysis,
      null
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
