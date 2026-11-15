/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/reports/components/ReportsDashboard.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<ReportsDashboard>`, the redesigned executive analytics cockpit for nursery operations.
 *    - Implemented 5 practical business domain tabs:
 *      1. **Sales Report**: Retail POS invoices, Cash / UPI / Udhar collections, customer details, totals.
 *      2. **Purchase & Batches**: Procurement batches (`BGW-BAT-...`), supplier details, received pots, unit cost, total investment.
 *      3. **Stock & Damage Loss**: Plant cultivar stock (`BGW-PLT-...`), ready-to-sell pots, damaged/dead pots, damage loss ₹, stock valuation.
 *      4. **Customer Udhar & Dues**: Customer credit ledger, unpaid retail bills & landscaping dues, collection history, pending balances.
 *      5. **Landscaping Projects**: Landscaping project agreements (`BGW-CNT-...`), client, site/area, estimates, advances, pending balance, progress stage.
 *    - Integrated Date Range Filter bar: Today, This Week, This Month, All Time with dynamic item counts.
 *    - Dynamically recalculates summary KPIs based on active tab and selected date range in real time.
 *    - Built clean vector A4 PDF export via `generateReportPdf()` with organization header, summary KPI box, and grand total footer.
 *    - Built browser print optimization with `@media print` layout and CSV data export.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REDESIGN REPORTS DASHBOARD WITH PRACTICAL NURSERY CATEGORIES, DATE FILTERS, AND CLEAN PDF EXPORT".
 *    - Fulfills Specification 01: Clean UI, compact cards, botanical accent colors, >= 44px touch targets.
 *    - Replaces generic data dumps with actionable financial and operational intelligence for Kolhapur nursery leadership.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 client hooks (`useState`, `useMemo`, `useCallback`).
 *    - TanStack Table v8 column definitions (`ColumnDef`).
 *    - Lucide React icons (`FileDown`, `Printer`, `Download`, `Receipt`, `PackageCheck`, `AlertOctagon`, `Users`, `Trees`, `Calendar`, `Filter`).
 *    - Reusable UI primitives (`DataTable`, `Button`).
 *    - Layout sync hook (`useSetPageHeader`).
 *    - PDF export utility `generateReportPdf`.
 *    - SASS Modules mapped to design tokens (`ReportsDashboard.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Receives `ExecutiveReportSummary` from Server Action.
 *    - Filters active dataset by selected date range and tab client-side for instant zero-latency feedback.
 *    - Exports formatted vector A4 PDF or prints directly.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  FileDown,
  Printer,
  Download,
  Receipt,
  PackageCheck,
  AlertOctagon,
  Users,
  Trees,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { DataTable } from '@/components/datatable';
import { useSetPageHeader } from '@/components/layout';
import {
  ExecutiveReportSummary,
  ReportTab,
  ReportDateRange,
  SalesReportItem,
  PurchaseBatchReportItem,
  StockDamageReportItem,
  CustomerUdharItem,
  ContractAnalyticsItem,
} from '../types';
import { generateReportPdf, ReportPdfColumn, ReportPdfKpi } from '../utils/generateReportPdf';
import styles from './ReportsDashboard.module.scss';

export interface ReportsDashboardProps {
  initialData: ExecutiveReportSummary;
}

// Helper: Check if date string falls within selected date filter range
function isWithinDateRange(dateStr?: string | null, range: ReportDateRange = 'all'): boolean {
  if (range === 'all' || !dateStr) return true;
  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) return true;

  const now = new Date();
  if (range === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return targetDate >= startOfToday;
  }

  if (range === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
    return targetDate >= startOfWeek;
  }

  if (range === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return targetDate >= startOfMonth;
  }

  return true;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ initialData }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<ReportDateRange>('month');

  useSetPageHeader({
    title: 'Reports & Audits Analytics Dashboard',
    subtitle: 'Nursery sales, procurement batches, stock valuation, customer dues, and landscaping projects.',
  });

  // Date Range Human Label
  const dateRangeLabel = useMemo(() => {
    switch (dateRange) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'all':
      default:
        return 'All Time';
    }
  }, [dateRange]);

  // ==========================================================================
  // 1. FILTERED DATASETS & RECALCULATED KPIS PER TAB
  // ==========================================================================

  // --- TAB 1: SALES REPORT ---
  const filteredSales = useMemo(() => {
    return (initialData.sales.recentSales || []).filter((item) =>
      isWithinDateRange(item.createdAt, dateRange)
    );
  }, [initialData.sales.recentSales, dateRange]);

  const salesKpis = useMemo(() => {
    let revenue = 0;
    let cash = 0;
    let upi = 0;
    let udhar = 0;

    for (const b of filteredSales) {
      revenue += b.totalAmount;
      if (b.paymentMode === 'CASH') cash += b.amountPaid;
      else if (b.paymentMode === 'UPI') upi += b.amountPaid;
      else if (b.paymentMode === 'CREDIT_UDHAR') {
        udhar += b.balanceDue;
        cash += b.amountPaid;
      }
    }

    return [
      { label: 'Total Invoices', value: `${filteredSales.length} Bills`, note: 'In selected period' },
      { label: 'Total POS Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, note: 'Gross billing value' },
      { label: 'Cash / UPI Received', value: `₹${(cash + upi).toLocaleString('en-IN')}`, note: `Cash: ₹${cash.toLocaleString('en-IN')} | UPI: ₹${upi.toLocaleString('en-IN')}` },
      { label: 'Udhar Balance Issued', value: `₹${udhar.toLocaleString('en-IN')}`, note: 'Pending credit collections' },
    ];
  }, [filteredSales]);

  // --- TAB 2: PURCHASES & BATCHES ---
  const filteredPurchases = useMemo(() => {
    return (initialData.purchases.batches || []).filter((batch) =>
      isWithinDateRange(batch.purchaseDate || batch.createdAt, dateRange)
    );
  }, [initialData.purchases.batches, dateRange]);

  const purchasesKpis = useMemo(() => {
    let investment = 0;
    let received = 0;
    let active = 0;
    let mortality = 0;

    for (const p of filteredPurchases) {
      investment += p.totalInvestment;
      received += p.initialQty;
      active += p.currentQty;
      mortality += p.mortalityQty;
    }

    const avgCost = received > 0 ? (investment / received).toFixed(1) : '0';

    return [
      { label: 'Procurement Investment', value: `₹${investment.toLocaleString('en-IN')}`, note: 'Total capital invested' },
      { label: 'Batches Received', value: `${filteredPurchases.length} Batches`, note: `${received.toLocaleString('en-IN')} total saplings/pots` },
      { label: 'Ready Active Pots', value: `${active.toLocaleString('en-IN')} Pots`, note: 'Current active inventory' },
      { label: 'Mortality / Dead Pots', value: `${mortality.toLocaleString('en-IN')} Pots`, note: `Avg unit cost: ₹${avgCost}` },
    ];
  }, [filteredPurchases]);

  // --- TAB 3: STOCK & DAMAGE LOSS ---
  const filteredStockDamage = useMemo(() => {
    // Stock is current state, but date filter can filter by cultivar registration or batch procurement activity
    if (dateRange === 'all') {
      return initialData.stockDamage.items || [];
    }
    return (initialData.stockDamage.items || []).filter((item) =>
      isWithinDateRange(item.createdAt, dateRange)
    );
  }, [initialData.stockDamage.items, dateRange]);

  const stockDamageKpis = useMemo(() => {
    let readyStock = 0;
    let stockVal = 0;
    let damaged = 0;
    let damageLoss = 0;

    for (const s of filteredStockDamage) {
      readyStock += s.readyStock;
      stockVal += s.stockValuation;
      damaged += s.damagedPots;
      damageLoss += s.damageLoss;
    }

    return [
      { label: 'Ready-to-Sell Stock', value: `${readyStock.toLocaleString('en-IN')} Pots`, note: `${filteredStockDamage.length} plant cultivars` },
      { label: 'Current Stock Valuation', value: `₹${stockVal.toLocaleString('en-IN')}`, note: 'Retail selling value (clamped)' },
      { label: 'Damaged / Dead Pots', value: `${damaged.toLocaleString('en-IN')} Pots`, note: 'Recorded nursery mortality' },
      { label: 'Damage Loss (₹)', value: `₹${damageLoss.toLocaleString('en-IN')}`, note: 'Procurement capital loss' },
    ];
  }, [filteredStockDamage]);

  // --- TAB 4: CUSTOMER UDHAR & DUES ---
  const filteredUdhar = useMemo(() => {
    if (dateRange === 'all') {
      return initialData.udhar.topDebtors || [];
    }
    return (initialData.udhar.topDebtors || []).filter((item) =>
      isWithinDateRange(item.lastBillDate || item.createdAt, dateRange)
    );
  }, [initialData.udhar.topDebtors, dateRange]);

  const udharKpis = useMemo(() => {
    let totalDue = 0;
    let totalBilled = 0;
    let totalPaid = 0;
    let debtorsCount = 0;

    for (const u of filteredUdhar) {
      totalDue += u.totalUdharDue;
      totalBilled += u.totalBilled;
      totalPaid += u.totalPaid;
      if (u.totalUdharDue > 0) debtorsCount += 1;
    }

    return [
      { label: 'Outstanding Udhar Due', value: `₹${totalDue.toLocaleString('en-IN')}`, note: 'Total unpaid market balance' },
      { label: 'Debtors Accounts', value: `${debtorsCount} Customers`, note: `${filteredUdhar.length} total client profiles` },
      { label: 'Total Billed Amount', value: `₹${totalBilled.toLocaleString('en-IN')}`, note: 'Retail POS + site contracts' },
      { label: 'Collections Received', value: `₹${totalPaid.toLocaleString('en-IN')}`, note: 'Cash, UPI & advance receipts' },
    ];
  }, [filteredUdhar]);

  // --- TAB 5: LANDSCAPING PROJECTS ---
  const filteredContracts = useMemo(() => {
    return (initialData.contracts.projectList || []).filter((item) =>
      isWithinDateRange(item.createdAt, dateRange)
    );
  }, [initialData.contracts.projectList, dateRange]);

  const contractsKpis = useMemo(() => {
    let totalValuation = 0;
    let advances = 0;
    let pendingDue = 0;
    let active = 0;

    for (const c of filteredContracts) {
      totalValuation += c.totalEstimate;
      advances += c.advanceReceived;
      pendingDue += c.balanceAmount;
      if (c.progressPercent < 100 && c.currentStage !== 'MAINTENANCE_HANDOVER') {
        active += 1;
      }
    }

    return [
      { label: 'Project Estimates Value', value: `₹${totalValuation.toLocaleString('en-IN')}`, note: `${filteredContracts.length} agreements signed` },
      { label: 'Advances Collected', value: `₹${advances.toLocaleString('en-IN')}`, note: 'Mobilization & stage payments' },
      { label: 'Pending Project Dues', value: `₹${pendingDue.toLocaleString('en-IN')}`, note: 'Work completion balance' },
      { label: 'Active Projects', value: `${active} Sites`, note: `${filteredContracts.length - active} completed & handed over` },
    ];
  }, [filteredContracts]);

  // Get active tab's KPI list
  const activeKpis = useMemo(() => {
    switch (activeTab) {
      case 'sales':
        return salesKpis;
      case 'purchases':
        return purchasesKpis;
      case 'stock_damage':
        return stockDamageKpis;
      case 'udhar':
        return udharKpis;
      case 'contracts':
      default:
        return contractsKpis;
    }
  }, [activeTab, salesKpis, purchasesKpis, stockDamageKpis, udharKpis, contractsKpis]);

  // ==========================================================================
  // 2. TANSTACK TABLE COLUMN DEFINITIONS PER TAB
  // ==========================================================================

  // Tab 1: Sales Columns
  const salesColumns = useMemo<ColumnDef<SalesReportItem>[]>(() => [
    {
      accessorKey: 'billNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B4D3E' }}>
          {row.original.billNumber}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date & Time',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.original.customerName}</div>
          {row.original.customerPhone && (
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>📱 {row.original.customerPhone}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'paymentMode',
      header: 'Payment Mode',
      cell: ({ row }) => {
        const mode = row.original.paymentMode;
        if (mode === 'CASH') return <span className={`${styles.badgeDefault} ${styles.badgeSuccess}`}>Cash</span>;
        if (mode === 'UPI') return <span className={`${styles.badgeDefault} ${styles.badgeInfo}`}>UPI QR</span>;
        return <span className={`${styles.badgeDefault} ${styles.badgeWarning}`}>Credit Udhar</span>;
      },
    },
    {
      accessorKey: 'itemCount',
      header: 'Pots',
      cell: ({ row }) => `${row.original.itemCount} items`,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total (₹)',
      cell: ({ row }) => (
        <span style={{ fontWeight: 700 }}>₹{row.original.totalAmount.toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'amountPaid',
      header: 'Paid (₹)',
      cell: ({ row }) => `₹${row.original.amountPaid.toLocaleString('en-IN')}`,
    },
    {
      accessorKey: 'balanceDue',
      header: 'Due (₹)',
      cell: ({ row }) => (
        <span style={{ color: row.original.balanceDue > 0 ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
          ₹{row.original.balanceDue.toLocaleString('en-IN')}
        </span>
      ),
    },
  ], []);

  // Tab 2: Purchases Columns
  const purchasesColumns = useMemo<ColumnDef<PurchaseBatchReportItem>[]>(() => [
    {
      accessorKey: 'batchNumber',
      header: 'Batch Code',
      cell: ({ row }) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B4D3E' }}>
          {row.original.batchNumber}
        </span>
      ),
    },
    {
      accessorKey: 'purchaseDate',
      header: 'Arrival Date',
      cell: ({ row }) => new Date(row.original.purchaseDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    },
    {
      accessorKey: 'plantName',
      header: 'Plant Cultivar',
      cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.original.plantName}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'monospace' }}>
            [{row.original.plantSku}]
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'vendorName',
      header: 'Supplier / Vendor',
      cell: ({ row }) => row.original.vendorName,
    },
    {
      accessorKey: 'initialQty',
      header: 'Received Pots',
      cell: ({ row }) => `${row.original.initialQty} pots`,
    },
    {
      accessorKey: 'currentQty',
      header: 'Active Pots',
      cell: ({ row }) => `${row.original.currentQty} ready`,
    },
    {
      accessorKey: 'mortalityQty',
      header: 'Dead / Damaged',
      cell: ({ row }) => (
        <span style={{ color: row.original.mortalityQty > 0 ? '#DC2626' : '#6B7280' }}>
          {row.original.mortalityQty} dead
        </span>
      ),
    },
    {
      accessorKey: 'unitCostPrice',
      header: 'Unit Cost (₹)',
      cell: ({ row }) => `₹${row.original.unitCostPrice}`,
    },
    {
      accessorKey: 'totalInvestment',
      header: 'Total Cost (₹)',
      cell: ({ row }) => (
        <span style={{ fontWeight: 700 }}>₹{row.original.totalInvestment.toLocaleString('en-IN')}</span>
      ),
    },
  ], []);

  // Tab 3: Stock & Damage Loss Columns
  const stockDamageColumns = useMemo<ColumnDef<StockDamageReportItem>[]>(() => [
    {
      accessorKey: 'sku',
      header: 'Plant SKU',
      cell: ({ row }) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B4D3E' }}>
          {row.original.sku}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Cultivar Name',
      cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.original.name}</div>
          {row.original.marathiName && (
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{row.original.marathiName}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className={`${styles.badgeDefault} ${styles.badgeNeutral}`}>
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'readyStock',
      header: 'Ready Stock',
      cell: ({ row }) => (
        <span style={{ fontWeight: 700, color: row.original.readyStock <= 15 ? '#DC2626' : '#111827' }}>
          {row.original.readyStock} pots
        </span>
      ),
    },
    {
      accessorKey: 'damagedPots',
      header: 'Damaged / Dead',
      cell: ({ row }) => (
        <span style={{ color: row.original.damagedPots > 0 ? '#DC2626' : '#6B7280' }}>
          {row.original.damagedPots} pots
        </span>
      ),
    },
    {
      accessorKey: 'damageLoss',
      header: 'Damage Loss (₹)',
      cell: ({ row }) => (
        <span style={{ color: '#DC2626', fontWeight: 600 }}>
          ₹{row.original.damageLoss.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Rate (₹)',
      cell: ({ row }) => `₹${row.original.price}`,
    },
    {
      accessorKey: 'stockValuation',
      header: 'Stock Valuation (₹)',
      cell: ({ row }) => (
        <span style={{ fontWeight: 700, color: '#1B4D3E' }}>
          ₹{row.original.stockValuation.toLocaleString('en-IN')}
        </span>
      ),
    },
  ], []);

  // Tab 4: Customer Udhar & Dues Columns
  const udharColumns = useMemo<ColumnDef<CustomerUdharItem>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Client / Debtor',
      cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.original.name}</div>
          {row.original.address && (
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{row.original.address}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone Number',
      cell: ({ row }) => (
        <span style={{ fontFamily: 'monospace' }}>{row.original.phone}</span>
      ),
    },
    {
      accessorKey: 'billCount',
      header: 'Total Orders',
      cell: ({ row }) => `${row.original.billCount} invoices`,
    },
    {
      accessorKey: 'totalBilled',
      header: 'Total Billed (₹)',
      cell: ({ row }) => `₹${row.original.totalBilled.toLocaleString('en-IN')}`,
    },
    {
      accessorKey: 'totalPaid',
      header: 'Total Paid (₹)',
      cell: ({ row }) => `₹${row.original.totalPaid.toLocaleString('en-IN')}`,
    },
    {
      accessorKey: 'totalUdharDue',
      header: 'Outstanding Due (₹)',
      cell: ({ row }) => (
        <span style={{ color: row.original.totalUdharDue > 0 ? '#DC2626' : '#16A34A', fontWeight: 700, fontSize: '0.9375rem' }}>
          ₹{row.original.totalUdharDue.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      accessorKey: 'lastBillDate',
      header: 'Last Transaction',
      cell: ({ row }) =>
        row.original.lastBillDate
          ? new Date(row.original.lastBillDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-',
    },
  ], []);

  // Tab 5: Landscaping Projects Columns
  const contractsColumns = useMemo<ColumnDef<ContractAnalyticsItem>[]>(() => [
    {
      accessorKey: 'contractNo',
      header: 'Contract ID',
      cell: ({ row }) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B4D3E' }}>
          {row.original.contractNo}
        </span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Client',
      cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.original.customerName}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{row.original.siteAddress}</div>
        </div>
      ),
    },
    {
      accessorKey: 'projectType',
      header: 'Project Type',
      cell: ({ row }) => (
        <span className={`${styles.badgeDefault} ${styles.badgeInfo}`}>
          {row.original.projectType}
        </span>
      ),
    },
    {
      accessorKey: 'plotSize',
      header: 'Lawn Area',
      cell: ({ row }) => row.original.plotSize,
    },
    {
      accessorKey: 'totalEstimate',
      header: 'Estimate (₹)',
      cell: ({ row }) => (
        <span style={{ fontWeight: 700 }}>₹{row.original.totalEstimate.toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'advanceReceived',
      header: 'Advance Paid (₹)',
      cell: ({ row }) => `₹${row.original.advanceReceived.toLocaleString('en-IN')}`,
    },
    {
      accessorKey: 'balanceAmount',
      header: 'Balance Due (₹)',
      cell: ({ row }) => (
        <span style={{ color: row.original.balanceAmount > 0 ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
          ₹{row.original.balanceAmount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      accessorKey: 'currentStage',
      header: 'Execution Stage',
      cell: ({ row }) => (
        <span className={`${styles.badgeDefault} ${row.original.progressPercent >= 100 ? styles.badgeSuccess : styles.badgeWarning}`}>
          {row.original.currentStage} ({row.original.progressPercent}%)
        </span>
      ),
    },
  ], []);

  // ==========================================================================
  // 3. CLEAN A4 PDF EXPORT GENERATOR
  // ==========================================================================
  const handleDownloadPDF = useCallback(() => {
    let reportTitle = '';
    let columns: ReportPdfColumn[] = [];
    let rows: Array<Record<string, any>> = [];
    let kpis: ReportPdfKpi[] = [];
    let footerTotals: Record<string, string> = {};

    if (activeTab === 'sales') {
      reportTitle = 'Retail POS Sales Report';
      kpis = salesKpis.map((k) => ({ label: k.label, value: k.value }));
      columns = [
        { header: 'INVOICE #', dataKey: 'billNumber', width: 34 },
        { header: 'DATE', dataKey: 'date', width: 28 },
        { header: 'CUSTOMER', dataKey: 'customerName', width: 50 },
        { header: 'MODE', dataKey: 'paymentMode', width: 26 },
        { header: 'POTS', dataKey: 'itemCount', width: 20, align: 'center' },
        { header: 'TOTAL (INR)', dataKey: 'totalAmount', width: 38, align: 'right' },
        { header: 'PAID (INR)', dataKey: 'amountPaid', width: 38, align: 'right' },
        { header: 'DUE (INR)', dataKey: 'balanceDue', width: 38, align: 'right' },
      ];
      let totalAmount = 0;
      let totalPaid = 0;
      let totalDue = 0;
      rows = filteredSales.map((s) => {
        totalAmount += s.totalAmount;
        totalPaid += s.amountPaid;
        totalDue += s.balanceDue;
        return {
          billNumber: s.billNumber,
          date: new Date(s.createdAt).toLocaleDateString('en-IN'),
          customerName: s.customerName,
          paymentMode: s.paymentMode,
          itemCount: s.itemCount,
          totalAmount: `₹${s.totalAmount.toLocaleString('en-IN')}`,
          amountPaid: `₹${s.amountPaid.toLocaleString('en-IN')}`,
          balanceDue: `₹${s.balanceDue.toLocaleString('en-IN')}`,
        };
      });
      footerTotals = {
        billNumber: `TOTAL (${rows.length} BILLS)`,
        totalAmount: `₹${totalAmount.toLocaleString('en-IN')}`,
        amountPaid: `₹${totalPaid.toLocaleString('en-IN')}`,
        balanceDue: `₹${totalDue.toLocaleString('en-IN')}`,
      };
    } else if (activeTab === 'purchases') {
      reportTitle = 'Procurement & Inventory Batches';
      kpis = purchasesKpis.map((k) => ({ label: k.label, value: k.value }));
      columns = [
        { header: 'BATCH CODE', dataKey: 'batchNumber', width: 36 },
        { header: 'ARRIVAL', dataKey: 'date', width: 26 },
        { header: 'PLANT CULTIVAR', dataKey: 'plantName', width: 56 },
        { header: 'SUPPLIER', dataKey: 'vendorName', width: 44 },
        { header: 'RECEIVED', dataKey: 'initialQty', width: 24, align: 'center' },
        { header: 'READY', dataKey: 'currentQty', width: 22, align: 'center' },
        { header: 'MORTALITY', dataKey: 'mortalityQty', width: 24, align: 'center' },
        { header: 'UNIT COST', dataKey: 'unitCostPrice', width: 24, align: 'right' },
        { header: 'TOTAL (INR)', dataKey: 'totalInvestment', width: 36, align: 'right' },
      ];
      let totalRec = 0;
      let totalAct = 0;
      let totalMort = 0;
      let totalInv = 0;
      rows = filteredPurchases.map((p) => {
        totalRec += p.initialQty;
        totalAct += p.currentQty;
        totalMort += p.mortalityQty;
        totalInv += p.totalInvestment;
        return {
          batchNumber: p.batchNumber,
          date: new Date(p.purchaseDate).toLocaleDateString('en-IN'),
          plantName: `${p.plantName} [${p.plantSku}]`,
          vendorName: p.vendorName,
          initialQty: p.initialQty,
          currentQty: p.currentQty,
          mortalityQty: p.mortalityQty,
          unitCostPrice: `₹${p.unitCostPrice}`,
          totalInvestment: `₹${p.totalInvestment.toLocaleString('en-IN')}`,
        };
      });
      footerTotals = {
        batchNumber: `TOTAL (${rows.length} BATCHES)`,
        initialQty: `${totalRec}`,
        currentQty: `${totalAct}`,
        mortalityQty: `${totalMort}`,
        totalInvestment: `₹${totalInv.toLocaleString('en-IN')}`,
      };
    } else if (activeTab === 'stock_damage') {
      reportTitle = 'Stock Valuation & Damage Loss Audit';
      kpis = stockDamageKpis.map((k) => ({ label: k.label, value: k.value }));
      columns = [
        { header: 'PLANT SKU', dataKey: 'sku', width: 34 },
        { header: 'CULTIVAR NAME', dataKey: 'name', width: 60 },
        { header: 'CATEGORY', dataKey: 'category', width: 28 },
        { header: 'READY STOCK', dataKey: 'readyStock', width: 28, align: 'center' },
        { header: 'DEAD POTS', dataKey: 'damagedPots', width: 24, align: 'center' },
        { header: 'DAMAGE LOSS', dataKey: 'damageLoss', width: 34, align: 'right' },
        { header: 'RATE (INR)', dataKey: 'price', width: 28, align: 'right' },
        { header: 'VALUATION (INR)', dataKey: 'stockValuation', width: 38, align: 'right' },
      ];
      let totalStock = 0;
      let totalDead = 0;
      let totalLoss = 0;
      let totalVal = 0;
      rows = filteredStockDamage.map((s) => {
        totalStock += s.readyStock;
        totalDead += s.damagedPots;
        totalLoss += s.damageLoss;
        totalVal += s.stockValuation;
        return {
          sku: s.sku,
          name: s.name,
          category: s.category,
          readyStock: `${s.readyStock}`,
          damagedPots: `${s.damagedPots}`,
          damageLoss: `₹${s.damageLoss.toLocaleString('en-IN')}`,
          price: `₹${s.price}`,
          stockValuation: `₹${s.stockValuation.toLocaleString('en-IN')}`,
        };
      });
      footerTotals = {
        sku: `TOTAL (${rows.length} CULTIVARS)`,
        readyStock: `${totalStock}`,
        damagedPots: `${totalDead}`,
        damageLoss: `₹${totalLoss.toLocaleString('en-IN')}`,
        stockValuation: `₹${totalVal.toLocaleString('en-IN')}`,
      };
    } else if (activeTab === 'udhar') {
      reportTitle = 'Customer Udhar & Outstanding Dues Ledger';
      kpis = udharKpis.map((k) => ({ label: k.label, value: k.value }));
      columns = [
        { header: 'CLIENT / DEBTOR', dataKey: 'name', width: 56 },
        { header: 'PHONE', dataKey: 'phone', width: 34 },
        { header: 'ORDERS', dataKey: 'billCount', width: 22, align: 'center' },
        { header: 'TOTAL BILLED', dataKey: 'totalBilled', width: 40, align: 'right' },
        { header: 'TOTAL PAID', dataKey: 'totalPaid', width: 40, align: 'right' },
        { header: 'OUTSTANDING DUE', dataKey: 'totalUdharDue', width: 46, align: 'right' },
        { header: 'LAST ACTIVITY', dataKey: 'lastBillDate', width: 34, align: 'center' },
      ];
      let billed = 0;
      let paid = 0;
      let due = 0;
      rows = filteredUdhar.map((u) => {
        billed += u.totalBilled;
        paid += u.totalPaid;
        due += u.totalUdharDue;
        return {
          name: u.name,
          phone: u.phone,
          billCount: `${u.billCount}`,
          totalBilled: `₹${u.totalBilled.toLocaleString('en-IN')}`,
          totalPaid: `₹${u.totalPaid.toLocaleString('en-IN')}`,
          totalUdharDue: `₹${u.totalUdharDue.toLocaleString('en-IN')}`,
          lastBillDate: u.lastBillDate ? new Date(u.lastBillDate).toLocaleDateString('en-IN') : '-',
        };
      });
      footerTotals = {
        name: `TOTAL (${rows.length} CLIENTS)`,
        totalBilled: `₹${billed.toLocaleString('en-IN')}`,
        totalPaid: `₹${paid.toLocaleString('en-IN')}`,
        totalUdharDue: `₹${due.toLocaleString('en-IN')}`,
      };
    } else if (activeTab === 'contracts') {
      reportTitle = 'Landscaping Projects Audit';
      kpis = contractsKpis.map((k) => ({ label: k.label, value: k.value }));
      columns = [
        { header: 'CONTRACT ID', dataKey: 'contractNo', width: 36 },
        { header: 'CLIENT NAME', dataKey: 'customerName', width: 48 },
        { header: 'SITE / AREA', dataKey: 'siteAddress', width: 54 },
        { header: 'TYPE', dataKey: 'projectType', width: 28 },
        { header: 'ESTIMATE (INR)', dataKey: 'totalEstimate', width: 36, align: 'right' },
        { header: 'ADVANCE (INR)', dataKey: 'advanceReceived', width: 36, align: 'right' },
        { header: 'BALANCE (INR)', dataKey: 'balanceAmount', width: 36, align: 'right' },
        { header: 'STAGE', dataKey: 'stage', width: 34, align: 'center' },
      ];
      let est = 0;
      let adv = 0;
      let bal = 0;
      rows = filteredContracts.map((c) => {
        est += c.totalEstimate;
        adv += c.advanceReceived;
        bal += c.balanceAmount;
        return {
          contractNo: c.contractNo,
          customerName: c.customerName,
          siteAddress: `${c.siteAddress} (${c.plotSize})`,
          projectType: c.projectType,
          totalEstimate: `₹${c.totalEstimate.toLocaleString('en-IN')}`,
          advanceReceived: `₹${c.advanceReceived.toLocaleString('en-IN')}`,
          balanceAmount: `₹${c.balanceAmount.toLocaleString('en-IN')}`,
          stage: `${c.currentStage} (${c.progressPercent}%)`,
        };
      });
      footerTotals = {
        contractNo: `TOTAL (${rows.length} PROJECTS)`,
        totalEstimate: `₹${est.toLocaleString('en-IN')}`,
        advanceReceived: `₹${adv.toLocaleString('en-IN')}`,
        balanceAmount: `₹${bal.toLocaleString('en-IN')}`,
      };
    }

    generateReportPdf({
      reportTitle,
      dateRangeLabel,
      kpis,
      columns,
      rows,
      footerTotals,
      fileName: `Bharti_Nursery_${activeTab.toUpperCase()}_Report_${dateRangeLabel.replace(/\s+/g, '_')}.pdf`,
    });
  }, [
    activeTab,
    dateRangeLabel,
    salesKpis,
    purchasesKpis,
    stockDamageKpis,
    udharKpis,
    contractsKpis,
    filteredSales,
    filteredPurchases,
    filteredStockDamage,
    filteredUdhar,
    filteredContracts,
  ]);

  // ==========================================================================
  // 4. CSV EXPORT HANDLER
  // ==========================================================================
  const handleExportCSV = useCallback(() => {
    let csv = '';
    const nowStr = new Date().toISOString().slice(0, 10);
    const filename = `Bharti_Nursery_${activeTab}_${dateRange}_${nowStr}.csv`;

    if (activeTab === 'sales') {
      csv += 'Invoice Number,Date,Customer Name,Phone,Payment Mode,Pots Count,Total Amount,Paid,Balance Due\n';
      filteredSales.forEach((s) => {
        csv += `"${s.billNumber}","${s.createdAt}","${s.customerName}","${s.customerPhone || ''}","${s.paymentMode}",${s.itemCount},${s.totalAmount},${s.amountPaid},${s.balanceDue}\n`;
      });
    } else if (activeTab === 'purchases') {
      csv += 'Batch Code,Arrival Date,Plant Name,Plant SKU,Supplier,Received Pots,Active Pots,Mortality Pots,Unit Cost,Total Investment\n';
      filteredPurchases.forEach((p) => {
        csv += `"${p.batchNumber}","${p.purchaseDate}","${p.plantName}","${p.plantSku}","${p.vendorName}",${p.initialQty},${p.currentQty},${p.mortalityQty},${p.unitCostPrice},${p.totalInvestment}\n`;
      });
    } else if (activeTab === 'stock_damage') {
      csv += 'Plant SKU,Name,Category,Ready Stock,Dead Pots,Damage Loss,Rate,Valuation\n';
      filteredStockDamage.forEach((s) => {
        csv += `"${s.sku}","${s.name}","${s.category}",${s.readyStock},${s.damagedPots},${s.damageLoss},${s.price},${s.stockValuation}\n`;
      });
    } else if (activeTab === 'udhar') {
      csv += 'Client Name,Phone,Address,Orders Count,Total Billed,Total Paid,Outstanding Due,Last Activity\n';
      filteredUdhar.forEach((u) => {
        csv += `"${u.name}","${u.phone}","${u.address || ''}",${u.billCount},${u.totalBilled},${u.totalPaid},${u.totalUdharDue},"${u.lastBillDate || ''}"\n`;
      });
    } else if (activeTab === 'contracts') {
      csv += 'Contract ID,Client,Site Address,Project Type,Plot Area,Estimate,Advance Paid,Balance Due,Stage,Progress\n';
      filteredContracts.forEach((c) => {
        csv += `"${c.contractNo}","${c.customerName}","${c.siteAddress}","${c.projectType}","${c.plotSize}",${c.totalEstimate},${c.advanceReceived},${c.balanceAmount},"${c.currentStage}",${c.progressPercent}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }, [activeTab, dateRange, filteredSales, filteredPurchases, filteredStockDamage, filteredUdhar, filteredContracts]);

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. PRINT HEADER (Visible only during A4 paper printing) */}
      <div className={styles.printHeader}>
        <div className={styles.printOrgName}>
          Bharti&apos;s Green World Nursery &amp; Landscaping — Kolhapur
        </div>
        <div className={styles.printDocTitle}>
          {activeTab === 'sales' && 'Retail POS Sales & Collections Audit'}
          {activeTab === 'purchases' && 'Procurement & Inventory Batches Audit'}
          {activeTab === 'stock_damage' && 'Stock Valuation & Damage Loss Audit'}
          {activeTab === 'udhar' && 'Customer Udhar & Outstanding Dues Ledger'}
          {activeTab === 'contracts' && 'Landscaping Projects & Contracts Audit'}
          {' — '}{dateRangeLabel}
        </div>
        <div className={styles.printTimestamp}>
          Report Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* 2. TOP TOOLBAR & CONTROLS */}
      <section className={styles.topToolbar}>
        <div className={styles.titleArea}>
          <h1 className={styles.mainTitle}>
            <Calendar size={18} />
            Executive Operational &amp; Financial Reports
          </h1>
          <span className={styles.subTitle}>
            Active Period: <strong>{dateRangeLabel}</strong> • Audited in real time across Kolhapur branches
          </span>
        </div>

        <div className={styles.toolbarActions}>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDownloadPDF}
            leftIcon={<FileDown size={14} />}
            title="Download clean printable A4 vector PDF"
          >
            Download PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer size={14} />}
            title="Print report on paper"
          >
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download size={14} />}
            title="Export raw tabular data to CSV"
          >
            Export CSV
          </Button>
        </div>
      </section>

      {/* 3. PRACTICAL 5 CATEGORY TABS */}
      <nav className={styles.categoryTabsBar} aria-label="Report category navigation">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`${styles.categoryTabBtn} ${activeTab === 'sales' ? styles.activeCategoryTab : ''}`}
        >
          <Receipt size={15} />
          <span>1. Sales Report</span>
          <span className={styles.tabBadge}>{filteredSales.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('purchases')}
          className={`${styles.categoryTabBtn} ${activeTab === 'purchases' ? styles.activeCategoryTab : ''}`}
        >
          <PackageCheck size={15} />
          <span>2. Purchase &amp; Batches</span>
          <span className={styles.tabBadge}>{filteredPurchases.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stock_damage')}
          className={`${styles.categoryTabBtn} ${activeTab === 'stock_damage' ? styles.activeCategoryTab : ''}`}
        >
          <AlertOctagon size={15} />
          <span>3. Stock &amp; Damage Loss</span>
          <span className={styles.tabBadge}>{filteredStockDamage.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('udhar')}
          className={`${styles.categoryTabBtn} ${activeTab === 'udhar' ? styles.activeCategoryTab : ''}`}
        >
          <Users size={15} />
          <span>4. Customer Udhar &amp; Dues</span>
          <span className={styles.tabBadge}>{filteredUdhar.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contracts')}
          className={`${styles.categoryTabBtn} ${activeTab === 'contracts' ? styles.activeCategoryTab : ''}`}
        >
          <Trees size={15} />
          <span>5. Landscaping Projects</span>
          <span className={styles.tabBadge}>{filteredContracts.length}</span>
        </button>
      </nav>

      {/* 4. DATE RANGE FILTER BAR */}
      <section className={styles.dateFilterCard}>
        <div className={styles.dateFilterGroup}>
          <span className={styles.filterLabel}>
            <Filter size={13} />
            Period Filter:
          </span>

          <button
            type="button"
            className={`${styles.datePillBtn} ${dateRange === 'today' ? styles.activeDatePill : ''}`}
            onClick={() => setDateRange('today')}
          >
            Today
          </button>

          <button
            type="button"
            className={`${styles.datePillBtn} ${dateRange === 'week' ? styles.activeDatePill : ''}`}
            onClick={() => setDateRange('week')}
          >
            This Week
          </button>

          <button
            type="button"
            className={`${styles.datePillBtn} ${dateRange === 'month' ? styles.activeDatePill : ''}`}
            onClick={() => setDateRange('month')}
          >
            This Month
          </button>

          <button
            type="button"
            className={`${styles.datePillBtn} ${dateRange === 'all' ? styles.activeDatePill : ''}`}
            onClick={() => setDateRange('all')}
          >
            All Time
          </button>
        </div>

        <div className={styles.dateStatusBadge}>
          <Clock size={12} />
          <span>
            Filtering {activeTab.replace('_', ' ')} entries for: <strong>{dateRangeLabel}</strong>
          </span>
        </div>
      </section>

      {/* 5. SUMMARY KPI METRICS CARDS (Dynamically recalculated) */}
      <section className={styles.kpiGrid}>
        {activeKpis.map((kpi, idx) => (
          <div key={idx} className={styles.kpiCard}>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            <span className={styles.kpiValue}>{kpi.value}</span>
            <span className={styles.kpiNote}>{kpi.note}</span>
          </div>
        ))}
      </section>

      {/* 6. TABULAR REPORT DATA TABLE */}
      <section className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <span className={styles.tableTitle}>
            {activeTab === 'sales' && 'POS Invoices & Payment Breakdown'}
            {activeTab === 'purchases' && 'Procurement Batches & Supplier Inward Logs'}
            {activeTab === 'stock_damage' && 'Plant Cultivar Stock, Mortality & Damage Valuation'}
            {activeTab === 'udhar' && 'Customer Outstanding Udhar & Dues Ledger'}
            {activeTab === 'contracts' && 'Landscaping Site Contracts & Milestone Valuation'}
          </span>
          <span className={styles.tableCountTag}>
            {activeTab === 'sales' && `${filteredSales.length} Invoices`}
            {activeTab === 'purchases' && `${filteredPurchases.length} Batches`}
            {activeTab === 'stock_damage' && `${filteredStockDamage.length} Cultivars`}
            {activeTab === 'udhar' && `${filteredUdhar.length} Customers`}
            {activeTab === 'contracts' && `${filteredContracts.length} Projects`}
          </span>
        </div>

        {activeTab === 'sales' && (
          <DataTable
            data={filteredSales}
            columns={salesColumns}
            searchPlaceholder="Search invoice #, customer name, or payment mode..."
          />
        )}

        {activeTab === 'purchases' && (
          <DataTable
            data={filteredPurchases}
            columns={purchasesColumns}
            searchPlaceholder="Search batch code, plant name, or supplier..."
          />
        )}

        {activeTab === 'stock_damage' && (
          <DataTable
            data={filteredStockDamage}
            columns={stockDamageColumns}
            searchPlaceholder="Search plant SKU, cultivar name, or category..."
          />
        )}

        {activeTab === 'udhar' && (
          <DataTable
            data={filteredUdhar}
            columns={udharColumns}
            searchPlaceholder="Search client name, phone, or address..."
          />
        )}

        {activeTab === 'contracts' && (
          <DataTable
            data={filteredContracts}
            columns={contractsColumns}
            searchPlaceholder="Search contract ID, client name, site, or project stage..."
          />
        )}
      </section>
    </div>
  );
};
