/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/labor/new/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for registering a new employee or daily wage worker (`/labor/new`).
 *    - Rendered the single reusable `<LaborWorkerForm mode="create" />` component on a dedicated full-screen layout.
 *    - Fulfill zero-modal architectural mandates.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Single Reusable Form", "Strict Dedicated Full-Screen Routes", "Zero Popups/Modals".
 *    - Ensures full mobile touch ergonomics and responsive layout for workforce onboarding in Kolhapur.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Feature module component `<LaborWorkerForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - Executes on server, initializes `<LaborWorkerForm>` in create mode with empty defaults, and renders full screen.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { LaborWorkerForm } from '@/modules/labor/components';

export const dynamic = 'force-dynamic';

export default function NewLaborWorkerPage() {
  return <LaborWorkerForm mode="create" />;
}
