/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/dashboard/actions/dashboardActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built Next.js Server Action `getNurseryDashboardMetricsAction()` to aggregate real live metrics across all nursery operations:
 *      * Today's Counter Sales (revenue ₹ and bill count) & 7-Day Daily Sales Trend array.
 *      * Payment Mode Breakdown (Cash vs. UPI vs. Udhar collections with percentages).
 *      * Total Pending Customer Udhar (retail + landscaping dues) & top overdue debtors.
 *      * Total Ready-to-Sell Pots across Plant Master (clamped non-negative) & Low-Stock Alerts (<= 10 pots).
 *      * Top 5 Bestselling Botanical Cultivars by sales volume and revenue.
 *      * Active Landscaping Contracts pipeline count & valuation.
 *      * Recent 5 POS Invoices with customer name, payment mode, amount, and timestamp.
 *    - Executed concurrent queries inside `Promise.all()` with zero raw SQL.
 *    - Wrapped in strict `try-catch` returning `ActionResult<NurseryDashboardMetrics>`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: BUILD LIVE NURSERY COMMAND CENTER DASHBOARD WITH BOTANICAL GRAPHS & ACTIONABLE WIDGETS".
 *    - Fulfills Specification 04: "Next.js Server Actions First", "Zero Raw SQL", "Mandatory Try-Catch".
 *    - Supplies the nursery command center with real-time operational feedback upon first render.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM transactional query builder (`prisma` client).
 *    - Universal domain enums (`PaymentMode`, `PlantCategory`, `ContractStage`).
 *    - TypeScript domain types from `@/modules/dashboard/types`.
 * 
 * 4. HOW IT WORKS:
 *    - Executes on server engine, builds date boundaries for today and the 7-day rolling window,
 *      aggregates sales, inventory, credit, and contract metrics, and returns structured payload.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { PaymentMode, PlantCategory, ContractStage } from '@prisma/client';
import {
  NurseryDashboardMetrics,
  DailySalesTrend,
  PaymentModeDistribution,
  TopOverdueCustomer,
  LowStockAlertItem,
  BestsellingPlantItem,
  RecentInvoiceItem,
} from '../types';

export async function getNurseryDashboardMetricsAction(): Promise<
  ActionResult<NurseryDashboardMetrics>
> {
  try {
    const now = new Date();

    // 1. Concurrently fetch all primary operational entities
    const [bills, plants, customers, contracts] = await Promise.all([
      prisma.posBill.findMany({
        where: {
          status: {
            not: 'ARCHIVED',
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              plant: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.plant.findMany({
        where: {
          status: {
            not: 'ARCHIVED',
          },
        },
        include: {
          inventoryBatches: {
            where: {
              status: { not: 'ARCHIVED' },
            },
            select: {
              currentQty: true,
            },
          },
        },
        orderBy: {
          stockCount: 'asc',
        },
      }),
      prisma.customer.findMany({
        where: {
          status: {
            not: 'ARCHIVED',
          },
        },
        include: {
          posBills: {
            where: { status: { not: 'ARCHIVED' } },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          contracts: {
            where: { status: { not: 'ARCHIVED' } },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: {
          totalUdharDue: 'desc',
        },
      }),
      prisma.gardenContract.findMany({
        where: {
          status: {
            not: 'ARCHIVED',
          },
        },
        include: {
          customer: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // ========================================================================
    // 2. TODAY'S SALES & 7-DAY ROLLING TREND
    // ========================================================================
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let todayRevenue = 0;
    let todayBillCount = 0;

    // Build 7-day rolling buckets (from 6 days ago up to today)
    const dailyTrendMap = new Map<string, { revenue: number; billCount: number; dayLabel: string }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
      const dayLabel = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
      dailyTrendMap.set(dateKey, { revenue: 0, billCount: 0, dayLabel });
    }

    // Payment Mode Breakdown
    let totalCash = 0;
    let totalUpi = 0;
    let totalUdhar = 0;

    // Track Plant Sales for Bestselling Leaderboard
    const plantSalesMap = new Map<
      string,
      {
        plantId: string;
        sku: string;
        name: string;
        marathiName?: string | null;
        category: PlantCategory;
        quantity: number;
        revenue: number;
      }
    >();

    for (const bill of bills) {
      const billDate = new Date(bill.createdAt);
      const dateKey = billDate.toISOString().slice(0, 10);

      // Check today's sales
      if (billDate >= startOfToday && billDate <= endOfToday) {
        todayRevenue += bill.totalAmount;
        todayBillCount += 1;
      }

      // Check 7-day trend
      if (dailyTrendMap.has(dateKey)) {
        const entry = dailyTrendMap.get(dateKey)!;
        entry.revenue += bill.totalAmount;
        entry.billCount += 1;
      }

      // Payment Mode Breakdown
      if (bill.paymentMode === PaymentMode.CASH) {
        totalCash += bill.amountPaid;
      } else if (bill.paymentMode === PaymentMode.UPI) {
        totalUpi += bill.amountPaid;
      } else if (bill.paymentMode === PaymentMode.CREDIT_UDHAR) {
        totalUdhar += bill.balanceDue;
        if (bill.amountPaid > 0) {
          totalCash += bill.amountPaid;
        }
      }

      // Aggregate item quantities
      for (const line of bill.items) {
        if (!line.plant) continue;
        const existing = plantSalesMap.get(line.plantId);
        if (existing) {
          existing.quantity += line.quantity;
          existing.revenue += line.totalPrice;
        } else {
          plantSalesMap.set(line.plantId, {
            plantId: line.plantId,
            sku: line.plant.sku,
            name: line.plant.name,
            marathiName: line.plant.marathiName,
            category: line.plant.category,
            quantity: line.quantity,
            revenue: line.totalPrice,
          });
        }
      }
    }

    const salesTrend7Days: DailySalesTrend[] = Array.from(dailyTrendMap.entries()).map(
      ([date, data]) => ({
        date,
        dayLabel: data.dayLabel,
        revenue: Number(data.revenue.toFixed(2)),
        billCount: data.billCount,
      })
    );

    const grandTotalCollections = totalCash + totalUpi + totalUdhar;
    const paymentModeBreakdown: PaymentModeDistribution = {
      cash: Number(totalCash.toFixed(2)),
      upi: Number(totalUpi.toFixed(2)),
      udhar: Number(totalUdhar.toFixed(2)),
      total: Number(grandTotalCollections.toFixed(2)),
      cashPercent: grandTotalCollections > 0 ? Math.round((totalCash / grandTotalCollections) * 100) : 0,
      upiPercent: grandTotalCollections > 0 ? Math.round((totalUpi / grandTotalCollections) * 100) : 0,
      udharPercent: grandTotalCollections > 0 ? Math.round((totalUdhar / grandTotalCollections) * 100) : 0,
    };

    // ========================================================================
    // 3. TOP 5 BESTSELLING BOTANICAL CULTIVARS
    // ========================================================================
    const bestsellingPlants: BestsellingPlantItem[] = Array.from(plantSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((p) => ({
        plantId: p.plantId,
        sku: p.sku,
        name: p.name,
        marathiName: p.marathiName,
        category: p.category,
        totalSold: p.quantity,
        revenue: Number(p.revenue.toFixed(2)),
      }));

    // ========================================================================
    // 4. INVENTORY OVERVIEW & LOW-STOCK RESTOCK ALERTS (<= 10 POTS)
    // ========================================================================
    let totalReadyPots = 0;
    const lowStockAlerts: LowStockAlertItem[] = [];

    for (const plant of plants) {
      // Calculate effective stock: direct synced stockCount or dynamic sum of active batches
      const batchStockSum = plant.inventoryBatches?.reduce(
        (acc: number, b: { currentQty: number }) => acc + b.currentQty,
        0
      );
      const effectiveStock =
        typeof batchStockSum === 'number' && plant.inventoryBatches && plant.inventoryBatches.length > 0
          ? batchStockSum
          : plant.stockCount;

      // Clamp negative stock counts to zero
      const readyPots = Math.max(0, effectiveStock);
      totalReadyPots += readyPots;

      if (effectiveStock <= 10) {
        lowStockAlerts.push({
          id: plant.id,
          sku: plant.sku,
          name: plant.name,
          marathiName: plant.marathiName,
          category: plant.category,
          stockCount: effectiveStock,
          price: plant.price,
          costPrice: plant.costPrice,
          polyhouseNo: plant.polyhouseNo,
        });
      }
    }

    // Sort low stock alerts by lowest stock first
    lowStockAlerts.sort((a, b) => a.stockCount - b.stockCount);

    // ========================================================================
    // 5. CUSTOMER UDHAR OVERVIEW & TOP OVERDUE CLIENTS
    // ========================================================================
    let totalPendingUdhar = 0;
    const overdueCustomers: TopOverdueCustomer[] = [];

    for (const c of customers) {
      if (c.totalUdharDue > 0) {
        totalPendingUdhar += c.totalUdharDue;

        const latestPOS = c.posBills[0]?.createdAt;
        const latestContract = c.contracts[0]?.createdAt;
        let lastDate: Date | null = null;
        if (latestPOS && latestContract) {
          lastDate = latestPOS > latestContract ? latestPOS : latestContract;
        } else if (latestPOS) {
          lastDate = latestPOS;
        } else if (latestContract) {
          lastDate = latestContract;
        }

        overdueCustomers.push({
          id: c.id,
          name: c.name,
          phone: c.phone,
          totalUdharDue: Number(c.totalUdharDue.toFixed(2)),
          lastBillDate: lastDate ? lastDate.toISOString() : c.createdAt.toISOString(),
        });
      }
    }

    overdueCustomers.sort((a, b) => b.totalUdharDue - a.totalUdharDue);

    // ========================================================================
    // 6. LANDSCAPING CONTRACTS OVERVIEW
    // ========================================================================
    let activeProjectsCount = 0;
    let pipelineEstimate = 0;
    let totalAdvanceCollected = 0;
    let pendingBalance = 0;

    for (const contract of contracts) {
      pipelineEstimate += contract.totalEstimate;
      totalAdvanceCollected += contract.advanceReceived;
      pendingBalance += contract.balanceAmount;

      const isCompleted =
        contract.currentStage === ContractStage.MAINTENANCE_HANDOVER ||
        contract.progressPercent >= 100;
      if (!isCompleted) {
        activeProjectsCount += 1;
      }
    }

    // ========================================================================
    // 7. RECENT 5 COUNTER POS BILLS
    // ========================================================================
    const recentInvoices: RecentInvoiceItem[] = bills.slice(0, 5).map((bill) => ({
      id: bill.id,
      billNumber: bill.billNumber,
      customerName: bill.customer?.name || 'Walk-in Retail Buyer',
      customerPhone: bill.customer?.phone || null,
      paymentMode: bill.paymentMode,
      totalAmount: bill.totalAmount,
      amountPaid: bill.amountPaid,
      balanceDue: bill.balanceDue,
      itemCount: bill.items.reduce((acc, curr) => acc + curr.quantity, 0),
      createdAt: bill.createdAt.toISOString(),
    }));

    const metrics: NurseryDashboardMetrics = {
      todaySales: {
        revenue: Number(todayRevenue.toFixed(2)),
        billCount: todayBillCount,
      },
      salesTrend7Days,
      paymentModeBreakdown,
      udharOverview: {
        totalPendingUdhar: Number(totalPendingUdhar.toFixed(2)),
        overdueCustomersCount: overdueCustomers.length,
        topOverdueCustomers: overdueCustomers.slice(0, 5),
      },
      inventoryOverview: {
        totalReadyPots,
        totalPlantVarieties: plants.length,
        lowStockCount: lowStockAlerts.length,
        lowStockAlerts: lowStockAlerts.slice(0, 5),
      },
      bestsellingPlants,
      contractsOverview: {
        activeProjectsCount,
        totalProjectsCount: contracts.length,
        pipelineEstimate: Number(pipelineEstimate.toFixed(2)),
        totalAdvanceCollected: Number(totalAdvanceCollected.toFixed(2)),
        pendingBalance: Number(pendingBalance.toFixed(2)),
      },
      recentInvoices,
      generatedAt: now.toISOString(),
    };

    return {
      success: true,
      data: metrics,
    };
  } catch (error) {
    console.error('Failed to compile nursery dashboard command center metrics:', error);
    return {
      success: false,
      error: 'Unable to load live nursery metrics. Please check database connectivity.',
    };
  }
}

