/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/inventory/[id]/edit/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the dynamic server routing shell for editing an existing sapling inventory batch (`/inventory/[id]/edit`).
 *    - Extracted the dynamic `id` route parameter and retrieved the batch record via `getInventoryBatchByIdAction(id)`.
 *    - Concurrently fetched available botanical plants and wholesale vendors for relational dropdown mapping.
 *    - Rendered `<InventoryForm mode="edit" initialData={batch} plants={plants} vendors={vendors} />` on dedicated full-screen layout.
 *    - Handled non-existent or archived record fallbacks gracefully.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.3 & 1.4: "Single Reusable Form", "Strict Dedicated Full-Screen Routes".
 *    - Eliminates modal overlays and sliding popups for batch editing and mortality adjustments.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js 16 App Router asynchronous `params` resolution.
 *    - Server Actions `getInventoryBatchByIdAction`, `getPlantsAction`, and `getVendorsAction`.
 *    - Shared feature component `<InventoryForm>`.
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Awaits `params.id`, retrieves entity from PostgreSQL with plant and vendor joins, and seeds `<InventoryForm>`.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import Link from 'next/link';
import {
  getInventoryBatchByIdAction,
} from '@/modules/inventory/actions';
import { getPlantsAction } from '@/modules/plants/actions';
import { getVendorsAction } from '@/modules/vendors/actions';
import { InventoryForm } from '@/modules/inventory/components';
import { Button } from '@/components/ui';
import { APP_ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

interface EditInventoryBatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInventoryBatchPage({
  params,
}: EditInventoryBatchPageProps) {
  const { id } = await params;

  const [batchResult, plantsResult, vendorsResult] = await Promise.all([
    getInventoryBatchByIdAction(id),
    getPlantsAction(),
    getVendorsAction(),
  ]);

  if (!batchResult.success || !batchResult.data) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '4rem 1rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1B4D3E' }}>
          Inventory Batch Not Found
        </h2>
        <p style={{ color: '#6B7280', maxWidth: '420px' }}>
          The requested sapling batch record does not exist or has been archived from nursery records.
        </p>
        <Link href={APP_ROUTES.INVENTORY} style={{ textDecoration: 'none' }}>
          <Button variant="primary">Return to Inventory</Button>
        </Link>
      </div>
    );
  }

  const plants = plantsResult.success && plantsResult.data ? plantsResult.data : [];
  const vendors = vendorsResult.success && vendorsResult.data ? vendorsResult.data : [];

  return (
    <InventoryForm
      mode="edit"
      initialData={batchResult.data}
      plants={plants}
      vendors={vendors}
    />
  );
}
