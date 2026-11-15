/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/plants/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for the `/plants` master directory route.
 *    - Fetched all active plant records via Server Action `getPlantsAction()`.
 *    - Rendered the modular `<PlantListModule>` client container.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: "Pages inside Next.js app/ are lightweight routing shells (under 50-80 lines)".
 *    - Executes database data retrieval directly on the server for instant page delivery.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Action `getPlantsAction`.
 *    - Feature module component `<PlantListModule>`.
 * 
 * 4. HOW IT WORKS:
 *    - Next.js runs this component on the server, fetches records, and hydrates `<PlantListModule>` with data.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getPlantsAction } from '@/modules/plants/actions';
import { PlantListModule } from '@/modules/plants/components';

export const dynamic = 'force-dynamic';

export default async function PlantsDirectoryPage() {
  const result = await getPlantsAction();
  const plants = result.success && result.data ? result.data : [];

  return <PlantListModule plants={plants} />;
}
