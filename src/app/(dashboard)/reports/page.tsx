/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/reports/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for the `/reports` executive analytics cockpit.
 *    - Fetched aggregated financial and operational audit data directly via Server Action `getExecutiveReportSummaryAction()`.
 *    - Rendered the modular `<ReportsDashboard>` client container on a dedicated full-screen layout.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: "Pages inside Next.js app/ are lightweight routing shells (under 50-80 lines of code)".
 *    - Fulfills Specification 01 Section 1.4: "Dedicated Full-Screen Routing (STRICT: NO POPUPS / MODALS)".
 *    - Delivers pre-aggregated PostgreSQL metrics on the server for instant mobile rendering without hydration cascades.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Action `getExecutiveReportSummaryAction`.
 *    - Feature module component `<ReportsDashboard>`.
 * 
 * 4. HOW IT WORKS:
 *    - Runs server-side, compiles live metrics across nursery inventory, sales, Udhar, and contracts,
 *      and hydrates the `<ReportsDashboard>` client component.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getExecutiveReportSummaryAction } from '@/modules/reports/actions';
import { ReportsDashboard } from '@/modules/reports/components';
import { ExecutiveReportSummary } from '@/modules/reports/types';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const result = await getExecutiveReportSummaryAction();

  const emptyFallback: ExecutiveReportSummary = {
    sales: {
      totalPOSSales: 0,
      netRevenue: 0,
      totalDiscount: 0,
      totalBillsCount: 0,
      cashVsUpi: { cash: 0, upi: 0, creditUdhar: 0 },
      recentSales: [],
    },
    purchases: {
      totalInvestment: 0,
      totalBatchesCount: 0,
      totalReceivedPots: 0,
      totalActivePots: 0,
      totalMortalityPots: 0,
      averageCostPerPot: 0,
      batches: [],
    },
    stockDamage: {
      totalReadyStock: 0,
      totalStockValuation: 0,
      totalCostValuation: 0,
      potentialProfit: 0,
      totalDamagedPots: 0,
      totalDamageLoss: 0,
      items: [],
    },
    inventory: {
      totalStockValue: 0,
      totalCostValue: 0,
      potentialProfit: 0,
      totalPlantVarieties: 0,
      totalUnitsInStock: 0,
      lowStockVarieties: [],
      topSellingCultivars: [],
      categoryDistribution: [],
    },
    udhar: {
      totalCustomerUdhar: 0,
      customersWithUdharCount: 0,
      totalCustomersCount: 0,
      pendingVendorPayables: 0,
      totalVendorsCount: 0,
      topDebtors: [],
    },
    contracts: {
      totalContractRevenue: 0,
      totalAdvanceCollected: 0,
      balancePending: 0,
      totalProjectsCount: 0,
      activeProjectsCount: 0,
      completedProjectsCount: 0,
      stageDistribution: {
        sitePrep: 0,
        planting: 0,
        irrigationSetup: 0,
        maintenanceHandover: 0,
      },
      projectList: [],
    },
    generatedAt: new Date().toISOString(),
  };

  const reportData = result.success && result.data ? result.data : emptyFallback;

  return <ReportsDashboard initialData={reportData} />;
}
