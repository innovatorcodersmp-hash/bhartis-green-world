/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/contracts/estimates/new/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented server routing shell for `/contracts/estimates/new` route.
 *    - Fetched registered client directory via `getCustomersAction()`.
 *    - Fetched live Plant Master directory via `getPlantsAction()` (`BGW-PLT-XXXX`).
 *    - Rendered the modular `<EstimateBuilderForm>` client container with live customer
 *      and plant master records for high-speed quotation drafting.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.4: "Dedicated Full-Screen Routing (STRICT: NO POPUPS / MODALS)".
 *    - Enables dynamic line item population directly from the Plant Master catalogue.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Actions `getCustomersAction` and `getPlantsAction`.
 *    - Feature module component `<EstimateBuilderForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - In parallel, queries PostgreSQL for customer records and active botanical plants.
 *    - Passes datasets down to `<EstimateBuilderForm>` for interactive quotation calculations.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import type { Metadata } from 'next';
import { getCustomersAction } from '@/modules/customers/actions';
import { getPlantsAction } from '@/modules/plants/actions';
import { EstimateBuilderForm } from '@/modules/contracts/components';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Create Site Quotation | Bharti's Green World ERP",
  description:
    "Draft landscaping material, grass sodding, palm plantation, and site preparation estimate in Kolhapur.",
};

export default async function NewEstimatePage() {
  const [customersRes, plantsRes] = await Promise.all([
    getCustomersAction(),
    getPlantsAction(),
  ]);

  const customers = customersRes.success && customersRes.data ? customersRes.data : [];
  const plants = plantsRes.success && plantsRes.data ? plantsRes.data : [];

  return <EstimateBuilderForm customers={customers} plants={plants} />;
}
