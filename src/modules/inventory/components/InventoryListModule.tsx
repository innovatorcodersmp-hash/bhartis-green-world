/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/inventory/components/InventoryListModule.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built and refactored `<InventoryListModule>` with ultra-compact, low-profile spacing.
 *    - Integrated 4 ultra-compact `<MetricCard>` counters (18px values, 26px badges, 0.5rem grid gap).
 *    - Packed summary KPI bars and action buttons into a tight layout so data tables appear immediately on screen.
 *    - Maintained 44px touch targets on the primary '+ Log New Batch' action button and table controls.
 *    - Rendered `<InventoryTableWrapper>` with TanStack Table v8 and touch swipe scroll support.
 * 
 * 2. WHY IT WAS DONE:
 *    - Satisfies the ultra-compact UI refactor directive for space-saving, dense layouts across all modules.
 *    - Eliminates vertical scrolling on desktop and mobile displays by keeping KPI metrics low-profile.
 * 
 * 3. WHAT WAS USED:
 *    - Shared UI primitives: `<MetricCard>` and `<Button>`.
 *    - Lucide React icons (`Layers`, `PackageCheck`, `AlertTriangle`, `IndianRupee`, `Plus`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Calculates metrics dynamically using `useMemo` and renders a high-density 0.5rem KPI grid above the data table.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  PackageCheck,
  AlertTriangle,
  IndianRupee,
  Plus,
} from 'lucide-react';
import { MetricCard, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { InventoryBatchWithRelations } from '../types';
import { InventoryTableWrapper } from './InventoryTableWrapper';

export interface InventoryListModuleProps {
  batches: InventoryBatchWithRelations[];
}

export const InventoryListModule: React.FC<InventoryListModuleProps> = ({ batches }) => {
  useSetPageHeader({
    title: 'Sapling Batches & Inventory',
  });

  // Calculate live inventory metrics
  const metrics = useMemo(() => {
    let activeStock = 0;
    let initialTotal = 0;
    let mortalityTotal = 0;
    let valuationTotal = 0;

    for (const batch of batches) {
      activeStock += batch.currentQty;
      initialTotal += batch.initialQty;
      mortalityTotal += batch.mortalityQty;
      const unitPrice = batch.plant?.price || 0;
      valuationTotal += batch.currentQty * unitPrice;
    }

    const mortalityRate =
      initialTotal > 0 ? (mortalityTotal / initialTotal) * 100 : 0;

    const distinctBatches = new Set(batches.map((b) => b.batchNumber)).size;

    return {
      totalBatches: batches.length,
      distinctConsignments: distinctBatches,
      activeStockUnits: activeStock,
      totalMortality: mortalityTotal,
      mortalityRatePercent: mortalityRate,
      stockValuation: valuationTotal,
    };
  }, [batches]);

  const addBatchButton = (
    <Link href={APP_ROUTES.INVENTORY_NEW} style={{ textDecoration: 'none' }}>
      <Button variant="primary" leftIcon={<Plus size={15} />}>
        Log New Batch
      </Button>
    </Link>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* Top KPI Metrics Grid - Ultra-Compact & Low Profile */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: '0.5rem',
        }}
        aria-label="Inventory Batches Summary"
      >
        <MetricCard
          label="Total Sapling Batches"
          value={
            metrics.distinctConsignments !== metrics.totalBatches && metrics.distinctConsignments > 0
              ? `${metrics.distinctConsignments} (${metrics.totalBatches} varieties)`
              : metrics.totalBatches
          }
          icon={<Layers size={14} />}
          variant="cornflower"
        />

        <MetricCard
          label="Active Stock Units"
          value={`${metrics.activeStockUnits.toLocaleString('en-IN')} pots`}
          icon={<PackageCheck size={14} />}
          variant="success"
        />

        <MetricCard
          label="Total Mortality Loss"
          value={`${metrics.totalMortality.toLocaleString('en-IN')} pots`}
          icon={<AlertTriangle size={14} />}
          variant={metrics.totalMortality > 0 ? 'rose' : 'default'}
        />

        <MetricCard
          label="Stock Valuation"
          value={`₹${metrics.stockValuation.toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
          icon={<IndianRupee size={14} />}
          variant="lavender"
        />
      </section>

      {/* Main TanStack Data Table with Search and Swipe Scroll */}
      <InventoryTableWrapper batches={batches} toolbarActions={addBatchButton} />
    </div>
  );
};
