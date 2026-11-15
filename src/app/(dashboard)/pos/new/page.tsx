/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/pos/new/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for the full-screen retail POS Cashier Counter (`/pos/new`).
 *    - Concurrently pre-fetched active customers, botanical plant inventory, and the next sequential
 *      invoice tracking code (`BGW-INV-YYYY-XXXX`) via `getCustomersAction()`, `getPlantsAction()`,
 *      and `getNextInvoiceNumberAction()`.
 *    - Rendered the dedicated `<PosBillingForm>` with pre-hydrated `initialInvoiceNumber`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: AUTOMATE INVOICE NUMBER GENERATION WITH BGW PREFIX IN POS MODULE".
 *    - Fulfills Specification 01: "Strict Dedicated Full-Screen Routes", "Zero Popups/Modals", "Clean Form Standards".
 *    - Eliminates layout shift and delays by delivering the next sequential invoice number server-side before client hydration.
 *    - Supplies plant catalogs with live prices and customer profiles with outstanding credit balances upfront.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Actions `getCustomersAction`, `getPlantsAction`, and `getNextInvoiceNumberAction`.
 *    - POS module component `<PosBillingForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - Concurrently fetches customer lists, plant inventory, and the next sequential invoice tracking code
 *      on the server via `Promise.all()`, hydrating `<PosBillingForm>` for immediate offline-capable
 *      barcode/line-item additions with zero invoice number entry required.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getCustomersAction } from '@/modules/customers/actions';
import { getPlantsAction } from '@/modules/plants/actions';
import { getNextInvoiceNumberAction } from '@/modules/pos/actions';
import { PosBillingForm } from '@/modules/pos/components';

export const dynamic = 'force-dynamic';

export default async function NewPosBillPage() {
  const [customersResult, plantsResult, invoiceNumberResult] = await Promise.all([
    getCustomersAction(),
    getPlantsAction(),
    getNextInvoiceNumberAction(),
  ]);

  const customers = customersResult.success && customersResult.data ? customersResult.data : [];
  const plants = plantsResult.success && plantsResult.data ? plantsResult.data : [];
  const initialInvoiceNumber =
    invoiceNumberResult.success && invoiceNumberResult.data ? invoiceNumberResult.data : undefined;

  return (
    <PosBillingForm
      customers={customers}
      plants={plants}
      initialInvoiceNumber={initialInvoiceNumber}
    />
  );
}
