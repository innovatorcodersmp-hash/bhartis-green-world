/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/reports/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established TypeScript interfaces and data contracts for Executive Reports & Audits Analytics.
 *    - Defined 5 practical nursery business category tabs:
 *      1. `sales`: Retail POS invoices, Cash / UPI / Udhar revenue breakdown, customer profile.
 *      2. `purchases`: Procurement batches (`BGW-BAT-...`), suppliers, received pots, unit cost, total investment.
 *      3. `stock_damage`: Plant cultivar stock (`BGW-PLT-...`), ready-to-sell pots, damaged/dead pots, damage loss ₹, stock valuation.
 *      4. `udhar`: Customer credit ledger, unpaid retail bills & landscaping dues, collection history, pending balances.
 *      5. `contracts`: Landscaping project agreements (`BGW-CNT-...`), client, site/area, estimates, advances, pending balance, progress stage.
 *    - Added `ReportDateRange` filters (`today`, `week`, `month`, `all`) for dynamic date-scoped analytics.
 *    - Clamped stock valuations to eliminate negative valuation bugs from negative stock counts.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REDESIGN REPORTS DASHBOARD WITH PRACTICAL NURSERY CATEGORIES, DATE FILTERS, AND CLEAN PDF EXPORT".
 *    - Fulfills Specification 01: "Mobile-First PWA Layout Efficiency" & Specification 04: "Strict CRUD & Type Consistency".
 *    - Gives nursery proprietors in Kolhapur operational and financial clarity across procurement, mortality, retail, and site projects.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript domain types.
 *    - Prisma enums (`PaymentMode`, `PlantCategory`, `ProjectType`, `ContractStage`).
 * 
 * 4. HOW IT WORKS:
 *    - Server actions aggregate data conforming to these contracts.
 *    - The `<ReportsDashboard>` client component consumes them for real-time date filtering, KPI recalculations, vector PDF generation, and tabular review.
 * 
 * ----------------------------------------------------------------------------
 */

import { PaymentMode, PlantCategory, ProjectType, ContractStage } from '@prisma/client';

// ============================================================================
// 1. REPORT TABS & DATE RANGE ENUMERATIONS
// ============================================================================

export type ReportTab =
  | 'sales'
  | 'purchases'
  | 'stock_damage'
  | 'udhar'
  | 'contracts';

export type ReportDateRange = 'today' | 'week' | 'month' | 'all';

// ============================================================================
// 2. TAB 1: SALES & REVENUE REPORT INTERFACES
// ============================================================================

export interface SalesReportItem {
  id: string;
  billNumber: string;
  customerName: string;
  customerPhone?: string | null;
  totalAmount: number;
  paymentMode: PaymentMode;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
  itemCount: number;
}

export interface PaymentModeBreakdown {
  cash: number;
  upi: number;
  creditUdhar: number;
}

export interface SalesReportSummary {
  totalPOSSales: number;
  netRevenue: number;
  totalDiscount: number;
  totalBillsCount: number;
  cashVsUpi: PaymentModeBreakdown;
  recentSales: SalesReportItem[];
}

// ============================================================================
// 3. TAB 2: PURCHASE & BATCHES REPORT INTERFACES
// ============================================================================

export interface PurchaseBatchReportItem {
  id: string;
  batchNumber: string;
  purchaseDate: string;
  plantId: string;
  plantSku: string;
  plantName: string;
  plantCategory: PlantCategory;
  vendorId?: string | null;
  vendorName: string;
  vendorPhone?: string | null;
  initialQty: number; // Received pots
  currentQty: number; // Ready / active pots
  mortalityQty: number; // Damaged / dead pots
  unitCostPrice: number; // Cost per pot
  totalInvestment: number; // initialQty * unitCostPrice
  createdAt: string;
}

export interface PurchasesReportSummary {
  totalInvestment: number;
  totalBatchesCount: number;
  totalReceivedPots: number;
  totalActivePots: number;
  totalMortalityPots: number;
  averageCostPerPot: number;
  batches: PurchaseBatchReportItem[];
}

// ============================================================================
// 4. TAB 3: STOCK & DAMAGE LOSS REPORT INTERFACES
// ============================================================================

export interface StockDamageReportItem {
  id: string;
  sku: string;
  name: string;
  marathiName?: string | null;
  category: PlantCategory;
  readyStock: number; // Clamped Math.max(0, stockCount)
  rawStock: number; // Actual raw count in database (could be negative)
  damagedPots: number; // Mortality across batches
  damageLoss: number; // damagedPots * costPrice
  price: number; // Retail selling price
  costPrice: number; // Procurement / propagation cost
  stockValuation: number; // readyStock * price (clamped non-negative)
  costValuation: number; // readyStock * costPrice (clamped non-negative)
  polyhouseNo?: string | null;
  createdAt: string;
}

export interface StockDamageReportSummary {
  totalReadyStock: number;
  totalStockValuation: number;
  totalCostValuation: number;
  potentialProfit: number;
  totalDamagedPots: number;
  totalDamageLoss: number;
  items: StockDamageReportItem[];
}

// ============================================================================
// 5. TAB 4: CUSTOMER UDHAR & DUES INTERFACES
// ============================================================================

export interface CustomerUdharItem {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  totalBilled: number;
  totalPaid: number;
  totalUdharDue: number; // Outstanding balance
  billCount: number;
  lastBillDate?: string | null;
  createdAt: string;
}

export interface UdharLedgerSummary {
  totalCustomerUdhar: number;
  customersWithUdharCount: number;
  totalCustomersCount: number;
  pendingVendorPayables: number;
  totalVendorsCount: number;
  topDebtors: CustomerUdharItem[];
}

// ============================================================================
// 6. TAB 5: LANDSCAPING CONTRACTS ANALYTICS INTERFACES
// ============================================================================

export interface ContractAnalyticsItem {
  id: string;
  contractNo: string;
  customerName: string;
  customerPhone?: string | null;
  siteAddress: string;
  projectType: ProjectType;
  plotSize: string;
  totalEstimate: number;
  advanceReceived: number;
  balanceAmount: number;
  currentStage: ContractStage;
  progressPercent: number;
  createdAt: string;
}

export interface ContractStageDistribution {
  sitePrep: number;
  planting: number;
  irrigationSetup: number;
  maintenanceHandover: number;
}

export interface ContractAnalyticsSummary {
  totalContractRevenue: number;
  totalAdvanceCollected: number;
  balancePending: number;
  totalProjectsCount: number;
  activeProjectsCount: number;
  completedProjectsCount: number;
  stageDistribution: ContractStageDistribution;
  projectList: ContractAnalyticsItem[];
}

// ============================================================================
// 7. COMPATIBILITY & MASTER EXECUTIVE REPORT SUMMARY
// ============================================================================

export interface LowStockPlantItem {
  id: string;
  sku: string;
  name: string;
  marathiName?: string | null;
  category: PlantCategory;
  stockCount: number;
  price: number;
  costPrice: number;
  polyhouseNo?: string | null;
}

export interface TopSellingCultivar {
  plantId: string;
  sku: string;
  name: string;
  category: PlantCategory;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface CategoryStockDistribution {
  category: PlantCategory;
  varietyCount: number;
  totalQuantity: number;
  retailValuation: number;
}

export interface InventoryAuditSummary {
  totalStockValue: number;
  totalCostValue: number;
  potentialProfit: number;
  totalPlantVarieties: number;
  totalUnitsInStock: number;
  lowStockVarieties: LowStockPlantItem[];
  topSellingCultivars: TopSellingCultivar[];
  categoryDistribution: CategoryStockDistribution[];
}

export interface ExecutiveReportSummary {
  sales: SalesReportSummary;
  purchases: PurchasesReportSummary;
  stockDamage: StockDamageReportSummary;
  inventory: InventoryAuditSummary; // Backwards compatibility
  udhar: UdharLedgerSummary;
  contracts: ContractAnalyticsSummary;
  generatedAt: string;
}
