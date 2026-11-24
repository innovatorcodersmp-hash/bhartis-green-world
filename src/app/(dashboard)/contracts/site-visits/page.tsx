/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/contracts/site-visits/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented server routing shell for `/contracts/site-visits` directory route.
 *    - Retrieved all landscaping routine maintenance logs via Server Action `getSiteVisitsAction()`.
 *    - Rendered the modular `<SiteVisitListModule>` client container with 1-click WhatsApp updates.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT SITE VISIT & MAINTENANCE WHATSAPP UPDATE".
 *    - Executes database retrieval on the server for instant page delivery.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import type { Metadata } from 'next';
import { getSiteVisitsAction } from '@/modules/landscaping/actions';
import { SiteVisitListModule } from '@/modules/landscaping/components';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Site Visits & Maintenance Logs | Bharti's Green World ERP",
  description:
    "Track routine garden maintenance, check plant health, and send client WhatsApp updates.",
};

export default async function SiteVisitsDirectoryPage() {
  const result = await getSiteVisitsAction();
  const visits = result.success && result.data ? result.data : [];

  return <SiteVisitListModule visits={visits} />;
}

