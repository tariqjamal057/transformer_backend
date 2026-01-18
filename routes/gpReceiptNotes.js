const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const xlsx = require("xlsx");
const { paginate } = require("../utils/pagination");
const auth = require("../middleware/auth");
const { logActivity } = require("../utils/activityLogger");

const upload = multer({ storage: multer.memoryStorage() });

// Get all GP Receipt Notes with pagination
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 10;
    const { supplyTenderId, all } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const gpReceiptNotes = await prisma.gPReceiptNote.findMany({
      where: { supplyTenderId: supplyTenderId },
      include: {
        newGpReceiptRecords: true,
        consignee: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (all === "true") {
      return res.json(gpReceiptNotes);
    }

    const paginatedData = paginate(gpReceiptNotes, page, pageSize);
    res.json(paginatedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new GP Receipt Note and associate records
router.post("/", auth, async (req, res) => {
  try {
    const { gpReceiptNoteData, recordIds } = req.body;
    const { supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    // Create the GPReceiptNote
    const newGPReceiptNote = await prisma.gPReceiptNote.create({
      data: { ...gpReceiptNoteData, supplyTenderId },
    });

    // Update the NewGPReceiptRecords with the new GPReceiptNote id
    if (recordIds && recordIds.length > 0) {
      await prisma.newGPReceiptRecord.updateMany({
        where: {
          id: {
            in: recordIds,
          },
          supplyTenderId: supplyTenderId, // Ensure records belong to the same supplyTenderId
        },
        data: {
          gpReceiptNoteId: newGPReceiptNote.id,
        },
      });
    }
    await logActivity(
      req.user.userId,
      "CREATE",
      "GPReceiptNote",
      newGPReceiptNote.id,
      null,
      newGPReceiptNote,
    );

    res.status(201).json(newGPReceiptNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk upload GP Receipt Notes
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

    const createdNotes = [];
    for (const item of data) {
      const note = {
        selectDateFrom: new Date(item.selectDateFrom),
        selectDateTo: new Date(item.selectDateTo),
        consigneeId: item.consigneeId,
        accountReceiptNoteNo: item.accountReceiptNoteNo,
        accountReceiptNoteDate: new Date(item.accountReceiptNoteDate),
        acos: item.acos,
        discomReceiptNoteNo: item.discomReceiptNoteNo,
        discomReceiptNoteDate: new Date(item.discomReceiptNoteDate),
        supplyTenderId: supplyTenderId,
      };

      const createdNote = await prisma.gPReceiptNote.create({
        data: note,
      });
      createdNotes.push(createdNote);
      await logActivity(
        req.user.userId,
        "CREATE",
        "GPReceiptNote",
        createdNote.id,
        null,
        createdNote,
      );
    }

    res.status(201).json({
      message: "Bulk upload successful",
      createdNotes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
