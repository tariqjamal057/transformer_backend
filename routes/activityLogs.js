const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { paginate } = require("../utils/pagination");
const { auth, isOwner } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: Activity log management
 */

/**
 * @swagger
 * /activity-logs:
 *   get:
 *     summary: Retrieve a list of all activity logs with filtering and pagination
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *         description: Filter logs by activity type.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs created on or after this date (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs created on or before this date (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: A list of activity logs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityLog'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 */
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, startDate, endDate } = req.query;

    let where = {};

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set end of day for accurate date range filtering
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const totalItems = await prisma.activityLog.count({ where });
    const activityLogs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        doneByUser: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      skip: (parseInt(page, 10) - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });

    res.json({
      items: activityLogs,
      totalPages: Math.ceil(totalItems / parseInt(pageSize, 10)),
      currentPage: parseInt(page, 10),
      totalItems,
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", auth, isOwner, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.activityLog.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;