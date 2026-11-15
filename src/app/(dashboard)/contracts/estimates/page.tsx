/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/contracts/estimates/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented server routing shell for `/contracts/estimates` dashboard directory route.
 *    - Retrieved all landscaping quotations via Server Action `getLandscapingEstimatesAction()`.
 *    - Rendered the modular `<EstimateTableWrapper>` client container with PDF download,
 *      WhatsApp sharing, and contract conversion workflows.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: CREATE APP ROUTER PAGE (contracts/estimates/page.tsx)".
 *    - Executes database data retrieval directly on the server for instant page delivery.
 *    - Complies with Specification 01: "Lightweight routing shells (under 50-80 lines)".
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Action `getLandscapingEstimatesAction`.
 *    - Feature module component `<EstimateTableWrapper>`.
 * 
 * 4. HOW IT WORKS:
 *    - Runs server-side, loads estimates from PostgreSQL via Prisma ORM, and passes data to `<EstimateTableWrapper>`.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import type { Metadata } from 'next';
import { getLandscapingEstimatesAction } from '@/modules/contracts/actions';
import { EstimateTableWrapper } from '@/modules/contracts/components';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Landscaping Site Estimates & Quotations | Bharti's Green World ERP",
  description:
    "Review, generate PDF proposals, share via WhatsApp, and convert site quotations into active garden contracts.",
};

export default async function EstimatesDirectoryPage() {
  const result = await getLandscapingEstimatesAction();
  const estimates = result.success && result.data ? result.data : [];

  return <EstimateTableWrapper estimates={estimates} />;
}

