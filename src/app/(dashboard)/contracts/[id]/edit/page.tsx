/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/contracts/[id]/edit/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for editing an existing landscaping contract (`/contracts/[id]/edit`).
 *    - Extracted the dynamic `id` route parameter and retrieved the contract record via `getContractByIdAction(id)`.
 *    - Concurrently fetched registered client profiles via `getCustomersAction()`.
 *    - Rendered `<ContractForm mode="edit" initialData={contract} customers={customers} />` on dedicated full-screen layout.
 *    - Handled non-existent or archived record fallbacks gracefully.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Single Reusable Form", "Strict Dedicated Full-Screen Routes", "Zero Popups/Modals".
 *    - Provides mobile-first editing ergonomics for landscaping supervisors on tablet and smartphone displays.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js 16 App Router asynchronous `params` resolution.
 *    - Server Actions `getContractByIdAction` and `getCustomersAction`.
 *    - Shared feature component `<ContractForm>`.
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Awaits `params.id`, retrieves entity and client accounts from PostgreSQL, and seeds `<ContractForm>` with initial data.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import Link from 'next/link';
import { getContractByIdAction } from '@/modules/contracts/actions';
import { getCustomersAction } from '@/modules/customers/actions';
import { ContractForm } from '@/modules/contracts/components';
import { Button } from '@/components/ui';
import { APP_ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

interface EditContractPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContractPage({ params }: EditContractPageProps) {
  const { id } = await params;

  const [contractResult, customersResult] = await Promise.all([
    getContractByIdAction(id),
    getCustomersAction(),
  ]);

  const contract = contractResult.success && contractResult.data ? contractResult.data : null;
  const customers = customersResult.success && customersResult.data ? customersResult.data : [];

  if (!contract) {
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
          Landscaping Contract Not Found
        </h2>
        <p style={{ color: '#6B7280', maxWidth: '420px' }}>
          The requested garden contract does not exist or may have been archived from the system.
        </p>
        <Link href={APP_ROUTES.CONTRACTS} style={{ textDecoration: 'none' }}>
          <Button variant="primary">Return to Contracts Directory</Button>
        </Link>
      </div>
    );
  }

  return <ContractForm mode="edit" initialData={contract} customers={customers} />;
}
