/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/plants/new/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the lightweight routing shell for the `/plants/new` route.
 *    - Queried the next sequential plant code (`BGW-PLT-{paddedSequence}`) server-side
 *      via `getNextPlantCodeAction()`.
 *    - Rendered the reusable `<PlantForm>` in create mode (`mode="create"`) seeded with `initialSku`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.4: "Strict Dedicated Full-Screen Routes (NO POPUPS / MODALS)".
 *    - Pre-populates the auto-generated sequential plant SKU immediately on server render,
 *      eliminating client-side loading flashes or layout shifts.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router Server Component.
 *    - Server Action `getNextPlantCodeAction`.
 *    - Feature module component `<PlantForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - Mounts on `/plants/new`, queries the next available plant SKU from PostgreSQL,
 *      and renders `<PlantForm mode="create" initialSku={initialSku} />`.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { PlantForm } from '@/modules/plants/components';
import { getNextPlantCodeAction } from '@/modules/plants/actions';

export const dynamic = 'force-dynamic';

export default async function NewPlantPage() {
  const result = await getNextPlantCodeAction();
  const initialSku = result.success && result.data ? result.data : 'BGW-PLT-0001';

  return <PlantForm mode="create" initialSku={initialSku} />;
}
