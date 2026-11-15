/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/pos/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for the `/pos` Cashier Counter & Billing route.
 *    - Fetched all active POS bill records via Server Action `getPosBillsAction()`.
 *    - Rendered the modular `<PosListModule>` client container.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: "Pages inside Next.js app/ are lightweight routing shells (under 50-80 lines)".
 *    - Performs server-side data fetching directly with relational joins for instantaneous initial load.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Action `getPosBillsAction`.
 *    - Feature module component `<PosListModule>`.
 * 
 * 4. HOW IT WORKS:
 *    - Runs server-side, loads bills from PostgreSQL database, and passes them to `<PosListModule>` for client interaction.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getPosBillsAction } from '@/modules/pos/actions';
import { PosListModule } from '@/modules/pos/components';

export const dynamic = 'force-dynamic';

export default async function PosDirectoryPage() {
  const result = await getPosBillsAction();
  const bills = result.success && result.data ? result.data : [];

  return <PosListModule bills={bills} />;
}
