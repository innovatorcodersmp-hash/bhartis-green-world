/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/labor/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for the `/labor` employee directory route.
 *    - Fetched all active employee records via Server Action `getEmployeesAction()`.
 *    - Rendered the modular `<LaborListModule>` client container.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: "Pages inside Next.js app/ are lightweight routing shells (under 50-80 lines)".
 *    - Executes database retrieval directly on the server for instant page delivery.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Action `getEmployeesAction`.
 *    - Feature module component `<LaborListModule>`.
 * 
 * 4. HOW IT WORKS:
 *    - Runs server-side, loads staff profiles from PostgreSQL, and hydrates `<LaborListModule>` for client interaction.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getEmployeesAction } from '@/modules/labor/actions';
import { LaborListModule } from '@/modules/labor/components';

export const dynamic = 'force-dynamic';

export default async function LaborDirectoryPage() {
  const result = await getEmployeesAction();
  const employees = result.success && result.data ? result.data : [];

  return <LaborListModule employees={employees} />;
}
