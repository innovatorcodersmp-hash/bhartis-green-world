/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/customers/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the server routing shell for the `/customers` route.
 *    - Fetched all active customer accounts and Udhar balances via `getCustomersAction()`.
 *    - Rendered the modular `<CustomerListModule>` client container.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: "Pages inside Next.js app/ are lightweight routing shells (under 50-80 lines)".
 *    - Executes database retrieval on the server to optimize initial page loading.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router server component.
 *    - Server Action `getCustomersAction`.
 *    - Feature module component `<CustomerListModule>`.
 * 
 * 4. HOW IT WORKS:
 *    - Server fetches customer accounts from PostgreSQL and hydrates the `<CustomerListModule>` client component.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import { getCustomersAction } from '@/modules/customers/actions';
import { CustomerListModule } from '@/modules/customers/components';

export const dynamic = 'force-dynamic';

export default async function CustomersDirectoryPage() {
  const result = await getCustomersAction();
  const customers = result.success && result.data ? result.data : [];

  return <CustomerListModule customers={customers} />;
}
