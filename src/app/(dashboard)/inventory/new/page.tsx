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
 *    - Implemented the server routing shell for logging a new sapling inventory batch (`/inventory/new`).
 *    - Pre-fetched active plant varieties, wholesale vendors, and the auto-generated sequential batch tracking code
 *      via `getPlantsAction()`, `getVendorsAction()`, and `getNextBatchCodeAction()`.
 *    - Rendered the single reusable `<InventoryForm>` component in create mode (`mode="create"`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.3 & 1.4: "Single Reusable Form", "Strict Dedicated Full-Screen Routes".
 *    - Pre-populates the auto-generated sequential batch code (`BGW-BAT-YYYY-XXXX`) immediately on the server,
 *      eliminating client-side loading flashes or shifts.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Actions `getPlantsAction`, `getVendorsAction`, and `getNextBatchCodeAction`.
 *    - Shared feature component `<InventoryForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - Concurrently resolves plant catalogue, vendor list, and next batch code on the server,
 *      passing them as props to `<InventoryForm>` for instantaneous, lag-free user interaction.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getPlantsAction } from '@/modules/plants/actions';
import { getVendorsAction } from '@/modules/vendors/actions';
import { getNextBatchCodeAction } from '@/modules/inventory/actions';
import { InventoryForm } from '@/modules/inventory/components';

export const dynamic = 'force-dynamic';

export default async function NewInventoryBatchPage() {
  const [plantsResult, vendorsResult, batchCodeResult] = await Promise.all([
    getPlantsAction(),
    getVendorsAction(),
    getNextBatchCodeAction(),
  ]);

  const plants = plantsResult.success && plantsResult.data ? plantsResult.data : [];
  const vendors = vendorsResult.success && vendorsResult.data ? vendorsResult.data : [];
  const initialBatchCode = batchCodeResult.success && batchCodeResult.data
    ? batchCodeResult.data
    : `BGW-BAT-${new Date().getFullYear()}-0001`;

  return (
    <InventoryForm
      mode="create"
      plants={plants}
      vendors={vendors}
      initialBatchCode={initialBatchCode}
    />
  );
}
