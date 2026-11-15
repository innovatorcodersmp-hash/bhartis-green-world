/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/vendors/new/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the lightweight routing shell for the `/vendors/new` route.
 *    - Rendered the single reusable `<VendorForm>` in create mode (`mode="create"`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.4: "Strict Dedicated Full-Screen Routes (NO POPUPS / MODALS)".
 *    - Provides a dedicated URL endpoint for supplier registration with full browser history support.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router page.
 *    - Feature module component `<VendorForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - Mounts on `/vendors/new` and renders `<VendorForm mode="create" />` inside the root `<PageLayout>`.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { VendorForm } from '@/modules/vendors/components';

export default function NewVendorPage() {
  return <VendorForm mode="create" />;
}
