/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/customers/[id]/edit/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for editing an existing customer record (`/customers/[id]/edit`).
 *    - Resolved dynamic route parameter `id` and fetched customer details via `getCustomerByIdAction(id)`.
 *    - Rendered `<CustomerForm mode="edit" initialData={customer} />` on a dedicated full-screen layout.
 *    - Handled archived or non-existent record fallbacks gracefully.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.3 & 1.4: "Single Reusable Form", "Strict Dedicated Full-Screen Routes".
 *    - Eliminates modal overlays and sliding drawers for customer updates and Udhar balance corrections.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js 16 App Router asynchronous `params` resolution.
 *    - Server Action `getCustomerByIdAction`.
 *    - Feature module component `<CustomerForm>`.
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Awaits `params.id`, queries database, and initializes `<CustomerForm>` with current values.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import Link from 'next/link';
import { getCustomerByIdAction } from '@/modules/customers/actions';
import { CustomerForm } from '@/modules/customers/components';
import { Button } from '@/components/ui';
import { APP_ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;
  const result = await getCustomerByIdAction(id);

  if (!result.success || !result.data) {
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
          Customer Record Not Found
        </h2>
        <p style={{ color: '#6B7280', maxWidth: '420px' }}>
          The requested customer profile does not exist or may have been archived from the ledger.
        </p>
        <Link href={APP_ROUTES.CUSTOMERS} style={{ textDecoration: 'none' }}>
          <Button variant="primary">Return to Customer Directory</Button>
        </Link>
      </div>
    );
  }

  return <CustomerForm mode="edit" initialData={result.data} />;
}
