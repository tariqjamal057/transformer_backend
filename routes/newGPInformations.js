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

// Get all New GP Informations with pagination and search
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 10;
    const searchQuery = req.query.search || "";
    const { supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }

    const where = {
      supplyTenderId: supplyTenderId,
      ...(searchQuery && {
        challanReceiptedItemNo: {
          contains: searchQuery,
          mode: "insensitive",
        },
      }),
    };

    const totalItems = await prisma.newGPInformation.count({ where });
    const newGPInformations = await prisma.newGPInformation.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        records: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      data: newGPInformations,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
      totalItems: totalItems,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get New GP Information by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query; // Assuming supplyTenderId is passed as a query parameter
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const newGPInformation = await prisma.newGPInformation.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
      include: {
        records: true,
      },
    });
    if (!newGPInformation)
      return res.status(404).json({ error: "New GP Information not found" });
    res.json(newGPInformation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process and bulk create from frontend-matched data
router.post("/bulk-process", auth, async (req, res) => {
  const { challanReceiptedItemNo, challanReceiptedDate, records, supplyTenderId } = req.body;

  if (
    !challanReceiptedItemNo ||
    !challanReceiptedDate ||
    !records ||
    !records.length ||
    !supplyTenderId
  ) {
    return res.status(400).json({ error: "Missing required fields (challanReceiptedItemNo, challanReceiptedDate, records, supplyTenderId)." });
  }

  try {
    const newGPInfo = await prisma.newGPInformation.create({
      data: {
        challanReceiptedItemNo,
        challanReceiptedDate,
        supplyTenderId,
      },
    });

    const recordsToCreate = records.map((record) => ({
      ...record,
      newGPInformationId: newGPInfo.id,
      supplyTenderId,
    }));

    await prisma.newGPInformationRecord.createMany({
      data: recordsToCreate,
    });

    await logActivity(
      req.user.userId,
      req.user.name,
      "CREATE",
      "NewGPInformation",
      newGPInfo.id,
      null,
      { ...newGPInfo, records }
    );
    res
      .status(201)
      .json({
        message: "Data processed and stored successfully!",
        ...newGPInfo,
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Direct bulk upload from Excel
router.post("/bulk-upload", auth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const { supplyTenderId } = req.query;
  if (!supplyTenderId) {
    return res.status(400).json({ error: 'supplyTenderId is required as a query parameter for bulk upload' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    let createdCount = 0;
    for (const item of data) {
      await prisma.$transaction(async (tx) => {
        const parent = await tx.newGPInformation.create({
          data: {
            challanReceiptedItemNo: item.challanReceiptedItemNo,
            challanReceiptedDate: new Date(item.challanReceiptedDate),
            supplyTenderId: supplyTenderId, // Add supplyTenderId
          },
        });
        await tx.newGPInformationRecord.create({
          data: {
            newGPInformationId: parent.id,
            trfsiNo: String(item.trfsiNo),
            rating: String(item.rating),
            polyCarbonateSealNo: String(item.polyCarbonateSealNo),
            receivedFromACOS: item.receivedFromACOS,
            inspectionDate: item.inspectionDate
              ? new Date(item.inspectionDate)
              : null,
            challanNo: item.challanNo,
            challanDate: item.challanDate ? new Date(item.challanDate) : null,
            consigneeName: item.consigneeName,
            isMatched: item.isMatched === "true" || item.isMatched === true,
            supplyTenderId: supplyTenderId, // Add supplyTenderId
          },
        });
      });
      createdCount++;
    }

    res.status(201).json({ message: "Bulk upload successful", createdCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update New GP Information
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { challanReceiptedItemNo, challanReceiptedDate, records, supplyTenderId } = req.body;

  if (!supplyTenderId) {
    return res.status(400).json({ error: 'supplyTenderId is required' });
  }

  try {
    const updatedInfo = await prisma.$transaction(async (tx) => {
      const existingInfo = await tx.newGPInformation.findUnique({
        where: { id, supplyTenderId },
      });
      if (!existingInfo) {
        throw new Error("New GP Information not found or does not belong to the specified supplyTenderId");
      }

      // 1. Update parent
      const parentUpdate = await tx.newGPInformation.update({
        where: { id, supplyTenderId },
        data: {
          challanReceiptedItemNo,
          challanReceiptedDate,
          supplyTenderId,
        },
      });

      // 2. Delete existing children (only those belonging to the same supplyTenderId)
      await tx.newGPInformationRecord.deleteMany({
        where: { newGPInformationId: id, supplyTenderId },
      });

      // 3. Create new children
      if (records && records.length > 0) {
        const recordsToCreate = records.map((record) => {
          const { id: recordId, ...rest } = record; // Exclude old id
          return {
            ...rest,
            newGPInformationId: parentUpdate.id,
            supplyTenderId,
          };
        });
        await tx.newGPInformationRecord.createMany({
          data: recordsToCreate,
        });
      }

      const updatedData = await tx.newGPInformation.findUnique({
        where: { id, supplyTenderId },
        include: { records: true },
      });

      await logActivity(
        req.user.userId,
        req.user.name,
        "UPDATE",
        "NewGPInformation",
        id,
        existingInfo,
        updatedData
      );
      return updatedData;
    });

    res.json(updatedInfo);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete New GP Information
router.delete("/:id", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query; // Assuming supplyTenderId is passed as a query parameter for deletion
    if (!supplyTenderId) {
      return res.status(400).json({ error: 'supplyTenderId is required' });
    }
    const existingNewGPInformation = await prisma.newGPInformation.findUnique({
      where: { id: req.params.id, supplyTenderId: supplyTenderId },
      include: { records: true },
    });

    if (!existingNewGPInformation) {
      return res.status(404).json({ error: "New GP Information not found or does not belong to the specified supplyTenderId" });
    }

    await prisma.$transaction([
      prisma.newGPInformationRecord.deleteMany({
        where: { newGPInformationId: req.params.id, supplyTenderId: supplyTenderId },
      }),
      prisma.newGPInformation.delete({
        where: { id: req.params.id, supplyTenderId: supplyTenderId },
      }),
    ]);

    await logActivity(
      req.user.userId,
      req.user.name,
      "DELETE",
      "NewGPInformation",
      req.params.id,
      existingNewGPInformation,
      null
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
