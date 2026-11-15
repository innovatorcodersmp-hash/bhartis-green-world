/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/vendors/components/VendorListModule.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built and refactored `<VendorListModule>` with ultra-compact, low-profile spacing.
 *    - Integrated 4 ultra-compact `<MetricCard>` counters (18px values, 26px badges, 0.5rem grid gap).
 *    - Packed summary KPI bars and action buttons into a tight layout so data tables appear immediately on screen.
 *    - Maintained 44px touch targets on the primary '+ Add Vendor' action button and table controls.
 *    - Wrapped data presentation inside `<VendorTableWrapper>` (TanStack Table v8).
 * 
 * 2. WHY IT WAS DONE:
 *    - Satisfies the ultra-compact UI refactor directive for space-saving, dense layouts across all modules.
 *    - Eliminates vertical scrolling on desktop and mobile displays by keeping KPI metrics low-profile.
 * 
 * 3. WHAT WAS USED:
 *    - Shared UI primitives: `<MetricCard>` and `<Button>`.
 *    - Lucide React icons (`Truck`, `Sprout`, `Package`, `Layers`, `Plus`).
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
  Truck,
  Sprout,
  Package,
  Layers,
  Plus,
} from 'lucide-react';
import { MetricCard, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Vendor, VendorDirectoryMetrics } from '../types';
import { VendorTableWrapper } from './VendorTableWrapper';

export interface VendorListModuleProps {
  vendors: Vendor[];
}

export const VendorListModule: React.FC<VendorListModuleProps> = ({ vendors }) => {
  useSetPageHeader({
    title: 'Vendor Master Directory',
  });

  // Calculate live vendor directory metrics
  const metrics: VendorDirectoryMetrics = useMemo(() => {
    let saplings = 0;
    let pots = 0;
    let fertilizers = 0;

    for (const vendor of vendors) {
      if (vendor.category === 'SEEDS_SAPLINGS') saplings += 1;
      if (vendor.category === 'POTS_CONTAINERS') pots += 1;
      if (vendor.category === 'FERTILIZERS_SOIL') fertilizers += 1;
    }

    return {
      totalVendors: vendors.length,
      saplingSuppliersCount: saplings,
      potVendorsCount: pots,
      fertilizerDealersCount: fertilizers,
    };
  }, [vendors]);

  const addVendorButton = (
    <Link href={APP_ROUTES.VENDORS_NEW} style={{ textDecoration: 'none' }}>
      <Button variant="primary" leftIcon={<Plus size={15} />}>
        Add Vendor
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
        aria-label="Vendor Directory Metrics Summary"
      >
        <MetricCard
          label="Total Registered Suppliers"
          value={metrics.totalVendors}
          icon={<Truck size={14} />}
          variant="cornflower"
        />

        <MetricCard
          label="Seeds & Sapling Growers"
          value={metrics.saplingSuppliersCount}
          icon={<Sprout size={14} />}
          variant="success"
        />

        <MetricCard
          label="Pots & Grow Bags"
          value={metrics.potVendorsCount}
          icon={<Package size={14} />}
          variant="marigold"
        />

        <MetricCard
          label="Fertilizers & Soil Dealers"
          value={metrics.fertilizerDealersCount}
          icon={<Layers size={14} />}
          variant="lavender"
        />
      </section>

      {/* Main TanStack Data Table with Search and Swipe Scroll */}
      <VendorTableWrapper
        vendors={vendors}
        toolbarActions={addVendorButton}
      />
    </div>
  );
};
