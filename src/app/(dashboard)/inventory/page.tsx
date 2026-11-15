/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/inventory/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for the `/inventory` sapling batch ledger route.
 *    - Fetched all active inventory batches with relational plant and vendor data via `getInventoryBatchesAction()`.
 *    - Rendered the modular `<InventoryListModule>` client container.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: "Pages inside Next.js app/ are lightweight routing shells (under 50-80 lines)".
 *    - Executes database data retrieval directly on the server for instant page delivery.
 *    - Strictly avoids modal popups in favor of full-screen responsive layouts.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Action `getInventoryBatchesAction`.
 *    - Feature module component `<InventoryListModule>`.
 * 
 * 4. HOW IT WORKS:
 *    - Next.js executes this component on the server, fetches batches and joins from PostgreSQL,
 *      and hydrates `<InventoryListModule>` with live data.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getInventoryBatchesAction } from '@/modules/inventory/actions';
import { InventoryListModule } from '@/modules/inventory/components';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const result = await getInventoryBatchesAction();
  const batches = result.success && result.data ? result.data : [];

  return <InventoryListModule batches={batches} />;
}
