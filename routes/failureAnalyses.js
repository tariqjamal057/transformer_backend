const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { logActivity } = require("../utils/activityLogger");
const { paginate } = require("../utils/pagination");
const auth = require("../middleware/auth");
const multer = require("multer");
const xlsx = require("xlsx");

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Get all Failure Analyses with pagination and search
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 10;
    const searchQuery = req.query.search || "";
    const { supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const where = {
      supplyTenderId: supplyTenderId,
      // OR: [
      //   ...(searchQuery
      //     ? [
      //         { acosName: { contains: searchQuery, mode: "insensitive" } },
      //         {
      //           reasonOfFailure: { contains: searchQuery, mode: "insensitive" },
      //         },
      //         {
      //           newGPReceiptRecord: {
      //             sinNo: { contains: searchQuery, mode: "insensitive" },
      //           },
      //         },
      //       ]
      //     : []),
      // ],
    };

    const totalItems = await prisma.failureAnalysis.count({ where });
    const failureAnalyses = await prisma.failureAnalysis.findMany({
      where,
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
router.get("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query; // Assuming supplyTenderId is passed as a query parameter
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const failureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
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
router.post("/", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    const { acosName, reasonOfFailure, newGPReceiptRecordId, gpFailureId } =
      req.body;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    // Validate if the newGPReceiptRecordId exists and belongs to the correct supplyTenderId
    const newGPReceiptRecord = await prisma.newGPReceiptRecord.findUnique({
      where: { id: newGPReceiptRecordId, supplyTenderId: supplyTenderId },
    });
    if (!newGPReceiptRecord) {
      return res.status(404).json({
        error:
          "New GP Receipt Record not found or does not belong to the specified supplyTenderId",
      });
    }

    // Validate if the gpFailureId exists and belongs to the correct supplyTenderId
    const gpFailure = await prisma.gPFailure.findUnique({
      where: { id: gpFailureId, supplyTenderId: supplyTenderId },
    });
    if (!gpFailure) {
      return res.status(404).json({
        error:
          "GP Failure Record not found or does not belong to the specified supplyTenderId",
      });
    }

    const failureAnalysis = await prisma.failureAnalysis.create({
      data: {
        acosName,
        reasonOfFailure,
        newGPReceiptRecordId,
        gpFailureId,
        supplyTenderId,
      },
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "FailureAnalysis",
      failureAnalysis.id,
      null,
      failureAnalysis,
    );
    res.status(201).json(failureAnalysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a failure analysis
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { supplyTenderId } = req.query;
    const { acosName, reasonOfFailure, newGPReceiptRecordId, gpFailureId } =
      req.body;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const existingFailureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id, supplyTenderId: supplyTenderId },
    });

    if (!existingFailureAnalysis) {
      return res.status(404).json({
        error:
          "Failure analysis not found or does not belong to the specified supplyTenderId",
      });
    }

    // Validate if the newGPReceiptRecordId exists and belongs to the correct supplyTenderId
    if (newGPReceiptRecordId) {
      const newGPReceiptRecord = await prisma.newGPReceiptRecord.findUnique({
        where: { id: newGPReceiptRecordId, supplyTenderId: supplyTenderId },
      });
      if (!newGPReceiptRecord) {
        return res.status(404).json({
          error:
            "New GP Receipt Record not found or does not belong to the specified supplyTenderId",
        });
      }
    }

    // Validate if the gpFailureId exists and belongs to the correct supplyTenderId
    if (gpFailureId) {
      const gpFailure = await prisma.gPFailure.findUnique({
        where: { id: gpFailureId, supplyTenderId: supplyTenderId },
      });
      if (!gpFailure) {
        return res.status(404).json({
          error:
            "GP Failure Record not found or does not belong to the specified supplyTenderId",
        });
      }
    }

    const updatedFailureAnalysis = await prisma.failureAnalysis.update({
      where: { id, supplyTenderId: supplyTenderId },
      data: {
        acosName,
        reasonOfFailure,
        newGPReceiptRecordId,
        gpFailureId,
        supplyTenderId,
      },
    });
    await logActivity(
      req.user.userId,
      "UPDATE",
      "FailureAnalysis",
      updatedFailureAnalysis.id,
      existingFailureAnalysis,
      updatedFailureAnalysis,
    );
    res.json(updatedFailureAnalysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk upload Failure Analyses
router.post("/bulk-upload", auth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const { supplyTenderId } = req.query;
  if (!supplyTenderId) {
    return res.status(400).json({
      error: "supplyTenderId is required as a query parameter for bulk upload",
    });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const createdAnalyses = [];
    for (const item of data) {
      // Validate if the newGPReceiptRecordId exists and belongs to the correct supplyTenderId
      const newGPReceiptRecord = await prisma.newGPReceiptRecord.findUnique({
        where: {
          id: item.newGPReceiptRecordId,
          supplyTenderId: supplyTenderId,
        },
      });
      if (!newGPReceiptRecord) {
        console.warn(
          `Skipping row due to New GP Receipt Record not found or does not belong to the specified supplyTenderId: ${item.newGPReceiptRecordId}`,
        );
        continue;
      }

      // Validate if the gpFailureId exists and belongs to the correct supplyTenderId
      const gpFailure = await prisma.gpFailure.findUnique({
        where: { id: item.gpFailureId, supplyTenderId: supplyTenderId },
      });
      if (!gpFailure) {
        console.warn(
          `Skipping row due to GP Failure Record not found or does not belong to the specified supplyTenderId: ${item.gpFailureId}`,
        );
        continue;
      }

      const analysis = await prisma.failureAnalysis.create({
        data: {
          acosName: item.acosName,
          reasonOfFailure: item.reasonOfFailure,
          newGPReceiptRecordId: item.newGPReceiptRecordId,
          gpFailureId: item.gpFailureId,
          supplyTenderId: supplyTenderId, // Add supplyTenderId to each item
        },
      });
      createdAnalyses.push(analysis);
    }
    await logActivity(
      req.user.userId,
      "CREATE",
      "FailureAnalysis",
      null,
      null,
      createdAnalyses,
    );

    res
      .status(201)
      .json({ message: "Bulk upload successful", createdAnalyses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a failure analysis
router.delete("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query; // Assuming supplyTenderId is passed as a query parameter for deletion
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }
    const existingFailureAnalysis = await prisma.failureAnalysis.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });

    if (!existingFailureAnalysis) {
      return res.status(404).json({
        error:
          "Failure analysis not found or does not belong to the specified supplyTenderId",
      });
    }

    await prisma.failureAnalysis.delete({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "DELETE",
      "FailureAnalysis",
      req.params.id,
      existingFailureAnalysis,
      null,
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
