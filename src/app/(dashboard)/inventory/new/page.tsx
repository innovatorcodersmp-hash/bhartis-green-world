/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/inventory/new/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented server routing shell for logging a new sapling inventory consignment (`/inventory/new`).
 *    - Concurrently fetched botanical plant cultivars, wholesale suppliers, auto-generated batch sequence,
 *      and active existing batch codes for re-use or consignment appending.
 *    - Rendered `<InventoryForm mode="create" />` with multi-plant repeater capabilities.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills User Request: "Multi-Plant Repeater UI in InventoryForm.tsx".
 *    - Enables instant rendering on mobile and desktop without client layout shifts.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Actions `getPlantsAction`, `getVendorsAction`, `getNextBatchCodeAction`, `getExistingBatchCodesAction`.
 *    - Shared feature component `<InventoryForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - Resolves catalogue data in parallel and feeds `<InventoryForm>`.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getPlantsAction } from '@/modules/plants/actions';
import { getVendorsAction } from '@/modules/vendors/actions';
import { getNextBatchCodeAction, getExistingBatchCodesAction } from '@/modules/inventory/actions';
import { InventoryForm } from '@/modules/inventory/components';

export const dynamic = 'force-dynamic';

interface NewInventoryBatchPageProps {
  searchParams?: Promise<{ plantId?: string }>;
}

export default async function NewInventoryBatchPage(props: NewInventoryBatchPageProps) {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : {};
  const initialPlantId = resolvedSearchParams.plantId;

  const [plantsResult, vendorsResult, batchCodeResult, existingCodesResult] = await Promise.all([
    getPlantsAction(),
    getVendorsAction(),
    getNextBatchCodeAction(),
    getExistingBatchCodesAction(),
  ]);

  const plants = plantsResult.success && plantsResult.data ? plantsResult.data : [];
  const vendors = vendorsResult.success && vendorsResult.data ? vendorsResult.data : [];
  const initialBatchCode = batchCodeResult.success && batchCodeResult.data
    ? batchCodeResult.data
    : `BGW-BAT-${new Date().getFullYear()}-0001`;
  const existingBatchCodes = existingCodesResult.success && existingCodesResult.data
    ? existingCodesResult.data
    : [];

  return (
    <React.Suspense fallback={null}>
      <InventoryForm
        mode="create"
        plants={plants}
        vendors={vendors}
        initialBatchCode={initialBatchCode}
        existingBatchCodes={existingBatchCodes}
        initialPlantId={initialPlantId}
      />
    </React.Suspense>
  );
}
