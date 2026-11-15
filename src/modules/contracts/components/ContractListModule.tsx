/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/components/ContractListModule.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<ContractListModule>`, the client supervisor dashboard for Landscaping Projects & Garden Contracts.
 *    - Integrated 4 ultra-compact `<MetricCard>` counters (18px values, 26px badges, 0.5rem grid gap):
 *      a) Total Active Contracts (Live contracted projects).
 *      b) Lawn & Orchard Projects (Combined count of turf and fruit grove developments).
 *      c) Total Estimated Value (Gross contracted revenue quotation).
 *      d) Pending Contract Dues (Outstanding project balances awaiting client clearance).
 *    - Rendered the primary "+ New Contract" entry button linking to `APP_ROUTES.CONTRACTS_NEW`.
 *    - Embedded `<ContractTableWrapper>` (TanStack Table v8) with interactive filtering, sorting, and touch swipe.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Mobile PWA Layout Efficiency" and Specification 03: "Component Specifications".
 *    - Provides nursery landscaping directors with an immediate overview of site milestones and project receivables.
 * 
 * 3. WHAT WAS USED:
 *    - Shared UI primitives: `<MetricCard>` and `<Button>`.
 *    - Lucide React icons (`FileText`, `Sprout`, `IndianRupee`, `AlertCircle`, `Plus`).
 *    - Centralized route constants (`APP_ROUTES`).
 *    - React 19 hooks (`useMemo`).
 *    - Header synchronization hook (`useSetPageHeader`).
 * 
 * 4. HOW IT WORKS:
 *    - Aggregates contract totals, stages, and dues via `useMemo`, renders the KPI grid, and mounts the data table.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sprout,
  IndianRupee,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { MetricCard, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  GardenContractWithRelations,
  ContractDirectoryMetrics,
} from '../types';
import { ContractTableWrapper } from './ContractTableWrapper';

export interface ContractListModuleProps {
  contracts: GardenContractWithRelations[];
}

export const ContractListModule: React.FC<ContractListModuleProps> = ({
  contracts,
}) => {
  useSetPageHeader({
    title: 'Landscaping Projects & Garden Contracts',
  });

  // Calculate live contract KPI metrics
  const metrics: ContractDirectoryMetrics = useMemo(() => {
    let lawnOrchard = 0;
    let totalEstimateSum = 0;
    let pendingDueSum = 0;

    for (const c of contracts) {
      if (c.projectType === 'LAWN' || c.projectType === 'ORCHARD') {
        lawnOrchard += 1;
      }
      totalEstimateSum += c.totalEstimate;
      pendingDueSum += c.balanceAmount;
    }

    return {
      totalContracts: contracts.length,
      lawnOrchardCount: lawnOrchard,
      totalEstimatedValue: totalEstimateSum,
      pendingDues: pendingDueSum,
    };
  }, [contracts]);

  const toolbarButtons = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Link href={APP_ROUTES.CONTRACTS_ESTIMATES} style={{ textDecoration: 'none' }}>
        <Button variant="outline" leftIcon={<FileText size={15} />}>
          Site Estimates
        </Button>
      </Link>
      <Link href={APP_ROUTES.CONTRACTS_NEW} style={{ textDecoration: 'none' }}>
        <Button variant="primary" leftIcon={<Plus size={15} />}>
          New Contract
        </Button>
      </Link>
    </div>
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
        aria-label="Landscaping Contracts Summary"
      >
        <MetricCard
          label="Total Active Contracts"
          value={metrics.totalContracts}
          icon={<FileText size={14} />}
          variant="cornflower"
        />

        <MetricCard
          label="Lawn & Orchard Sites"
          value={metrics.lawnOrchardCount}
          icon={<Sprout size={14} />}
          variant="success"
        />

        <MetricCard
          label="Total Estimated Value"
          value={`₹${metrics.totalEstimatedValue.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
          })}`}
          icon={<IndianRupee size={14} />}
          variant="lavender"
        />

        <MetricCard
          label="Pending Contract Dues"
          value={`₹${metrics.pendingDues.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
          })}`}
          icon={<AlertCircle size={14} />}
          variant={metrics.pendingDues > 0 ? 'rose' : 'success'}
        />
      </section>

      {/* Main TanStack Data Table with Search, Filter & Swipe Scroll */}
      <ContractTableWrapper
        contracts={contracts}
        toolbarActions={toolbarButtons}
      />
    </div>
  );
};
