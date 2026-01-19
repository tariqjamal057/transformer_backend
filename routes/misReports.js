const express = require("express");
const router = express.Router();
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { paginate } = require("../utils/pagination");
const { logActivity } = require("../utils/activityLogger");

// G.P. Extended Warranty Information
router.get("/gp-extended-warranty", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const where = { supplyTenderId: supplyTenderId };
    const totalItems = await prisma.gPExtendedWarrantyInformation.count({
      where,
    });
    const items = await prisma.gPExtendedWarrantyInformation.findMany({
      where,
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      take: parseInt(limit, 10),
      orderBy: { createdAt: "desc" },
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
router.get("/new-gp-summary", auth, async (req, res) => {
  try {
    const where = {};

    // Fetch all delivery schedules with related data
    const deliverySchedules = await prisma.deliverySchedule.findMany({
      include: {
        supplyTender: {
          include: {
            company: true,
          },
        },
      },
    });

    const summaryData = await Promise.all(
      deliverySchedules.map(async (ds) => {
        const supplyTenderId = ds.supplyTenderId;

        // 1. Total Qty Supplied (New) Till Date
        const totalSuppliedNewTillDate = ds.totalQuantity;

        // 2. Total Qty Received Under G.P. Till Date
        const totalReceivedUnderGPTillDate = await prisma.gPFailure.count({
          where: {
            supplyTenderId,
            deliveryChallan: {
              finalInspection: {
                deliveryScheduleId: ds.id,
              },
            },
          },
        });

        // 3. Total Qty Inspected Till Date
        const totalInspectedTillDate =
          await prisma.newGPInformationRecord.count({
            where: {
              supplyTenderId,
              inspectionDate: { not: null },
              newGPInformation: {
                records: {
                  some: {
                    challanNo: {
                      in: await prisma.deliveryChallan
                        .findMany({
                          where: {
                            finalInspection: { deliveryScheduleId: ds.id },
                          },
                          select: { challanNo: true },
                        })
                        .then((challans) => challans.map((c) => c.challanNo)),
                    },
                  },
                },
              },
            },
          });

        // 4. Total Qty Dispatched Till Date (Placeholder Logic)
        // This assumes that a repaired transformer is marked in DamagedTransformer
        const totalDispatchedTillDate = await prisma.damagedTransformer.count({
          where: {
            supplyTenderId,
            deliveredToAcos: { not: null },
            challanNo: {
              in: await prisma.deliveryChallan
                .findMany({
                  where: { finalInspection: { deliveryScheduleId: ds.id } },
                  select: { challanNo: true },
                })
                .then((challans) => challans.map((c) => c.challanNo)),
            },
          },
        });

        // 5. Inspected Pending To Be Delivered
        const inspectedPendingToBeDelivered =
          totalInspectedTillDate - totalDispatchedTillDate;

        // --- Monthly GP Data (Placeholder) ---
        const gpReceiptInMonth = 0;
        const gpDispatchInMonth = 0;
        const gpInspectedInMonth = 0;
        const gpTierBalanceNow = 0;

        return {
          id: ds.id,
          companyName: ds.supplyTender.company.name,
          discom: ds.supplyTender.name,
          deliverySchedule: {
            rating: ds.rating,
            phase: ds.phase,
            wound: ds.wound,
          },
          totalSuppliedNewTillDate,
          totalReceivedUnderGPTillDate,
          totalInspectedTillDate,
          totalDispatchedTillDate,
          inspectedPendingToBeDelivered,
          gpTierBalanceNow,
          gpReceiptInMonth,
          gpDispatchInMonth,
          gpInspectedInMonth,
        };
      }),
    );
    // if (exportData === "excel") {
    //   const xlsx = require("xlsx");
    //   const worksheet = xlsx.utils.json_to_sheet(summaryData);
    //   const workbook = xlsx.utils.book_new();
    //   xlsx.utils.book_append_sheet(workbook, worksheet, "New GP Summary");
    //   const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    //   res.header("Content-Disposition", 'attachment; filename="new-gp-summary.xlsx"');
    //   return res.send(buffer);
    // }

    // if (exportData === "pdf") {
    //   const PDFDocument = require("pdfkit-table");
    //   const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    //   res.header("Content-Type", "application/pdf");
    //   res.header("Content-Disposition", 'attachment; filename="new-gp-summary.pdf"');
    //   doc.pipe(res);

    //   const table = {
    //     title: "New GP Summary",
    //     headers: [
    //         "S.No.", "Firm", "Discom", "Rating", "Phase", "Wound",
    //         "Total Qty Supplied (New) Till Date", "Total Qty Received Under G.P. Till Date",
    //         "Total Qty Inspected Till Date", "Total Qty Dispatched Till Date",
    //         "GP Tfr. Balance Now", "Inspected Pending To Be Delivered",
    //         "GP Receipt In Month", "GP Dispatch In Month", "GP Inspected In Month"
    //     ],
    //     rows: summaryData.map((row, idx) => [
    //         idx + 1,
    //         row.companyName,
    //         row.discom,
    //         row.deliverySchedule.rating,
    //         row.deliverySchedule.phase,
    //         row.deliverySchedule.wound,
    //         row.totalSuppliedNewTillDate,
    //         row.totalReceivedUnderGPTillDate,
    //         row.totalInspectedTillDate,
    //         row.totalDispatchedTillDate,
    //         row.gpTierBalanceNow,
    //         row.inspectedPendingToBeDelivered,
    //         row.gpReceiptInMonth,
    //         row.gpDispatchInMonth,
    //         row.gpInspectedInMonth,
    //     ])
    //   };

    //   doc.table(table, {
    //     prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
    //     prepareRow: (row, i) => doc.font("Helvetica").fontSize(8),
    //   });

    //   doc.end();
    //   return;
    // }

    res.json(summaryData);
  } catch (error) {
    console.error("Error fetching New GP Summary:", error);
    res.status(500).json({ error: error.message });
  }
});

// New GP Transformers
router.get("/new-gp-transformers", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const where = { supplyTenderId: supplyTenderId };
    const totalItems = await prisma.newGPTransformer.count({ where });
    const items = await prisma.newGPTransformer.findMany({
      where,
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      take: parseInt(limit, 10),
      orderBy: { createdAt: "desc" },
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
router.get("/production-planning", auth, async (req, res) => {
  try {
    const {
      company,
      supplyTender,
      month,
      year,
      export: exportData,
    } = req.query;

    const where = {};
    if (company) {
      where.supplyTender = {
        companyId: company,
      };
    }
    if (supplyTender) {
      where.supplyTenderId = supplyTender;
    }
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.deliverySchedule = {
        deliveryScheduleDate: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const finalInspections = await prisma.finalInspection.findMany({
      where,
      include: {
        deliverySchedule: {
          include: {
            tn: true,
          },
        },
        supplyTender: {
          include: {
            company: true,
          },
        },
        deliveryChallans: true,
      },
    });

    const responseData = finalInspections.map((fi) => {
      const actualSuppliedTotal = fi.deliveryChallans.reduce((sum, dc) => {
        const from = parseInt(dc.subSerialNumberFrom, 10);
        const to = parseInt(dc.subSerialNumberTo, 10);
        if (!isNaN(from) && !isNaN(to)) {
          return sum + (to - from + 1);
        }
        return sum;
      }, 0);

      // More placeholder logic - this needs clarification on business rules
      const quantityPerMonthInSchedule =
        (fi.deliverySchedule.totalQuantity || 0) / 12;
      const totalSupplyDueInCurrentMonth = quantityPerMonthInSchedule;
      const balanceDueToBeInspectedInCurrentMonth =
        totalSupplyDueInCurrentMonth - (fi.inspectedQuantity || 0);
      const balancePending =
        fi.deliverySchedule.totalQuantity - actualSuppliedTotal;

      return {
        id: fi.id,
        companyName: fi.supplyTender.company.name,
        discom: fi.supplyTender.name,
        deliverySchedule: {
          tnNumber: fi.deliverySchedule.tnNumber,
          rating: fi.deliverySchedule.rating,
          phase: fi.deliverySchedule.phase,
          wound: fi.deliverySchedule.wound,
          status: "Active", // Placeholder
          scheduleDate: fi.deliverySchedule.deliveryScheduleDate,
          totalOrderQuantity: fi.deliverySchedule.totalQuantity,
        },
        offeredDate: fi.offerDate,
        offeredQuantity: fi.offeredQuantity,
        serialNumberFrom: fi.serialNumberFrom,
        serialNumberTo: fi.serialNumberTo,
        snNumber: `${fi.serialNumberFrom} TO ${fi.serialNumberTo}`,
        quantityPerMonthInSchedule,
        totalSupplyDueInCurrentMonth,
        offeredForInspectionTotal: fi.offeredQuantity,
        finalInspectionTotal: fi.inspectedQuantity || 0,
        actualSuppliedTotal,
        balanceDueToBeInspectedInCurrentMonth,
        balancePending,
        plannedForMonth: 0, // Placeholder
      };
    });

    if (exportData) {
      res.json(responseData);
    } else {
      res.json(responseData);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/new-gp-transformers", auth, async (req, res) => {
  try {
    const where = {};

    // 1. Total Qty Supplied (New)
    const supplied = await prisma.deliverySchedule.aggregate({
      _sum: { totalQuantity: true },
      where,
    });
    const totalSupplied = supplied._sum.totalQuantity || 0;

    // 2. Total Qty Received Under G.P.
    const totalReceived = await prisma.gPFailure.count({
      where: {
        deliveryChallan: {
          finalInspection: where,
        },
      },
    });

    // Placeholder for Inspected and Dispatched logic
    const totalInspected = 0; // Needs complex logic based on business rules
    const totalDispatch = 0; // Needs complex logic based on business rules
    const totalPending = totalReceived - totalDispatch;

    // Main table data
    const groupedData = await prisma.deliverySchedule.groupBy({
      by: ["tnNumber", "rating", "phase", "wound"],
      _sum: {
        totalQuantity: true,
      },
      where,
    });

    const tableData = await Promise.all(
      groupedData.map(async (group) => {
        // These are placeholders as they need to be calculated per group
        const totalReceivedUnderGPTillDate = 0;
        const totalInspectedTillDate = 0;
        const totalDispatchedTillDate = 0;
        const totalPendingIncludingInspected =
          totalReceivedUnderGPTillDate - totalDispatchedTillDate;
        const inspectedButNotDispatched =
          totalInspectedTillDate - totalDispatchedTillDate;

        return {
          id: `${group.tnNumber}-${group.rating}-${group.phase}-${group.wound}`, // Create a unique ID
          deliverySchedule: {
            tnNumber: group.tnNumber,
            rating: group.rating,
            phase: group.phase,
            wound: group.wound,
          },
          totalSuppliedNewTillDate: group._sum.totalQuantity || 0,
          totalReceivedUnderGPTillDate,
          totalInspectedTillDate,
          totalDispatchedTillDate,
          totalPendingIncludingInspected,
          inspectedButNotDispatched,
        };
      }),
    );

    const responseData = {
      tableData,
      cards: [
        { title: "Total Qty Supplied", value: totalSupplied, color: "#3498db" },
        {
          title: "Total Qty Received Under G.P.",
          value: totalReceived,
          color: "#27ae60",
        },
        {
          title: "Total Inspected As On Date",
          value: totalInspected,
          color: "#8e44ad",
        },
        {
          title: "Total Dispatch As On Date",
          value: totalDispatch,
          color: "#e67e22",
        },
        { title: "Total Pending", value: totalPending, color: "#c0392b" },
      ],
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Supply G.P. Expired Statement
router.get("/supply-gp-expired-statement", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const where = { supplyTenderId: supplyTenderId };
    const totalItems = await prisma.supplyGPExpiredStatement.count({ where });
    const items = await prisma.supplyGPExpiredStatement.findMany({
      where,
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      take: parseInt(limit, 10),
      orderBy: { createdAt: "desc" },
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

router.get("/inspection-done-di-pending", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;

    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const items = await prisma.finalInspection.findMany({
      where: {
        consignees: {
          not: [],
        },
        inspectionOfficers: {
          not: [],
        },
        diNo: {
          equals: Prisma.DbNull
        },
        diNo: null
      },
      include: {
        deliverySchedule: {
          include: {
            tn: true,
          },
        },
        supplyTender: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/di-received-dispatch-pending", auth, async (req, res) => {
  try {
    const { supplyTenderId } = req.query;
    if (!supplyTenderId) {
      return res.status(400).json({ error: "supplyTenderId is required" });
    }

    const finalInspections = await prisma.finalInspection.findMany({
      where: {
        diNo: {
          not: null,
        },
        consignees: {
          not: []
        },
        inspectionOfficers: {
          not: []
        }
      },
      include: {
        deliverySchedule: {
          include: {
            tn: true,
          },
        },
        supplyTender: {
          include: {
            company: true,
          },
        },
        finalInspectionConsignees: {
          include: {
            consignee: true,
          },
        },
        deliveryChallans: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = finalInspections.map((inspection) => {
      let consignees = [];

      const calculateDispatch = (consigneeId) => {
        if (!inspection.deliveryChallans) return 0;
        return inspection.deliveryChallans
          .filter((dc) => dc.consigneeId === consigneeId)
          .reduce((acc, dc) => {
            const from = parseInt(dc.subSerialNumberFrom, 10);
            const to = parseInt(dc.subSerialNumberTo, 10);
            if (!isNaN(from) && !isNaN(to)) {
              return acc + (to - from + 1);
            }
            return acc;
          }, 0);
      };

      if (
        inspection.finalInspectionConsignees &&
        inspection.finalInspectionConsignees.length > 0
      ) {
        consignees = inspection.finalInspectionConsignees.map((fic) => {
          const dispatch = calculateDispatch(fic.consigneeId);
          return {
            consignee: fic.consignee,
            quantity: fic.quantity,
            dispatch: dispatch,
            pending: Math.max(0, fic.quantity - dispatch),
            subSnNumber: fic.subSerialNumber,
          };
        });
      } else if (
        inspection.consignees &&
        Array.isArray(inspection.consignees)
      ) {
        consignees = inspection.consignees.map((item) => {
          const dispatch = calculateDispatch(item.consigneeId);
          return {
            consignee: { name: item.consigneeName, id: item.consigneeId },
            quantity: item.quantity,
            dispatch: dispatch,
            pending: Math.max(0, item.quantity - dispatch),
            subSnNumber: item.subSnNumber,
          };
        });
      }

      return {
        ...inspection,
        consignees,
        snNumber: `${inspection.serialNumberFrom} TO ${inspection.serialNumberTo}`,
        companyName: inspection.supplyTender.company.name,
        discom: inspection.supplyTender.name,
      };
    });

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
