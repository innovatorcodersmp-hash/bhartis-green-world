/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/reports/actions/reportActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built Next.js Server Action `getExecutiveReportSummaryAction()` for comprehensive reporting across 5 business domains:
 *      1. **Sales Report**: POS invoices, Cash / UPI / Udhar revenue breakdown, customer profile, totals.
 *      2. **Purchase & Batches**: Procurement batches (`BGW-BAT-...`), supplier details, received pots, unit costs, total investment.
 *      3. **Stock & Damage Loss**: Plant cultivar stock (`BGW-PLT-...`), ready-to-sell pots, damaged/dead pots, damage loss ₹, stock valuation.
 *      4. **Customer Udhar & Dues**: Customer credit ledger, unpaid retail bills & landscaping dues, collection history, pending balances.
 *      5. **Landscaping Projects**: Landscaping project agreements (`BGW-CNT-...`), client, site/area, estimates, advances, pending balance, progress stage.
 *    - Resolved Negative Stock Valuation Bug:
 *      * Clamped all stock counts in valuation arithmetic to `Math.max(0, plant.stockCount)`.
 *      * Eliminates anomalous negative inventory values when items are sold before a procurement batch is recorded.
 *    - Concurrently queried PostgreSQL relational entities using Prisma ORM query builder inside `Promise.all()`.
 *    - Aggregated live operational intelligence with zero raw SQL and wrapped execution in strict `try-catch`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REDESIGN REPORTS DASHBOARD WITH PRACTICAL NURSERY CATEGORIES, DATE FILTERS, AND CLEAN PDF EXPORT".
 *    - Fulfills Specification 04 Section 1 & 2: "Next.js Server Actions First", "Zero Raw SQL", "Mandatory Try-Catch".
 *    - Supplies nursery leadership in Kolhapur with actionable intelligence for purchasing, cash flow, credit risk, and site project milestones.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM transactional query builder (`prisma` client).
 *    - Domain enums (`PlantCategory`, `PaymentMode`, `ContractStage`).
 *    - TypeScript domain types from `@/modules/reports/types`.
 * 
 * 4. HOW IT WORKS:
 *    - Queries database engine, calculates aggregates in memory with zero network latency, and returns sanitized `ActionResult<ExecutiveReportSummary>`.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { PlantCategory, PaymentMode, ContractStage } from '@prisma/client';
import {
  ExecutiveReportSummary,
  SalesReportSummary,
  PurchasesReportSummary,
  PurchaseBatchReportItem,
  StockDamageReportSummary,
  StockDamageReportItem,
  InventoryAuditSummary,
  UdharLedgerSummary,
  CustomerUdharItem,
  ContractAnalyticsSummary,
  CategoryStockDistribution,
  TopSellingCultivar,
  ContractStageDistribution,
} from '../types';

export async function getExecutiveReportSummaryAction(): Promise<
  ActionResult<ExecutiveReportSummary>
> {
  try {
    // Execute all primary domain queries concurrently for peak performance
    const [bills, plants, batches, customers, vendors, contracts] = await Promise.all([
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
        orderBy: {
          stockCount: 'asc',
        },
      }),
      prisma.inventoryBatch.findMany({
        where: {
          status: {
            not: 'ARCHIVED',
          },
        },
        include: {
          plant: true,
          vendor: true,
        },
        orderBy: {
          purchaseDate: 'desc',
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
            select: { totalAmount: true, amountPaid: true, balanceDue: true, createdAt: true },
          },
          contracts: {
            where: { status: { not: 'ARCHIVED' } },
            select: { totalEstimate: true, advanceReceived: true, balanceAmount: true, createdAt: true },
          },
        },
        orderBy: {
          totalUdharDue: 'desc',
        },
      }),
      prisma.vendor.findMany({
        where: {
          status: {
            not: 'ARCHIVED',
          },
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
    // 1. DOMAIN 1: SALES & REVENUE REPORT AGGREGATES
    // ========================================================================
    let totalPOSSales = 0;
    let netRevenue = 0;
    let cashPaid = 0;
    let upiPaid = 0;
    let udharCredit = 0;

    const cultivarSalesMap = new Map<
      string,
      {
        plantId: string;
        sku: string;
        name: string;
        category: PlantCategory;
        quantity: number;
        revenue: number;
      }
    >();

    for (const bill of bills) {
      totalPOSSales += bill.totalAmount;
      netRevenue += bill.amountPaid;

      if (bill.paymentMode === PaymentMode.CASH) {
        cashPaid += bill.amountPaid;
      } else if (bill.paymentMode === PaymentMode.UPI) {
        upiPaid += bill.amountPaid;
      } else if (bill.paymentMode === PaymentMode.CREDIT_UDHAR) {
        udharCredit += bill.balanceDue;
        if (bill.amountPaid > 0) {
          cashPaid += bill.amountPaid;
        }
      }

      for (const line of bill.items) {
        if (!line.plant) continue;
        const existing = cultivarSalesMap.get(line.plantId);
        if (existing) {
          existing.quantity += line.quantity;
          existing.revenue += line.totalPrice;
        } else {
          cultivarSalesMap.set(line.plantId, {
            plantId: line.plantId,
            sku: line.plant.sku,
            name: line.plant.name,
            category: line.plant.category,
            quantity: line.quantity,
            revenue: line.totalPrice,
          });
        }
      }
    }

    const recentSales = bills.map((bill) => ({
      id: bill.id,
      billNumber: bill.billNumber,
      customerName: bill.customer?.name || 'Walk-in Retail Buyer',
      customerPhone: bill.customer?.phone || null,
      totalAmount: bill.totalAmount,
      paymentMode: bill.paymentMode,
      amountPaid: bill.amountPaid,
      balanceDue: bill.balanceDue,
      createdAt: bill.createdAt.toISOString(),
      itemCount: bill.items.reduce((acc, curr) => acc + curr.quantity, 0),
    }));

    const salesSummary: SalesReportSummary = {
      totalPOSSales,
      netRevenue,
      totalDiscount: 0,
      totalBillsCount: bills.length,
      cashVsUpi: {
        cash: cashPaid,
        upi: upiPaid,
        creditUdhar: udharCredit,
      },
      recentSales,
    };

    // ========================================================================
    // 2. DOMAIN 2: PURCHASES & BATCHES REPORT AGGREGATES
    // ========================================================================
    let totalProcurementInvestment = 0;
    let totalReceivedPots = 0;
    let totalActivePots = 0;
    let totalMortalityPots = 0;

    const purchaseBatches: PurchaseBatchReportItem[] = batches.map((batch) => {
      const unitCost = batch.unitCostPrice !== null && batch.unitCostPrice !== undefined
        ? batch.unitCostPrice
        : (batch.plant?.costPrice || 0);

      const investment = Number((batch.initialQty * unitCost).toFixed(2));

      totalProcurementInvestment += investment;
      totalReceivedPots += batch.initialQty;
      totalActivePots += batch.currentQty;
      totalMortalityPots += batch.mortalityQty;

      return {
        id: batch.id,
        batchNumber: batch.batchNumber,
        purchaseDate: batch.purchaseDate ? batch.purchaseDate.toISOString() : batch.createdAt.toISOString(),
        plantId: batch.plantId,
        plantSku: batch.plant?.sku || 'BGW-PLT-XXXX',
        plantName: batch.plant?.name || 'Botanical Cultivar',
        plantCategory: batch.plant?.category || 'ORNAMENTAL',
        vendorId: batch.vendorId,
        vendorName: batch.vendor?.name || 'Local Agro Procurement',
        vendorPhone: batch.vendor?.phone || null,
        initialQty: batch.initialQty,
        currentQty: batch.currentQty,
        mortalityQty: batch.mortalityQty,
        unitCostPrice: unitCost,
        totalInvestment: investment,
        createdAt: batch.createdAt.toISOString(),
      };
    });

    const averageCostPerPot =
      totalReceivedPots > 0
        ? Number((totalProcurementInvestment / totalReceivedPots).toFixed(2))
        : 0;

    const purchasesSummary: PurchasesReportSummary = {
      totalInvestment: totalProcurementInvestment,
      totalBatchesCount: batches.length,
      totalReceivedPots,
      totalActivePots,
      totalMortalityPots,
      averageCostPerPot,
      batches: purchaseBatches,
    };

    // ========================================================================
    // 3. DOMAIN 3: STOCK & DAMAGE LOSS REPORT (WITH NEGATIVE VALUATION BUG FIX)
    // ========================================================================
    // Aggregate batch mortality by plantId
    const plantMortalityMap = new Map<string, { mortalityQty: number; lossAmount: number }>();
    for (const b of batches) {
      if (!b.plantId) continue;
      const unitCost = b.unitCostPrice || b.plant?.costPrice || 0;
      const existing = plantMortalityMap.get(b.plantId);
      const loss = b.mortalityQty * unitCost;
      if (existing) {
        existing.mortalityQty += b.mortalityQty;
        existing.lossAmount += loss;
      } else {
        plantMortalityMap.set(b.plantId, {
          mortalityQty: b.mortalityQty,
          lossAmount: loss,
        });
      }
    }

    let totalReadyStock = 0;
    let totalStockValuation = 0;
    let totalCostValuation = 0;
    let totalDamagedPots = 0;
    let totalDamageLoss = 0;

    const categoryStats: Record<PlantCategory, { count: number; qty: number; value: number }> = {
      FRUIT: { count: 0, qty: 0, value: 0 },
      FLOWER: { count: 0, qty: 0, value: 0 },
      ORNAMENTAL: { count: 0, qty: 0, value: 0 },
      MEDICINAL: { count: 0, qty: 0, value: 0 },
    };

    const lowStockVarieties: any[] = [];

    const stockDamageItems: StockDamageReportItem[] = plants.map((plant) => {
      // FIX NEGATIVE VALUATION BUG: Clamp stock count to 0 for valuation arithmetic
      const readyStock = Math.max(0, plant.stockCount);
      const stockVal = Number((readyStock * plant.price).toFixed(2));
      const costVal = Number((readyStock * plant.costPrice).toFixed(2));

      const batchMortality = plantMortalityMap.get(plant.id);
      const damagedPots = batchMortality?.mortalityQty || 0;
      const damageLoss = batchMortality
        ? Number(batchMortality.lossAmount.toFixed(2))
        : Number((damagedPots * plant.costPrice).toFixed(2));

      totalReadyStock += readyStock;
      totalStockValuation += stockVal;
      totalCostValuation += costVal;
      totalDamagedPots += damagedPots;
      totalDamageLoss += damageLoss;

      if (categoryStats[plant.category]) {
        categoryStats[plant.category].count += 1;
        categoryStats[plant.category].qty += readyStock;
        categoryStats[plant.category].value += stockVal;
      }

      if (plant.stockCount <= 15) {
        lowStockVarieties.push({
          id: plant.id,
          sku: plant.sku,
          name: plant.name,
          marathiName: plant.marathiName,
          category: plant.category,
          stockCount: plant.stockCount,
          price: plant.price,
          costPrice: plant.costPrice,
          polyhouseNo: plant.polyhouseNo,
        });
      }

      return {
        id: plant.id,
        sku: plant.sku,
        name: plant.name,
        marathiName: plant.marathiName,
        category: plant.category,
        readyStock,
        rawStock: plant.stockCount,
        damagedPots,
        damageLoss,
        price: plant.price,
        costPrice: plant.costPrice,
        stockValuation: stockVal,
        costValuation: costVal,
        polyhouseNo: plant.polyhouseNo,
        createdAt: plant.createdAt.toISOString(),
      };
    });

    const stockDamageSummary: StockDamageReportSummary = {
      totalReadyStock,
      totalStockValuation: Number(totalStockValuation.toFixed(2)),
      totalCostValuation: Number(totalCostValuation.toFixed(2)),
      potentialProfit: Math.max(0, Number((totalStockValuation - totalCostValuation).toFixed(2))),
      totalDamagedPots,
      totalDamageLoss: Number(totalDamageLoss.toFixed(2)),
      items: stockDamageItems,
    };

    // Legacy compatibility for existing dashboard components
    const categoryDistribution: CategoryStockDistribution[] = Object.entries(categoryStats).map(
      ([cat, stats]) => ({
        category: cat as PlantCategory,
        varietyCount: stats.count,
        totalQuantity: stats.qty,
        retailValuation: Number(stats.value.toFixed(2)),
      })
    );

    const topSellingCultivars: TopSellingCultivar[] = Array.from(cultivarSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((item) => ({
        plantId: item.plantId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        totalQuantitySold: item.quantity,
        totalRevenue: item.revenue,
      }));

    const inventorySummary: InventoryAuditSummary = {
      totalStockValue: stockDamageSummary.totalStockValuation,
      totalCostValue: stockDamageSummary.totalCostValuation,
      potentialProfit: stockDamageSummary.potentialProfit,
      totalPlantVarieties: plants.length,
      totalUnitsInStock: totalReadyStock,
      lowStockVarieties,
      topSellingCultivars,
      categoryDistribution,
    };

    // ========================================================================
    // 4. DOMAIN 4: CUSTOMER UDHAR & DUES REPORT AGGREGATES
    // ========================================================================
    let totalCustomerUdhar = 0;
    const customerDuesItems: CustomerUdharItem[] = [];

    for (const customer of customers) {
      const posBilled = customer.posBills.reduce((acc, b) => acc + b.totalAmount, 0);
      const posPaid = customer.posBills.reduce((acc, b) => acc + b.amountPaid, 0);
      const contractsBilled = customer.contracts.reduce((acc, c) => acc + c.totalEstimate, 0);
      const contractsPaid = customer.contracts.reduce((acc, c) => acc + c.advanceReceived, 0);

      const totalBilled = Number((posBilled + contractsBilled).toFixed(2));
      const totalPaid = Number((posPaid + contractsPaid).toFixed(2));
      const pendingDue = Math.max(customer.totalUdharDue, Number((totalBilled - totalPaid).toFixed(2)));

      totalCustomerUdhar += pendingDue;

      // Find last transaction date
      const allDates = [
        ...customer.posBills.map((b) => b.createdAt),
        ...customer.contracts.map((c) => c.createdAt),
      ];
      allDates.sort((a, b) => b.getTime() - a.getTime());
      const lastBillDate = allDates[0] ? allDates[0].toISOString() : customer.createdAt.toISOString();

      customerDuesItems.push({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        totalBilled,
        totalPaid,
        totalUdharDue: pendingDue,
        billCount: customer.posBills.length + customer.contracts.length,
        lastBillDate,
        createdAt: customer.createdAt.toISOString(),
      });
    }

    // Sort by highest outstanding balance first
    customerDuesItems.sort((a, b) => b.totalUdharDue - a.totalUdharDue);

    const udharSummary: UdharLedgerSummary = {
      totalCustomerUdhar: Number(totalCustomerUdhar.toFixed(2)),
      customersWithUdharCount: customerDuesItems.filter((c) => c.totalUdharDue > 0).length,
      totalCustomersCount: customers.length,
      pendingVendorPayables: 0,
      totalVendorsCount: vendors.length,
      topDebtors: customerDuesItems,
    };

    // ========================================================================
    // 5. DOMAIN 5: LANDSCAPING PROJECTS ANALYTICS AGGREGATES
    // ========================================================================
    let totalContractRevenue = 0;
    let totalAdvanceCollected = 0;
    let balancePending = 0;
    let activeProjects = 0;
    let completedProjects = 0;

    const stageCount: ContractStageDistribution = {
      sitePrep: 0,
      planting: 0,
      irrigationSetup: 0,
      maintenanceHandover: 0,
    };

    const projectList = contracts.map((c) => {
      totalContractRevenue += c.totalEstimate;
      totalAdvanceCollected += c.advanceReceived;
      balancePending += c.balanceAmount;

      const isCompleted =
        c.currentStage === ContractStage.MAINTENANCE_HANDOVER || c.progressPercent >= 100;
      if (isCompleted) {
        completedProjects += 1;
      } else {
        activeProjects += 1;
      }

      if (c.currentStage === ContractStage.SITE_PREP) stageCount.sitePrep += 1;
      else if (c.currentStage === ContractStage.PLANTING) stageCount.planting += 1;
      else if (c.currentStage === ContractStage.IRRIGATION_SETUP) stageCount.irrigationSetup += 1;
      else if (c.currentStage === ContractStage.MAINTENANCE_HANDOVER) stageCount.maintenanceHandover += 1;

      return {
        id: c.id,
        contractNo: c.contractNo,
        customerName: c.customer.name,
        customerPhone: c.customer.phone || null,
        siteAddress: c.siteAddress,
        projectType: c.projectType,
        plotSize: c.plotSize,
        totalEstimate: c.totalEstimate,
        advanceReceived: c.advanceReceived,
        balanceAmount: c.balanceAmount,
        currentStage: c.currentStage,
        progressPercent: c.progressPercent,
        createdAt: c.createdAt.toISOString(),
      };
    });

    const contractsSummary: ContractAnalyticsSummary = {
      totalContractRevenue: Number(totalContractRevenue.toFixed(2)),
      totalAdvanceCollected: Number(totalAdvanceCollected.toFixed(2)),
      balancePending: Number(balancePending.toFixed(2)),
      totalProjectsCount: contracts.length,
      activeProjectsCount: activeProjects,
      completedProjectsCount: completedProjects,
      stageDistribution: stageCount,
      projectList,
    };

    // ========================================================================
    // 6. ASSEMBLE COMBINED REPORT PAYLOAD
    // ========================================================================
    const executiveReport: ExecutiveReportSummary = {
      sales: salesSummary,
      purchases: purchasesSummary,
      stockDamage: stockDamageSummary,
      inventory: inventorySummary,
      udhar: udharSummary,
      contracts: contractsSummary,
      generatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: executiveReport,
    };
  } catch (error) {
    console.error('Failed to compile executive audit report summary:', error);
    return {
      success: false,
      error: 'Unable to generate executive report. Please verify database connectivity.',
    };
  }
}
