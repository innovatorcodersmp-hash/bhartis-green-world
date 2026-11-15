/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/customers/new/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the lightweight routing shell for the `/customers/new` route.
 *    - Rendered the single reusable `<CustomerForm>` in create mode (`mode="create"`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.4: "Strict Dedicated Full-Screen Routes (NO POPUPS / MODALS)".
 *    - Provides a dedicated URL endpoint for customer registration with browser history support.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router page.
 *    - Feature module component `<CustomerForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - Mounts on `/customers/new` and renders `<CustomerForm mode="create" />` inside the root `<PageLayout>`.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { CustomerForm } from '@/modules/customers/components';

export default function NewCustomerPage() {
  return <CustomerForm mode="create" />;
}
