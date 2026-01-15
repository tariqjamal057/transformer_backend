const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const xlsx = require("xlsx");
const { paginate } = require("../utils/pagination");

const upload = multer({ storage: multer.memoryStorage() });

// Get all GP Receipt Notes with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 10;

    const gpReceiptNotes = await prisma.gPReceiptNote.findMany({
      include: {
        newGpReceiptRecords: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const paginatedData = paginate(gpReceiptNotes, page, pageSize);
    res.json(paginatedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new GP Receipt Note and associate records
router.post("/", async (req, res) => {
  try {
    const { gpReceiptNoteData, recordIds } = req.body;

    // Create the GPReceiptNote
    const newGPReceiptNote = await prisma.gPReceiptNote.create({
      data: gpReceiptNoteData,
    });

    // Update the NewGPReceiptRecords with the new GPReceiptNote id
    if (recordIds && recordIds.length > 0) {
      await prisma.newGPReceiptRecord.updateMany({
        where: {
          id: {
            in: recordIds,
          },
        },
        data: {
          gpReceiptNoteId: newGPReceiptNote.id,
        },
      });
    }

    res.status(201).json(newGPReceiptNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk upload GP Receipt Notes
router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
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
        consigneeName: item.consigneeName,
        accountReceiptNoteNo: item.accountReceiptNoteNo,
        accountReceiptNoteDate: new Date(item.accountReceiptNoteDate),
        acos: item.acos,
        discomReceiptNoteNo: item.discomReceiptNoteNo,
        discomReceiptNoteDate: new Date(item.discomReceiptNoteDate),
      };

      const createdNote = await prisma.gPReceiptNote.create({
        data: note,
      });
      createdNotes.push(createdNote);
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
