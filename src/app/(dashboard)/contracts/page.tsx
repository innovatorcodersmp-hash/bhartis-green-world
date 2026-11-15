/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/contracts/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for the `/contracts` master directory route.
 *    - Fetched all active Landscaping Projects via Server Action `getContractsAction()`.
 *    - Rendered the modular `<ContractListModule>` client container.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: "Pages inside Next.js app/ are lightweight routing shells (under 50-80 lines)".
 *    - Executes database data retrieval directly on the server for instant page delivery.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Action `getContractsAction`.
 *    - Feature module component `<ContractListModule>`.
 * 
 * 4. HOW IT WORKS:
 *    - Runs server-side, loads contracts with joined customer profiles from PostgreSQL, and passes data to `<ContractListModule>`.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getContractsAction } from '@/modules/contracts/actions';
import { ContractListModule } from '@/modules/contracts/components';

export const dynamic = 'force-dynamic';

export default async function ContractsDirectoryPage() {
  const result = await getContractsAction();
  const contracts = result.success && result.data ? result.data : [];

  return <ContractListModule contracts={contracts} />;
}
