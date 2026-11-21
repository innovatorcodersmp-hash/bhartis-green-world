/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/dashboard/components/NurseryDashboard.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Streamlined the Live Nursery Command Center Dashboard component (`<NurseryDashboard>`).
 *    - Removed the top quick-action shortcut buttons row to deliver a cleaner, distraction-free visual layout.
 *    - Removed the bottom Recent Counter Invoices table section to eliminate redundant billing lists.
 *    - Preserved high-value executive components:
 *      1) Clean Title Banner: Kolhapur operational telemetry header with botanical identity.
 *      2) "Today at a Glance" Top 4 Botanical KPI Cards: Forest Green (Sales), Marigold (Udhar), Lavender (Ready Stock), Blush Rose (Projects).
 *      3) Visual Analytics Row: Pure responsive SVG 7-Day Sales Trend Area Graph and SVG Payment Mode Donut Ring Chart.
 *      4) Insights & Action Row: Top 5 Bestselling Cultivars with progress bars and Low-Stock / Overdue Udhar actionable follow-up items with WhatsApp deep-links.
 *    - Maintained full PWA touch ergonomics and mobile responsiveness.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REMOVE SHORTCUT BUTTONS AND RECENT INVOICES TABLE FROM DASHBOARD".
 *    - Fulfills Specification 01: Clean card UI, compact spacing, botanical flower color palette, and mobile viewport ergonomics.
 *    - Declutters the dashboard so managers and cashiers can focus directly on KPIs, trends, restock warnings, and credit collection.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 Client Component (`'use client'`).
 *    - Lucide React botanical and financial icons (`Sparkles`, `IndianRupee`, `Users`, `Sprout`, `TreeDeciduous`, `TrendingUp`, `PieChart`, `ShoppingBag`, `AlertTriangle`, `MessageCircle`).
 *    - Next.js `useRouter` for restock batch navigation.
 *    - Scoped SCSS module (`NurseryDashboard.module.scss`).
 *    - Domain models from `@/modules/dashboard/types`.
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Receives `initialData: NurseryDashboardMetrics` from the server.
 *    - Computes vector math for 7-day revenue trend coordinates and SVG donut circumference stroke offsets.
 *    - Renders streamlined botanical KPI cards, SVG charts, and actionable restock and WhatsApp debt reminder triggers.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  IndianRupee,
  Users,
  Sprout,
  TreeDeciduous,
  TrendingUp,
  PieChart,
  ShoppingBag,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import { NurseryDashboardMetrics } from '../types';
import styles from './NurseryDashboard.module.scss';

export interface NurseryDashboardProps {
  initialData: NurseryDashboardMetrics;
}

export const NurseryDashboard: React.FC<NurseryDashboardProps> = ({ initialData }) => {
  const router = useRouter();
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  const {
    todaySales,
    salesTrend7Days,
    paymentModeBreakdown,
    udharOverview,
    inventoryOverview,
    bestsellingPlants,
    contractsOverview,
  } = initialData;

  // Format currency in Indian format
  const formatInr = (amount: number): string => {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  };

  // ---------------------------------------------------------------------------
  // 1. CALCULATE 7-DAY SALES AREA CHART SVG GEOMETRY
  // ---------------------------------------------------------------------------
  const chartWidth = 500;
  const chartHeight = 175;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const maxRevenue = Math.max(
    5000,
    ...salesTrend7Days.map((d) => d.revenue)
  );

  const points = salesTrend7Days.map((item, index) => {
    const x =
      salesTrend7Days.length > 1
        ? paddingLeft + index * (plotWidth / (salesTrend7Days.length - 1))
        : paddingLeft + plotWidth / 2;
    const y =
      paddingTop + plotHeight - (item.revenue / maxRevenue) * plotHeight;
    return { ...item, x, y };
  });

  const linePath =
    points.length > 0
      ? points.reduce(
          (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
          ''
        )
      : '';

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${
          paddingTop + plotHeight
        } L ${points[0].x} ${paddingTop + plotHeight} Z`
      : '';

  // ---------------------------------------------------------------------------
  // 2. CALCULATE PAYMENT DONUT RING SVG SEGMENTS
  // ---------------------------------------------------------------------------
  const donutRadius = 48;
  const circumference = 2 * Math.PI * donutRadius; // ~301.59
  const totalPayment = paymentModeBreakdown.total > 0 ? paymentModeBreakdown.total : 1;

  const cashDash = (paymentModeBreakdown.cash / totalPayment) * circumference;
  const upiDash = (paymentModeBreakdown.upi / totalPayment) * circumference;
  const udharDash = (paymentModeBreakdown.udhar / totalPayment) * circumference;

  const cashOffset = 0;
  const upiOffset = -cashDash;
  const udharOffset = -(cashDash + upiDash);

  // ---------------------------------------------------------------------------
  // 3. BESTSELLING PLANTS RELATIVE MAX SOLD
  // ---------------------------------------------------------------------------
  const maxSoldVolume = Math.max(
    1,
    ...bestsellingPlants.map((p) => p.totalSold)
  );

  // ---------------------------------------------------------------------------
  // 4. WHATSAPP REMINDER GENERATOR
  // ---------------------------------------------------------------------------
  const openWhatsAppReminder = (customerName: string, phone: string, amount: number) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Namaskar ${customerName} ji, Bharti's Green World Nursery, Kolhapur here. Gentle reminder regarding pending balance of ${formatInr(amount)}. Please let us know if you need our UPI QR code or bank transfer details. Dhanyawad! 🌱`;
    const targetUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* ---------------------------------------------------------------------
          1. CLEAN TITLE BANNER
          --------------------------------------------------------------------- */}
      <section className={styles.commandBar} aria-label="Nursery Overview Banner">
        <div className={styles.commandHeader}>
          <h1 className={styles.commandTitle}>
            <Sparkles size={18} />
            Bharti&apos;s Nursery Command Center
          </h1>
          <span className={styles.commandSubtitle}>
            Live operational telemetry & botanical nursery overview • Kolhapur
          </span>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          2. TOP 4 BOTANICAL KPI CARDS ("Today at a Glance")
          --------------------------------------------------------------------- */}
      <section className={styles.kpiGrid} aria-label="Today at a Glance KPIs">
        {/* KPI 1: Today's Sales (Forest Green) */}
        <div className={`${styles.kpiCard} ${styles.kpiForestGreen}`}>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Today&apos;s Sales</span>
            <div className={styles.kpiValue}>
              {formatInr(todaySales.revenue)}
            </div>
            <span className={styles.kpiNote}>
              {todaySales.billCount} retail bills processed today
            </span>
          </div>
          <div className={styles.kpiIconBadge} aria-hidden="true">
            <IndianRupee size={20} />
          </div>
        </div>

        {/* KPI 2: Pending Udhar (Marigold Amber) */}
        <div className={`${styles.kpiCard} ${styles.kpiMarigold}`}>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Pending Udhar</span>
            <div className={styles.kpiValue}>
              {formatInr(udharOverview.totalPendingUdhar)}
            </div>
            <span className={styles.kpiNote}>
              {udharOverview.overdueCustomersCount} customers with unpaid dues
            </span>
          </div>
          <div className={styles.kpiIconBadge} aria-hidden="true">
            <Users size={20} />
          </div>
        </div>

        {/* KPI 3: Ready-to-Sell Stock (Lavender Bloom) */}
        <div className={`${styles.kpiCard} ${styles.kpiLavender}`}>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Ready Stock</span>
            <div className={styles.kpiValue}>
              {inventoryOverview.totalReadyPots.toLocaleString('en-IN')}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Pots</span>
            </div>
            <span className={styles.kpiNote}>
              Across {inventoryOverview.totalPlantVarieties} botanical varieties
            </span>
          </div>
          <div className={styles.kpiIconBadge} aria-hidden="true">
            <Sprout size={20} />
          </div>
        </div>

        {/* KPI 4: Active Garden Projects (Blush Rose) */}
        <div className={`${styles.kpiCard} ${styles.kpiBlushRose}`}>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Projects</span>
            <div className={styles.kpiValue}>
              {contractsOverview.activeProjectsCount}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Sites</span>
            </div>
            <span className={styles.kpiNote}>
              {formatInr(contractsOverview.pipelineEstimate)} active landscaping pipeline
            </span>
          </div>
          <div className={styles.kpiIconBadge} aria-hidden="true">
            <TreeDeciduous size={20} />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          3. VISUAL ANALYTICS ROW (SVG Charts)
          --------------------------------------------------------------------- */}
      <section className={styles.chartsGrid} aria-label="Visual Operational Analytics">
        {/* Chart 1: 7-Day Sales Trend Area Graph */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>
              <TrendingUp size={16} />
              7-Day Counter Sales Trend
            </h2>
            <span className={styles.chartSubtitle}>
              Last 7 days daily counter revenue
            </span>
          </div>

          <div className={styles.svgChartWrapper}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              width="100%"
              height="100%"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="nurseryTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B4D3E" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1B4D3E" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid guide lines */}
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={chartWidth - paddingRight}
                y2={paddingTop}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={paddingTop + 3}
                fill="#9CA3AF"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                {Math.round(maxRevenue / 1000)}k
              </text>

              <line
                x1={paddingLeft}
                y1={paddingTop + plotHeight / 2}
                x2={chartWidth - paddingRight}
                y2={paddingTop + plotHeight / 2}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={paddingTop + plotHeight / 2 + 3}
                fill="#9CA3AF"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                {Math.round(maxRevenue / 2000)}k
              </text>

              <line
                x1={paddingLeft}
                y1={paddingTop + plotHeight}
                x2={chartWidth - paddingRight}
                y2={paddingTop + plotHeight}
                stroke="#D1D5DB"
              />
              <text
                x={paddingLeft - 8}
                y={paddingTop + plotHeight + 3}
                fill="#9CA3AF"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                0
              </text>

              {/* Area & Line */}
              {areaPath && (
                <path d={areaPath} fill="url(#nurseryTrendGrad)" />
              )}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#1B4D3E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points & X labels */}
              {points.map((pt, idx) => (
                <g key={pt.date}>
                  {/* Invisible touch target for hover */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="14"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredTrendIndex(idx)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  />

                  {/* Visible dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredTrendIndex === idx ? '6' : '3.5'}
                    fill={hoveredTrendIndex === idx ? '#059669' : '#FFFFFF'}
                    stroke="#1B4D3E"
                    strokeWidth="2"
                    style={{ transition: 'all 0.15s ease' }}
                  />

                  {/* Day label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 12}
                    fill="#6B7280"
                    fontSize="9.5"
                    textAnchor="middle"
                    fontWeight={hoveredTrendIndex === idx ? '600' : '400'}
                  >
                    {pt.dayLabel}
                  </text>

                  {/* Tooltip on active point */}
                  {hoveredTrendIndex === idx && (
                    <g>
                      <rect
                        x={Math.min(chartWidth - 95, Math.max(10, pt.x - 45))}
                        y={Math.max(5, pt.y - 42)}
                        width="90"
                        height="32"
                        rx="4"
                        fill="#1F2937"
                        opacity="0.95"
                      />
                      <text
                        x={Math.min(chartWidth - 50, Math.max(55, pt.x))}
                        y={Math.max(19, pt.y - 28)}
                        fill="#FFFFFF"
                        fontSize="9.5"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {formatInr(pt.revenue)}
                      </text>
                      <text
                        x={Math.min(chartWidth - 50, Math.max(55, pt.x))}
                        y={Math.max(30, pt.y - 17)}
                        fill="#D1D5DB"
                        fontSize="8"
                        textAnchor="middle"
                      >
                        {pt.billCount} bills
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Chart 2: Payment Mode Donut Ring */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>
              <PieChart size={16} />
              Payment Mode Breakdown
            </h2>
            <span className={styles.chartSubtitle}>
              Cash vs. UPI vs. Udhar
            </span>
          </div>

          <div className={styles.donutWrapper}>
            <div className={styles.donutSvgBox}>
              <svg
                viewBox="0 0 140 140"
                width="140"
                height="140"
                style={{ transform: 'rotate(-90deg)' }}
              >
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#F3F4F6"
                  strokeWidth="14"
                />

                {/* Cash Segment (1. Green) */}
                {paymentModeBreakdown.cash > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth="14"
                    strokeDasharray={`${cashDash} ${circumference - cashDash}`}
                    strokeDashoffset={cashOffset}
                  />
                )}

                {/* UPI Segment (2. Hibiscus) */}
                {paymentModeBreakdown.upi > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#EC4899"
                    strokeWidth="14"
                    strokeDasharray={`${upiDash} ${circumference - upiDash}`}
                    strokeDashoffset={upiOffset}
                  />
                )}

                {/* Udhar Segment (3. Marigold) */}
                {paymentModeBreakdown.udhar > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth="14"
                    strokeDasharray={`${udharDash} ${circumference - udharDash}`}
                    strokeDashoffset={udharOffset}
                  />
                )}
              </svg>

              <div className={styles.donutCenterText}>
                <span className={styles.donutCenterLabel}>TOTAL</span>
                <span className={styles.donutCenterValue}>
                  {formatInr(paymentModeBreakdown.total)}
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className={styles.legendDot} style={{ backgroundColor: '#10B981' }} />
                  <span>Cash</span>
                </div>
                <span className={styles.legendValue}>
                  {formatInr(paymentModeBreakdown.cash)} ({paymentModeBreakdown.cashPercent}%)
                </span>
              </div>

              <div className={styles.legendItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className={styles.legendDot} style={{ backgroundColor: '#EC4899' }} />
                  <span>UPI</span>
                </div>
                <span className={styles.legendValue}>
                  {formatInr(paymentModeBreakdown.upi)} ({paymentModeBreakdown.upiPercent}%)
                </span>
              </div>

              <div className={styles.legendItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className={styles.legendDot} style={{ backgroundColor: '#F59E0B' }} />
                  <span>Udhar</span>
                </div>
                <span className={styles.legendValue}>
                  {formatInr(paymentModeBreakdown.udhar)} ({paymentModeBreakdown.udharPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          4. INSIGHTS & ACTIONS ROW (Side-by-Side)
          --------------------------------------------------------------------- */}
      <section className={styles.insightsGrid} aria-label="Nursery Insights & Action Items">
        {/* Left: Top 5 Bestselling Botanical Cultivars */}
        <div className={styles.insightCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>
              <ShoppingBag size={16} />
              Top 5 Bestselling Cultivars
            </h2>
            <span className={styles.chartSubtitle}>
              By total pots sold
            </span>
          </div>

          <div className={styles.bestsellingList}>
            {bestsellingPlants.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: '#6B7280', padding: '0.5rem 0' }}>
                No plant sales recorded yet. Register retail bills at the POS counter!
              </p>
            ) : (
              bestsellingPlants.map((plant) => {
                const fillPercent = Math.min(
                  100,
                  Math.round((plant.totalSold / maxSoldVolume) * 100)
                );
                return (
                  <div key={plant.plantId} className={styles.bestsellingItem}>
                    <div className={styles.bestsellingHeader}>
                      <div className={styles.bestsellingName}>
                        <span>{plant.name}</span>
                        {plant.marathiName && (
                          <span style={{ color: '#6B7280', fontWeight: 400 }}>
                            ({plant.marathiName})
                          </span>
                        )}
                        <span className={styles.bestsellingSku}>[{plant.sku}]</span>
                      </div>
                      <div className={styles.bestsellingStats}>
                        {plant.totalSold} pots • {formatInr(plant.revenue)}
                      </div>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Restock Alerts & Overdue Customer Udhar */}
        <div className={styles.insightCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>
              <AlertTriangle size={16} />
              Nursery Restock & Credit Follow-Ups
            </h2>
            <span className={styles.chartSubtitle}>
              Actionable inventory & debtor alerts
            </span>
          </div>

          <div className={styles.alertsList}>
            {/* Low-stock Alerts */}
            {inventoryOverview.lowStockAlerts.map((item) => (
              <div
                key={`stock-${item.id}`}
                className={`${styles.alertItem} ${styles.alertItemStock}`}
              >
                <div className={styles.alertInfo}>
                  <span className={styles.alertTitle}>
                    ⚠️ Low Stock: {item.name} [{item.sku}]
                  </span>
                  <span className={styles.alertMeta}>
                    Only {item.stockCount} pots left • Polyhouse: {item.polyhouseNo || 'Yard'}
                  </span>
                </div>
                <button
                  type="button"
                  className={`${styles.alertActionBtn} ${styles.btnRestock}`}
                  onClick={() => router.push(`${APP_ROUTES.INVENTORY_NEW}?plantId=${item.id}`)}
                >
                  + Order Batch
                </button>
              </div>
            ))}

            {/* Overdue Udhar Alerts */}
            {udharOverview.topOverdueCustomers.map((cust) => (
              <div
                key={`udhar-${cust.id}`}
                className={`${styles.alertItem} ${styles.alertItemUdhar}`}
              >
                <div className={styles.alertInfo}>
                  <span className={styles.alertTitle}>
                    💳 Due Udhar: {cust.name}
                  </span>
                  <span className={styles.alertMeta}>
                    Balance: {formatInr(cust.totalUdharDue)} • {cust.phone}
                  </span>
                </div>
                <button
                  type="button"
                  className={`${styles.alertActionBtn} ${styles.btnWhatsAppRemind}`}
                  onClick={() =>
                    openWhatsAppReminder(cust.name, cust.phone, cust.totalUdharDue)
                  }
                >
                  <MessageCircle size={12} />
                  WhatsApp
                </button>
              </div>
            ))}

            {inventoryOverview.lowStockAlerts.length === 0 &&
              udharOverview.topOverdueCustomers.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#047857', padding: '0.5rem 0' }}>
                  ✓ All nursery inventory levels are healthy and no customer debts are overdue!
                </p>
              )}
          </div>
        </div>
      </section>
    </div>
  );
};
