/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/plants/[id]/edit/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for editing an existing plant (`/plants/[id]/edit`).
 *    - Extracted the dynamic `id` route parameter and retrieved the plant record via `getPlantByIdAction(id)`.
 *    - Rendered `<PlantForm mode="edit" initialData={plant} />` on dedicated full-screen layout.
 *    - Handled non-existent or archived record fallbacks gracefully.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.3 & 1.4: "Single Reusable Form", "Strict Dedicated Full-Screen Routes".
 *    - Eliminates modal overlays and sliding drawers for record modification.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js 16 App Router asynchronous `params` resolution.
 *    - Server Action `getPlantByIdAction`.
 *    - Feature module component `<PlantForm>`.
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Awaits `params.id`, retrieves entity from PostgreSQL, and seeds `<PlantForm>` with initial data.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import Link from 'next/link';
import { getPlantByIdAction } from '@/modules/plants/actions';
import { PlantForm } from '@/modules/plants/components';
import { Button } from '@/components/ui';
import { APP_ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

interface EditPlantPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlantPage({ params }: EditPlantPageProps) {
  const { id } = await params;
  const result = await getPlantByIdAction(id);

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
          Plant Record Not Found
        </h2>
        <p style={{ color: '#6B7280', maxWidth: '420px' }}>
          The requested plant cultivar does not exist or may have been archived from the nursery directory.
        </p>
        <Link href={APP_ROUTES.PLANTS} style={{ textDecoration: 'none' }}>
          <Button variant="primary">Return to Plant Directory</Button>
        </Link>
      </div>
    );
  }

  return <PlantForm mode="edit" initialData={result.data} />;
}
