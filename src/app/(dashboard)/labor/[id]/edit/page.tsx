/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/labor/[id]/edit/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for editing an existing staff or worker profile (`/labor/[id]/edit`).
 *    - Extracted the dynamic `id` route parameter and retrieved employee data via `getEmployeeByIdAction(id)`.
 *    - Rendered the single reusable `<LaborWorkerForm mode="edit" initialData={employee} />` component.
 *    - Handled missing or archived employee records gracefully with informative fallback message and return navigation.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Single Reusable Form", "Strict Dedicated Full-Screen Routes", "Zero Popups/Modals".
 *    - Provides mobile-first editing ergonomics for nursery supervisors and administrators in Kolhapur.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js 16 App Router asynchronous `params` resolution.
 *    - Server Action `getEmployeeByIdAction`.
 *    - Feature module component `<LaborWorkerForm>`.
 *    - Shared UI primitive `<Button>`.
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Awaits `params.id`, retrieves employee entity from PostgreSQL via Prisma, and seeds `<LaborWorkerForm>` with initial data.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import Link from 'next/link';
import { getEmployeeByIdAction } from '@/modules/labor/actions';
import { LaborWorkerForm } from '@/modules/labor/components';
import { Button } from '@/components/ui';
import { APP_ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

interface EditLaborWorkerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLaborWorkerPage({ params }: EditLaborWorkerPageProps) {
  const { id } = await params;
  const result = await getEmployeeByIdAction(id);
  const employee = result.success && result.data ? result.data : null;

  if (!employee) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '4rem 1rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1B4D3E' }}>
          Employee Profile Not Found
        </h2>
        <p style={{ color: '#6B7280', maxWidth: '420px' }}>
          The requested employee record does not exist or may have been archived from the nursery directory.
        </p>
        <Link href={APP_ROUTES.LABOR} style={{ textDecoration: 'none' }}>
          <Button variant="primary">Return to Employee Directory</Button>
        </Link>
      </div>
    );
  }

  return <LaborWorkerForm mode="edit" initialData={employee} />;
}
