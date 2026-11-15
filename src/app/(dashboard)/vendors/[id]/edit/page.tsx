/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/vendors/[id]/edit/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for editing an existing vendor record (`/vendors/[id]/edit`).
 *    - Resolved dynamic route parameter `id` and fetched vendor profile via `getVendorByIdAction(id)`.
 *    - Rendered `<VendorForm mode="edit" initialData={vendor} />` on a dedicated full-screen layout.
 *    - Handled archived or missing supplier records gracefully.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.3 & 1.4: "Single Reusable Form", "Strict Dedicated Full-Screen Routes".
 *    - Eliminates modal overlays for supplier details and contact number corrections.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js 16 App Router asynchronous `params` resolution.
 *    - Server Action `getVendorByIdAction`.
 *    - Feature module component `<VendorForm>`.
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Awaits `params.id`, retrieves entity from database, and seeds `<VendorForm>` with initial data.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import Link from 'next/link';
import { getVendorByIdAction } from '@/modules/vendors/actions';
import { VendorForm } from '@/modules/vendors/components';
import { Button } from '@/components/ui';
import { APP_ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

interface EditVendorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVendorPage({
  params,
}: EditVendorPageProps) {
  const { id } = await params;
  const result = await getVendorByIdAction(id);

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
          Vendor Record Not Found
        </h2>
        <p style={{ color: '#6B7280', maxWidth: '420px' }}>
          The requested supplier profile does not exist or may have been archived from the directory.
        </p>
        <Link href={APP_ROUTES.VENDORS} style={{ textDecoration: 'none' }}>
          <Button variant="primary">Return to Vendor Directory</Button>
        </Link>
      </div>
    );
  }

  return <VendorForm mode="edit" initialData={result.data} />;
}
