/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/contracts/new/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for registering a new landscaping project (`/contracts/new`).
 *    - Concurrently pre-fetched active client profiles via `getCustomersAction()` and the next sequential
 *      contract number formatted as `BGW-CNT-YYYY-XXXX` via `getNextContractNumberAction()`.
 *    - Rendered the single reusable `<ContractForm mode="create" customers={customers} initialContractNo={initialContractNo} />` component.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: AUTOMATE CONTRACT NUMBER GENERATION WITH BGW PREFIX IN LANDSCAPING MODULE".
 *    - Fulfills Specification 01: "Single Reusable Form", "Strict Dedicated Full-Screen Routes", "Zero Popups/Modals".
 *    - Pre-populates the auto-generated sequential tracking code immediately on server render,
 *      eliminating client-side loading flashes or layout shifts.
 *    - Ensures full mobile touch ergonomics and responsive layout without modal clipping.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Actions `getCustomersAction` and `getNextContractNumberAction`.
 *    - Feature module component `<ContractForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - Fetches customer directory and sequential `BGW-CNT-YYYY-XXXX` code on server, passes them
 *      to `<ContractForm>`, and renders full-screen form view.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getCustomersAction } from '@/modules/customers/actions';
import { getNextContractNumberAction } from '@/modules/contracts/actions';
import { ContractForm } from '@/modules/contracts/components';

export const dynamic = 'force-dynamic';

export default async function NewContractPage() {
  const [customersResult, contractNoResult] = await Promise.all([
    getCustomersAction(),
    getNextContractNumberAction(),
  ]);

  const customers = customersResult.success && customersResult.data ? customersResult.data : [];
  const currentYear = new Date().getFullYear();
  const initialContractNo =
    contractNoResult.success && contractNoResult.data
      ? contractNoResult.data
      : `BGW-CNT-${currentYear}-0001`;

  return (
    <ContractForm
      mode="create"
      customers={customers}
      initialContractNo={initialContractNo}
    />
  );
}
