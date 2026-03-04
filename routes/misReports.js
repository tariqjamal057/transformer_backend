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
      supplyTenderId,
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
            finalInspections: {
              include: {
                deliveryChallans: true,
              },
            },
          },
        },
        supplyTender: {
          include: {
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        deliveryChallans: true,
      },
    });

    const today = new Date();
    const filterMonth = month ? parseInt(month, 10) - 1 : today.getMonth();
    const filterYear = year ? parseInt(year, 10) : today.getFullYear();

    // Determine the reference date for "current" calculations
    let referenceDate = new Date();
    if (month && year) {
      if (parseInt(month, 10) !== (today.getMonth() + 1) || parseInt(year, 10) !== today.getFullYear()) {
        referenceDate = new Date(filterYear, filterMonth, 1);
      }
    }

    const responseData = finalInspections.map((fi) => {
      // Calculate project-level (TN level) actuals
      const allInspectionsForProject = fi.deliverySchedule?.finalInspections || [];
      
      const projectTotalSupplied = allInspectionsForProject.reduce((sum, insp) => {
        const challanSum = (insp.deliveryChallans || []).reduce((cSum, dc) => {
          let count = 0;
          const from = parseInt(dc.subSerialNumberFrom, 10);
          const to = parseInt(dc.subSerialNumberTo, 10);
          if (!isNaN(from) && !isNaN(to)) {
            count = to - from + 1;
          } else if (dc.selectedTransformers && Array.isArray(dc.selectedTransformers)) {
            count = dc.selectedTransformers.length;
          } else if (dc.repairedSerialNumbers && Array.isArray(dc.repairedSerialNumbers)) {
            count = dc.repairedSerialNumbers.length;
          }
          return cSum + count;
        }, 0);
        return sum + challanSum;
      }, 0);

      const projectTotalInspected = allInspectionsForProject.reduce((sum, insp) => {
        return sum + (insp.inspectedQuantity || 0);
      }, 0);

      // Current batch actuals (for display/other logic if needed)
      const currentBatchSuppliedTotal = fi.deliveryChallans.reduce((sum, dc) => {
        let count = 0;
        const from = parseInt(dc.subSerialNumberFrom, 10);
        const to = parseInt(dc.subSerialNumberTo, 10);
        if (!isNaN(from) && !isNaN(to)) {
          count = to - from + 1;
        } else if (dc.selectedTransformers && Array.isArray(dc.selectedTransformers)) {
          count = dc.selectedTransformers.length;
        } else if (dc.repairedSerialNumbers && Array.isArray(dc.repairedSerialNumbers)) {
          count = dc.repairedSerialNumbers.length;
        }
        return sum + count;
      }, 0);

      const totalQuantity = fi.deliverySchedule?.totalQuantity || 0;
      const dsList = fi.deliverySchedule?.deliverySchedule || [];
      
      const dateFormatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const firstDayOfCurrentMonthReal = new Date(today.getFullYear(), today.getMonth(), 1);
      const pendingSchedules = (Array.isArray(dsList) ? dsList : [])
        .filter(s => {
          const endDate = new Date(s.end);
          return endDate >= firstDayOfCurrentMonthReal;
        })
        .map(s => {
          const startStr = dateFormatter.format(new Date(s.start));
          const endStr = dateFormatter.format(new Date(s.end));
          return {
            schedule: `${startStr} - ${endStr}`,
            quantity: s.quantity
          };
        });

      const currentMonthScheduleEntry = (Array.isArray(dsList) ? dsList : [])
        .find(s => {
          const startDate = new Date(s.start);
          const endDate = new Date(s.end);
          const d = new Date(referenceDate);
          d.setHours(0,0,0,0);
          const st = new Date(startDate);
          st.setHours(0,0,0,0);
          const en = new Date(endDate);
          en.setHours(23,59,59,999);
          return d >= st && d <= en;
        });
      
      const plannedForMonth = currentMonthScheduleEntry ? parseFloat(currentMonthScheduleEntry.quantity) : 0;
      
      // Calculate Cumulative Target till the end of the ACTIVE schedule
      let cumulativePlannedQuantity = 0;
      if (currentMonthScheduleEntry) {
        const currentEnd = new Date(currentMonthScheduleEntry.end);
        cumulativePlannedQuantity = (Array.isArray(dsList) ? dsList : [])
          .filter(s => new Date(s.end) <= currentEnd)
          .reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0);
      } else {
        const filterEndDate = new Date(filterYear, filterMonth + 1, 0);
        cumulativePlannedQuantity = (Array.isArray(dsList) ? dsList : [])
          .filter(s => new Date(s.end) <= filterEndDate)
          .reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0);
      }

      const totalSupplyDueInCurrentMonth = Math.max(0, cumulativePlannedQuantity - projectTotalSupplied);
      const balanceDueToBeInspectedInCurrentMonth = Math.max(0, cumulativePlannedQuantity - projectTotalInspected);
      const balancePending = totalQuantity - projectTotalSupplied;

      return {
        id: fi.id,
        companyName: fi.supplyTender?.company?.name || "N/A",
        discom: fi.supplyTender?.name || "N/A",
        deliverySchedule: {
          tnNumber: fi.deliverySchedule?.tnNumber || "N/A",
          rating: fi.deliverySchedule?.rating,
          phase: fi.deliverySchedule?.phase,
          wound: fi.deliverySchedule?.wound,
          status: fi.status || "Active",
          scheduleDate: fi.deliverySchedule?.deliveryScheduleDate,
          totalOrderQuantity: totalQuantity,
        },
        offeredDate: fi.offerDate,
        offeredQuantity: fi.offeredQuantity,
        serialNumberFrom: fi.serialNumberFrom,
        serialNumberTo: fi.serialNumberTo,
        snNumber: `${fi.serialNumberFrom || ""} TO ${fi.serialNumberTo || ""}`,
        quantityPerMonthInSchedule: pendingSchedules,
        totalSupplyDueInCurrentMonth,
        offeredForInspectionTotal: fi.offeredQuantity || 0,
        finalInspectionTotal: fi.inspectedQuantity || 0,
        actualSuppliedTotal: currentBatchSuppliedTotal,
        balanceDueToBeInspectedInCurrentMonth,
        balancePending,
        plannedForMonth: plannedForMonth, 
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
        diNo: { not: null },
        diDate: { not: null },
      },
      include: {
        deliverySchedule: {
          include: { tn: true },
        },
        supplyTender: {
          include: { company: true },
        },
        deliveryChallans: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const parseOtherSerials = (str) => {
      const serials = new Set();
      if (!str) return serials;
      str.split(",").forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes("-")) {
          const [start, end] = trimmed.split("-").map(n => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) serials.add(String(i));
          }
        } else if (trimmed) {
          serials.add(trimmed);
        }
      });
      return serials;
    };

    const response = finalInspections.map((inspection) => {
      const challans = inspection.deliveryChallans || [];
      
      // Build a set of ALL serial numbers ever dispatched in this inspection
      const allDispatchedSerials = new Set();
      challans.forEach(dc => {
        // 1. New Transformers range
        const from = parseInt(dc.subSerialNumberFrom, 10);
        const to = parseInt(dc.subSerialNumberTo, 10);
        if (!isNaN(from) && !isNaN(to)) {
          for (let i = from; i <= to; i++) allDispatchedSerials.add(String(i));
        }
        // 2. Selected Transformers list
        if (dc.selectedTransformers && Array.isArray(dc.selectedTransformers)) {
          dc.selectedTransformers.forEach(s => allDispatchedSerials.add(String(s)));
        }
        // 3. Repaired Serial Numbers
        if (dc.repairedSerialNumbers && Array.isArray(dc.repairedSerialNumbers)) {
          dc.repairedSerialNumbers.forEach(s => allDispatchedSerials.add(String(s)));
        }
        // 4. Other Consignee Serial Numbers
        const others = parseOtherSerials(dc.otherConsigneeSerialNumbers);
        others.forEach(s => allDispatchedSerials.add(s));
      });

      const consignees = (inspection.consignees || []).map((item) => {
        const assignedSerials = new Set();
        // Parse assigned range
        if (item.subSnNumber) {
          if (item.subSnNumber.includes(" TO ")) {
            const [start, end] = item.subSnNumber.split(" TO ").map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) assignedSerials.add(String(i));
            }
          } else {
            assignedSerials.add(item.subSnNumber.trim());
          }
        }
        // Parse assigned repaired IDs
        if (item.repairedTransformerIds && Array.isArray(item.repairedTransformerIds)) {
          item.repairedTransformerIds.forEach(id => assignedSerials.add(String(id)));
        }

        // Dispatch for this specific consignee is the intersection of assigned and dispatched
        let dispatchCount = 0;
        assignedSerials.forEach(s => {
          if (allDispatchedSerials.has(s)) dispatchCount++;
        });

        return {
          consignee: { name: item.consigneeName, id: item.consigneeId },
          quantity: item.quantity,
          dispatch: dispatchCount,
          pending: Math.max(0, item.quantity - dispatchCount),
          subSnNumber: item.subSnNumber,
        };
      });

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
