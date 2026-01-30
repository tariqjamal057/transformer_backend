const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");
const prisma = new PrismaClient();
const multer = require("multer");
const xlsx = require("xlsx");
const { logActivity } = require("../utils/activityLogger");

const upload = multer({ storage: multer.memoryStorage() });

// GET all damaged transformers with pagination and search
router.get("/", auth, async (req, res) => {
  const { page = 1, limit = 10, search = "", all, supplyTenderId } = req.query;

  if (!supplyTenderId) {
    return res.status(400).json({ error: "supplyTenderId is required" });
  }

  if (all === "true") {
    const damagedTransformers = await prisma.damagedTransformer.findMany({
      where: { supplyTenderId: supplyTenderId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(damagedTransformers);
  }

  const where = search
    ? {
        supplyTenderId: supplyTenderId,
        OR: [
          { serialNo: { contains: search, mode: "insensitive" } },
          { snNumberRange: { contains: search, mode: "insensitive" } },
        ],
      }
    : { supplyTenderId: supplyTenderId };

  try {
    const totalItems = await prisma.damagedTransformer.count({ where });
    const damagedTransformers = await prisma.damagedTransformer.findMany({
      where,
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      take: parseInt(limit, 10),
      orderBy: { createdAt: "desc" },
    });

    res.json({
      items: damagedTransformers,
      totalPages: Math.ceil(totalItems / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      totalItems,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST a new damaged transformer
router.post("/", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }


    const newDamagedTransformer = await prisma.damagedTransformer.create({
      data: { ...req.body, supplyTenderId},
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "DamagedTransformer",
      newDamagedTransformer.id,
      null,
      newDamagedTransformer,
    );
    res.status(201).json(newDamagedTransformer);
  } catch (error) {
    console.error(error);
    if (error.code === "P2002" && error.meta?.target?.includes("serialNo")) {
      return res.status(400).json({
        error: `A damaged transformer with serial number '${req.body.serialNo}' already exists.`,
      });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Bulk Upload Damaged Transformers
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

    // Prevent duplicates by checking existing serial numbers
    const existingSerialNos = (
      await prisma.damagedTransformer.findMany({
        where: { supplyTenderId: supplyTenderId },
        select: { serialNo: true },
      })
    ).map((t) => t.serialNo);

    const recordsToCreate = data
      .filter(
        (item) =>
          item.serialNo &&
          !existingSerialNos.includes(item.serialNo.toString()),
      )
      .map((item) => ({
        ...item,
        supplyTenderId: supplyTenderId, // Add supplyTenderId to each item
        ctlReportDate: item.ctlReportDate ? new Date(item.ctlReportDate) : null,
        liftingLetterDate: item.liftingLetterDate
          ? new Date(item.liftingLetterDate)
          : null,
        dateOfInspectionAfterRepair: item.dateOfInspectionAfterRepair
          ? new Date(item.dateOfInspectionAfterRepair)
          : null,
        challanDate: item.challanDate ? new Date(item.challanDate) : null,
      }));

    if (recordsToCreate.length === 0) {
      return res.status(400).json({
        error:
          "No new valid records to upload. All serial numbers may already exist or data is invalid.",
      });
    }

    const result = await prisma.damagedTransformer.createMany({
      data: recordsToCreate,
      skipDuplicates: true, // As a fallback
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "DamagedTransformer",
      null,
      null,
      recordsToCreate,
    );

    res.status(201).json({
      message: `${result.count} damaged transformers uploaded successfully.`,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      error: "An error occurred during bulk upload.",
      details: error.message,
    });
  }
});

// PUT to update a damaged transformer
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { supplyTenderId } = req.query;

  if (!supplyTenderId) {
    return res.status(400).json({ error: "supplyTenderId is required" });
  }

  try {
    const existingTransformer = await prisma.damagedTransformer.findUnique({
      where: { id, supplyTenderId },
    });

    if (!existingTransformer) {
      return res.status(404).json({
        error:
          "Damaged transformer not found or does not belong to the specified supplyTenderId.",
      });
    }

    const updatedTransformer = await prisma.damagedTransformer.update({
      where: { id, supplyTenderId },
      data: { ...req.body, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "UPDATE",
      "DamagedTransformer",
      updatedTransformer.id,
      existingTransformer,
      updatedTransformer,
    );
    res.status(200).json(updatedTransformer);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Damaged transformer not found." });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

// DELETE a damaged transformer
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { supplyTenderId } = req.query; // Assuming supplyTenderId is passed as a query parameter for deletion

  if (!supplyTenderId) {
    return res.status(400).json({ error: "supplyTenderId is required" });
  }

  try {
    const existingTransformer = await prisma.damagedTransformer.findUnique({
      where: { id, supplyTenderId },
    });

    if (!existingTransformer) {
      return res.status(404).json({
        error:
          "Damaged transformer not found or does not belong to the specified supplyTenderId.",
      });
    }

    await prisma.damagedTransformer.delete({
      where: { id, supplyTenderId },
    });
    await logActivity(
      req.user.userId,
      "DELETE",
      "DamagedTransformer",
      id,
      existingTransformer,
      null,
    );
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Damaged transformer not found." });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
