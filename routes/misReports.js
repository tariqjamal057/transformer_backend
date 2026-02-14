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
    const gpFailures = await prisma.gPFailure.findMany({
      include: {
        deliveryChallan: {
          include: {
            finalInspection: {
              include: {
                deliverySchedule: {
                  include: {
                    supplyTender: {
                      include: {
                        company: true,
                      },
                    },
                    tn: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const reportData = gpFailures
      .map((gpf) => {
        const deliverySchedule =
          gpf.deliveryChallan?.finalInspection?.deliverySchedule;
        if (!deliverySchedule) return null;

        const guaranteeExpiry = new Date(gpf.guaranteeExpiry);
        const today = new Date();
        const remainingMonths =
          guaranteeExpiry > today
            ? (guaranteeExpiry.getFullYear() - today.getFullYear()) * 12 +
              (guaranteeExpiry.getMonth() - today.getMonth())
            : 0;

        return {
          id: gpf.id,
          tfrSrNo: gpf.trfsiNo,
          deliverySchedule: {
            tnNumber: deliverySchedule.tnNumber,
            rating: deliverySchedule.rating,
            phase: deliverySchedule.phase,
            wound: deliverySchedule.wound,
          },
          gpExpiryDateAsPerOriginalSupply: gpf.guaranteeExpiry,
          remainingOriginalGuranteePeriod: remainingMonths,
          tranformersNotInService: 0, // Placeholder
          extendedWarranty: 0, // Placeholder
          companyName: deliverySchedule.supplyTender.company.name,
          discom: deliverySchedule.supplyTender.name,
        };
      })
      .filter(Boolean); // Filter out null values

    res.json(reportData);
  } catch (error) {
    console.error("Error fetching G.P. Extended Warranty Information:", error);
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
        tn: true,
        finalInspections: {
          include: {
            deliveryChallans: true,
          },
        },
      },
    });

    const summaryMap = new Map();

    for (const ds of deliverySchedules) {
      const key = `${ds.supplyTender.company.name}-${ds.supplyTender.name}-${ds.rating}-${ds.phase}-${ds.wound}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          id: ds.id,
          companyName: ds.supplyTender.company.name,
          discom: ds.supplyTender.name,
          deliverySchedule: {
            rating: ds.rating,
            phase: ds.phase,
            wound: ds.wound,
          },
          totalSuppliedNewTillDate: 0,
          totalReceivedUnderGPTillDate: 0,
          totalInspectedTillDate: 0,
          totalDispatchedTillDate: 0,
          gpTierBalanceNow: 0,
          inspectedPendingToBeDelivered: 0,
          gpReceiptInMonth: 0,
          gpDispatchInMonth: 0,
          gpInspectedInMonth: 0,
        });
      }

      const summary = summaryMap.get(key);
      summary.totalSuppliedNewTillDate += ds.totalQuantity || 0;

      const challanNos = ds.finalInspections.flatMap((fi) =>
        fi.deliveryChallans.map((dc) => dc.challanNo),
      );

      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      );

      const [
        receivedCount,
        inspectedCount,
        dispatchedCount,
        receiptInMonth,
        inspectedInMonth,
        dispatchInMonth,
      ] = await Promise.all([
        prisma.gPFailure.count({
          where: {
            deliveryChallan: {
              challanNo: { in: challanNos },
            },
          },
        }),
        prisma.newGPInformationRecord.count({
          where: {
            challanNo: { in: challanNos },
            inspectionDate: { not: null },
          },
        }),
        prisma.damagedTransformer.count({
          where: {
            challanNo: { in: challanNos },
            deliveredToAcos: { not: null },
          },
        }),
        prisma.gPFailure.count({
          where: {
            createdAt: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth,
            },
            deliveryChallan: {
              challanNo: { in: challanNos },
            },
          },
        }),
        prisma.newGPInformationRecord.count({
          where: {
            inspectionDate: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth,
            },
            challanNo: { in: challanNos },
          },
        }),
        prisma.damagedTransformer.count({
          where: {
            challanDate: {
              // Assuming challanDate is the dispatch date
              gte: firstDayOfMonth,
              lte: lastDayOfMonth,
            },
            challanNo: { in: challanNos },
            deliveredToAcos: { not: null },
          },
        }),
      ]);

      summary.totalReceivedUnderGPTillDate += receivedCount;
      summary.totalInspectedTillDate += inspectedCount;
      summary.totalDispatchedTillDate += dispatchedCount;
      summary.gpReceiptInMonth += receiptInMonth;
      summary.gpInspectedInMonth += inspectedInMonth;
      summary.gpDispatchInMonth += dispatchInMonth;
    }

    const summaryData = Array.from(summaryMap.values()).map((summary) => {
      summary.gpTierBalanceNow =
        summary.totalReceivedUnderGPTillDate - summary.totalDispatchedTillDate;
      summary.inspectedPendingToBeDelivered =
        summary.totalInspectedTillDate - summary.totalDispatchedTillDate;
      return summary;
    });

    res.json(summaryData);
  } catch (error) {
    console.error("Error fetching New GP Summary:", error);
    res.status(500).json({ error: error.message });
  }
});

// // New GP Transformers
// router.get("/new-gp-transformers", auth, async (req, res) => {
//   try {
//     const { page = 1, limit = 10, supplyTenderId } = req.query;

//     if (!supplyTenderId) {
//       return res.status(400).json({ error: "supplyTenderId is required" });
//     }

//     const where = { supplyTenderId: supplyTenderId };
//     const totalItems = await prisma.newGPTransformer.count({ where });
//     const items = await prisma.newGPTransformer.findMany({
//       where,
//       skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
//       take: parseInt(limit, 10),
//       orderBy: { createdAt: "desc" },
//     });

//     res.json({
//       items,
//       totalPages: Math.ceil(totalItems / parseInt(limit, 10)),
//       currentPage: parseInt(page, 10),
//       totalItems,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

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
    // if (supplyTender) {
    //   where.supplyTenderId = supplyTender;
    // }
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
    const deliverySchedules = await prisma.deliverySchedule.findMany({
      include: {
        supplyTender: {
          include: {
            company: true,
          },
        },
        tn: true,
        finalInspections: {
          include: {
            deliveryChallans: {
              include: {
                gpFailures: true,
              },
            },
          },
        },
      },
    });

    const reportData = [];
    for (const ds of deliverySchedules) {
      const gpFailures = ds.finalInspections.flatMap((fi) =>
        fi.deliveryChallans.flatMap((dc) => dc.gpFailures),
      );

      const totalReceivedUnderGPTillDate = gpFailures.length;
      const qtyBalance = (ds.totalQuantity || 0) - totalReceivedUnderGPTillDate;

      const lastGPSupplyExpiryDate =
        gpFailures.length > 0
          ? new Date(
              Math.max.apply(
                null,
                gpFailures.map((gpf) => new Date(gpf.guaranteeExpiry)),
              ),
            ).toISOString()
          : null;

      reportData.push({
        id: ds.id,
        companyName: ds.supplyTender.company.name,
        discom: ds.supplyTender.name,
        deliverySchedule: {
          tnNumber: ds.tnNumber,
          rating: ds.rating,
          phase: ds.phase,
          wound: ds.wound,
        },
        totalReceivedUnderGPTillDate,
        qtyBalance,
        lastGPSupplyExpiryDate,
      });
    }

    res.json(reportData);
  } catch (error) {
    console.error("Error fetching Supply G.P. Expired Statement:", error);
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
        inspectionOfficers: {
          not: [],
        },
        inspectionDate: {
          not: null,
        },
        diNo: {
          equals: null,
        },
        diDate: {
          equals: null,
        },
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
        diDate: {
          not: null,
        },
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
