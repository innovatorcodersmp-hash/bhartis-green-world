/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/dashboard/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established TypeScript interfaces and data contracts for the Live Nursery Command Center Dashboard.
 *    - Defined structured models for:
 *      * Today's Counter Sales & 7-Day Daily Sales Trend.
 *      * Payment Mode Breakdown (Cash vs. UPI vs. Udhar collections).
 *      * Customer Udhar Overview & top overdue accounts.
 *      * Live Stock Overview & low-stock restock alerts (<= 10 pots).
 *      * Top 5 Bestselling Botanical Cultivars.
 *      * Landscaping Projects active pipeline status.
 *      * Recent counter billing activity.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: BUILD LIVE NURSERY COMMAND CENTER DASHBOARD WITH BOTANICAL GRAPHS & ACTIONABLE WIDGETS".
 *    - Fulfills Specification 01: "Clean card UI, compact spacing, botanical flower color palette" & Specification 04.
 *    - Provides end-to-end type safety between Prisma database aggregation and interactive SVG chart widgets.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript interfaces.
 *    - Prisma enums (`PaymentMode`, `PlantCategory`, `ContractStage`).
 * 
 * 4. HOW IT WORKS:
 *    - `dashboardActions.ts` queries PostgreSQL and compiles these types into `NurseryDashboardMetrics`.
 *    - `<NurseryDashboard>` consumes these structures to render SVG graphs, KPI cards, and actionable lists.
 * 
 * ----------------------------------------------------------------------------
 */

import { PaymentMode, PlantCategory, ContractStage } from '@prisma/client';

export interface DailySalesTrend {
  date: string; // ISO date string (YYYY-MM-DD)
  dayLabel: string; // Short day label, e.g., "14 Nov", "Mon"
  revenue: number; // Daily revenue in ₹
  billCount: number; // Count of bills processed
}

export interface PaymentModeDistribution {
  cash: number;
  upi: number;
  udhar: number;
  total: number;
  cashPercent: number;
  upiPercent: number;
  udharPercent: number;
}

export interface TopOverdueCustomer {
  id: string;
  name: string;
  phone: string;
  totalUdharDue: number;
  lastBillDate?: string | null;
}

export interface LowStockAlertItem {
  id: string;
  sku: string;
  name: string;
  marathiName?: string | null;
  category: PlantCategory;
  stockCount: number; // <= 10 pots
  price: number;
  costPrice: number;
  polyhouseNo?: string | null;
}

export interface BestsellingPlantItem {
  plantId: string;
  sku: string;
  name: string;
  marathiName?: string | null;
  category: PlantCategory;
  totalSold: number;
  revenue: number;
}

export interface RecentInvoiceItem {
  id: string;
  billNumber: string;
  customerName: string;
  customerPhone?: string | null;
  paymentMode: PaymentMode;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  itemCount: number;
  createdAt: string;
}

export interface NurseryDashboardMetrics {
  todaySales: {
    revenue: number;
    billCount: number;
  };
  salesTrend7Days: DailySalesTrend[];
  paymentModeBreakdown: PaymentModeDistribution;
  udharOverview: {
    totalPendingUdhar: number;
    overdueCustomersCount: number;
    topOverdueCustomers: TopOverdueCustomer[];
  };
  inventoryOverview: {
    totalReadyPots: number;
    totalPlantVarieties: number;
    lowStockCount: number;
    lowStockAlerts: LowStockAlertItem[];
  };
  bestsellingPlants: BestsellingPlantItem[];
  contractsOverview: {
    activeProjectsCount: number;
    totalProjectsCount: number;
    pipelineEstimate: number;
    totalAdvanceCollected: number;
    pendingBalance: number;
  };
  recentInvoices: RecentInvoiceItem[];
  generatedAt: string;
}

