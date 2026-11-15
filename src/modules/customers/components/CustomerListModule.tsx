/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/customers/components/CustomerListModule.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built and refactored `<CustomerListModule>` with ultra-compact, low-profile spacing.
 *    - Integrated 4 ultra-compact `<MetricCard>` counters (18px values, 26px badges, 0.5rem grid gap).
 *    - Packed summary KPI bars and action buttons into a tight layout so data tables appear immediately on screen.
 *    - Maintained 44px touch targets on the primary '+ Add Customer' action button and table controls.
 *    - Wrapped data presentation inside `<CustomerTableWrapper>` (TanStack Table v8).
 * 
 * 2. WHY IT WAS DONE:
 *    - Satisfies the ultra-compact UI refactor directive for space-saving, dense layouts across all modules.
 *    - Eliminates vertical scrolling on desktop and mobile displays by keeping KPI metrics low-profile.
 * 
 * 3. WHAT WAS USED:
 *    - Shared UI primitives: `<MetricCard>` and `<Button>`.
 *    - Lucide React icons (`Users`, `IndianRupee`, `AlertCircle`, `CheckCircle2`, `UserPlus`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Calculates metrics dynamically using `useMemo` and renders a high-density 0.5rem KPI grid above the data table.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { MetricCard, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Customer, CustomerDirectoryMetrics } from '../types';
import { CustomerTableWrapper } from './CustomerTableWrapper';

export interface CustomerListModuleProps {
  customers: Customer[];
}

export const CustomerListModule: React.FC<CustomerListModuleProps> = ({ customers }) => {
  useSetPageHeader({
    title: 'Customer Directory & Udhar Ledger',
  });

  // Calculate live customer directory metrics
  const metrics: CustomerDirectoryMetrics = useMemo(() => {
    let activeUdharTotal = 0;
    let dueAccounts = 0;
    let settledAccounts = 0;

    for (const customer of customers) {
      if (customer.totalUdharDue > 0) {
        activeUdharTotal += customer.totalUdharDue;
        dueAccounts += 1;
      } else {
        settledAccounts += 1;
      }
    }

    return {
      totalCustomers: customers.length,
      totalActiveUdhar: activeUdharTotal,
      customersWithDue: dueAccounts,
      settledAccountsCount: settledAccounts,
    };
  }, [customers]);

  const addCustomerButton = (
    <Link href={APP_ROUTES.CUSTOMERS_NEW} style={{ textDecoration: 'none' }}>
      <Button variant="primary" leftIcon={<UserPlus size={15} />}>
        Add Customer
      </Button>
    </Link>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* Top Summary KPI Metrics Grid - Ultra-Compact & Low Profile */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: '0.5rem',
        }}
        aria-label="Customer Ledger Metrics Summary"
      >
        <MetricCard
          label="Total Registered Clients"
          value={metrics.totalCustomers}
          icon={<Users size={14} />}
          variant="cornflower"
          description="Active customer accounts"
        />

        <MetricCard
          label="Active Udhar"
          value={`₹${metrics.totalActiveUdhar.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
          })}`}
          icon={<IndianRupee size={14} />}
          variant={metrics.totalActiveUdhar > 0 ? 'rose' : 'success'}
          description="Total unpaid credit balances"
        />

        <MetricCard
          label="Clients with Due Balance"
          value={metrics.customersWithDue}
          icon={<AlertCircle size={14} />}
          variant={metrics.customersWithDue > 0 ? 'marigold' : 'default'}
          description="Accounts pending settlement"
        />

        <MetricCard
          label="Fully Settled Accounts"
          value={metrics.settledAccountsCount}
          icon={<CheckCircle2 size={14} />}
          variant="success"
          description="Zero outstanding credit"
        />
      </section>

      {/* Main TanStack Data Table with Search and Swipe Scroll */}
      <CustomerTableWrapper
        customers={customers}
        toolbarActions={addCustomerButton}
      />
    </div>
  );
};
