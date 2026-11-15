/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/components/PosListModule.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<PosListModule>`, the client-side supervisor dashboard for Point of Sale (POS) retail billing logs.
 *    - Integrated 4 ultra-compact `<MetricCard>` counters (18px values, 26px badges, 0.5rem grid gap):
 *      a) Total Bills Generated (Total cashier transactions processed).
 *      b) Total Sales Revenue (Gross value of retail botanical sales).
 *      c) Cash & UPI Collections (Liquid revenue collected at the counter).
 *      d) Pending Credit Udhar (Receivables deferred to customer credit ledgers).
 *    - Provided a dedicated navigation button ("+ New Bill / Quick Counter") linking directly to the full-screen billing route.
 *    - Embedded `<PosTableWrapper>` (TanStack Table v8) with interactive search, sort, and touch swipe container.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Mobile PWA Layout Efficiency" and Specification 03: "Component Specifications".
 *    - Gives nursery supervisors an immediate real-time overview of daily counter cash flow and outstanding credit sales.
 *    - Keeps the summary low-profile so cashier transaction logs are instantly visible without scrolling.
 * 
 * 3. WHAT WAS USED:
 *    - Shared UI primitives: `<MetricCard>` and `<Button>`.
 *    - Lucide React icons (`Receipt`, `IndianRupee`, `Banknote`, `AlertCircle`, `Plus`).
 *    - Centralized route constants (`APP_ROUTES`).
 *    - React 19 hooks (`useMemo`).
 *    - Layout sync hook (`useSetPageHeader`).
 * 
 * 4. HOW IT WORKS:
 *    - Aggregates metrics from `bills` array, synchronizes page headers, and passes data to the table wrapper.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Receipt,
  IndianRupee,
  Banknote,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { MetricCard, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { PosBillWithRelations, PosDirectoryMetrics } from '../types';
import { PosTableWrapper } from './PosTableWrapper';

export interface PosListModuleProps {
  bills: PosBillWithRelations[];
}

export const PosListModule: React.FC<PosListModuleProps> = ({ bills }) => {
  useSetPageHeader({
    title: 'POS Billing & Cashier Counter',
  });

  // Calculate live POS directory KPI metrics
  const metrics: PosDirectoryMetrics = useMemo(() => {
    let salesTotal = 0;
    let collectionsTotal = 0;
    let udharTotal = 0;

    for (const bill of bills) {
      salesTotal += bill.totalAmount;
      collectionsTotal += bill.amountPaid;
      udharTotal += bill.balanceDue;
    }

    return {
      totalBills: bills.length,
      totalSalesRevenue: salesTotal,
      cashUpiCollections: collectionsTotal,
      pendingUdhar: udharTotal,
    };
  }, [bills]);

  const newBillButton = (
    <Link href={APP_ROUTES.POS_NEW} style={{ textDecoration: 'none' }}>
      <Button variant="hibiscus" leftIcon={<Plus size={15} />}>
        New Bill / Quick Counter
      </Button>
    </Link>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* Top Summary KPI Metrics Grid - Ultra-Compact & Low Profile */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: '0.5rem',
        }}
        aria-label="POS Counter Metrics Summary"
      >
        <MetricCard
          label="Total Bills Generated"
          value={metrics.totalBills}
          icon={<Receipt size={14} />}
          variant="cornflower"
        />

        <MetricCard
          label="Total Sales Revenue"
          value={`₹${metrics.totalSalesRevenue.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
          })}`}
          icon={<IndianRupee size={14} />}
          variant="lavender"
        />

        <MetricCard
          label="Cash & UPI Collections"
          value={`₹${metrics.cashUpiCollections.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
          })}`}
          icon={<Banknote size={14} />}
          variant="success"
        />

        <MetricCard
          label="Pending Credit Udhar"
          value={`₹${metrics.pendingUdhar.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
          })}`}
          icon={<AlertCircle size={14} />}
          variant={metrics.pendingUdhar > 0 ? 'rose' : 'success'}
        />
      </section>

      {/* Main TanStack Data Table with Search, Filter & Swipe Scroll */}
      <PosTableWrapper
        bills={bills}
        toolbarActions={newBillButton}
      />
    </div>
  );
};
