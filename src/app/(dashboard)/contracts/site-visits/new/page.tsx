/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/contracts/site-visits/new/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented server routing shell for `/contracts/site-visits/new` creation route.
 *    - Prefetched active contracts via `getContractsForSiteVisitAction()` for instant dropdown auto-fill.
 *    - Rendered the modular `<SiteVisitForm>` client form container.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT SITE VISIT & MAINTENANCE WHATSAPP UPDATE".
 *    - Satisfies dedicated full-screen route architecture with zero popup forms.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import type { Metadata } from 'next';
import { getContractsForSiteVisitAction } from '@/modules/landscaping/actions';
import { SiteVisitForm } from '@/modules/landscaping/components';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Log Site Visit & Maintenance | Bharti's Green World ERP",
  description:
    "Record garden inspection notes, quick-select work done, and dispatch WhatsApp updates.",
};

export default async function NewSiteVisitPage() {
  const result = await getContractsForSiteVisitAction();
  const contracts = result.success && result.data ? result.data : [];

  return <SiteVisitForm contracts={contracts} />;
}

