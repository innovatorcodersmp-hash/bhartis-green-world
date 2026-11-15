/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/plants/components/PlantListModule.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built and refactored `<PlantListModule>` with ultra-compact, low-profile spacing.
 *    - Integrated 4 ultra-compact `<MetricCard>` counters (18px values, 26px badges, 0.5rem grid gap).
 *    - Packed summary KPI bars and action buttons into a tight layout so data tables appear immediately on screen.
 *    - Maintained 44px touch targets on the primary '+ Add Plant' action button and table controls.
 *    - Wrapped data presentation inside `<PlantTableWrapper>` (TanStack Table v8).
 * 
 * 2. WHY IT WAS DONE:
 *    - Satisfies the ultra-compact UI refactor directive for space-saving, dense layouts across all modules.
 *    - Eliminates vertical scrolling on desktop and mobile displays by keeping KPI metrics low-profile.
 * 
 * 3. WHAT WAS USED:
 *    - Shared UI primitives: `<MetricCard>` and `<Button>`.
 *    - Lucide React icons (`Sprout`, `PackageCheck`, `IndianRupee`, `AlertTriangle`, `Plus`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Calculates metrics dynamically using `useMemo` and renders a high-density 0.5rem KPI grid above the data table.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sprout,
  PackageCheck,
  IndianRupee,
  AlertTriangle,
  Plus,
  QrCode,
} from 'lucide-react';
import { MetricCard, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Plant, PlantDirectoryMetrics } from '../types';
import { PlantTableWrapper } from './PlantTableWrapper';
import { BulkPlantQrModal } from './BulkPlantQrModal';

export interface PlantListModuleProps {
  plants: Plant[];
}

export const PlantListModule: React.FC<PlantListModuleProps> = ({ plants }) => {
  const [isBulkQrOpen, setIsBulkQrOpen] = useState(false);

  useSetPageHeader({
    title: 'Plant Master Directory',
    subtitle: 'Manage botanical cultivars, retail pricing, and live nursery stock.',
  });

  // Calculate summary metrics across live inventory
  const metrics: PlantDirectoryMetrics = useMemo(() => {
    let totalStock = 0;
    let totalVal = 0;
    let lowStock = 0;

    for (const plant of plants) {
      totalStock += plant.stockCount;
      totalVal += plant.stockCount * plant.price;
      if (plant.stockCount < 10) {
        lowStock += 1;
      }
    }

    return {
      totalVarieties: plants.length,
      totalStockUnits: totalStock,
      totalAssetValue: totalVal,
      lowStockCount: lowStock,
    };
  }, [plants]);

  const toolbarButtons = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsBulkQrOpen(true)}
        leftIcon={<QrCode size={15} />}
        style={{
          borderColor: 'rgba(16, 185, 129, 0.45)',
          color: '#1B4D3E',
          backgroundColor: '#FFFFFF',
          fontWeight: 600,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
        title="Print batch QR sticker tags for all nursery plants"
        aria-label="Bulk Print QR Codes"
      >
        Bulk Print QR
      </Button>

      <Link href={APP_ROUTES.PLANTS_NEW} style={{ textDecoration: 'none' }}>
        <Button variant="hibiscus" leftIcon={<Plus size={15} />}>
          Add Plant
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
        aria-label="Inventory Metrics Summary"
      >
        <MetricCard
          label="Total Plant Varieties"
          value={metrics.totalVarieties}
          icon={<Sprout size={14} />}
          variant="cornflower"
          description="Active botanical cultivars"
        />

        <MetricCard
          label="Total Stock on Hand"
          value={`${metrics.totalStockUnits.toLocaleString('en-IN')} pots`}
          icon={<PackageCheck size={14} />}
          variant="success"
          description="Ready for sale & planting"
        />

        <MetricCard
          label="Inventory Retail Value"
          value={`₹${metrics.totalAssetValue.toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
          icon={<IndianRupee size={14} />}
          variant="lavender"
          description="Total nursery asset value"
        />

        <MetricCard
          label="Low Stock Alerts"
          value={metrics.lowStockCount}
          icon={<AlertTriangle size={14} />}
          variant={metrics.lowStockCount > 0 ? 'marigold' : 'default'}
          description="Varieties with <10 pots"
        />
      </section>

      {/* Main TanStack Data Table with Search and Swipe Scroll */}
      <PlantTableWrapper plants={plants} toolbarActions={toolbarButtons} />

      {/* Bulk Botanical QR Label Sheet Modal */}
      <BulkPlantQrModal
        plants={plants}
        isOpen={isBulkQrOpen}
        onClose={() => setIsBulkQrOpen(false)}
      />
    </div>
  );
};
