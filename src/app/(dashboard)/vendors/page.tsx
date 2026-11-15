/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/vendors/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for the `/vendors` route.
 *    - Fetched all active nursery suppliers via `getVendorsAction()`.
 *    - Rendered the modular `<VendorListModule>` client container.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: "Pages inside Next.js app/ are lightweight routing shells (under 50-80 lines)".
 *    - Executes database query on the server for instant page delivery.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Action `getVendorsAction`.
 *    - Feature module component `<VendorListModule>`.
 * 
 * 4. HOW IT WORKS:
 *    - Server retrieves vendors from PostgreSQL and passes data into `<VendorListModule>`.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getVendorsAction } from '@/modules/vendors/actions';
import { VendorListModule } from '@/modules/vendors/components';

export const dynamic = 'force-dynamic';

export default async function VendorsDirectoryPage() {
  const result = await getVendorsAction();
  const vendors = result.success && result.data ? result.data : [];

  return <VendorListModule vendors={vendors} />;
}
