/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/labor/components/LaborListModule.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<LaborListModule>`, the client supervisor dashboard for Employee Directory & Credentials.
 *    - Integrated 4 ultra-compact `<MetricCard>` counters (18px values, 26px badges, 0.5rem grid gap):
 *      a) Total Employees (All registered workforce profiles).
 *      b) Active Staff (Workers actively on the nursery roster).
 *      c) POS Login Accounts (Staff provisioned with cashier billing credentials).
 *      d) Contact Phones (Staff with verified mobile phone numbers).
 *    - Provided a primary "+ Add Employee" button linking to `APP_ROUTES.LABOR_NEW`.
 *    - Embedded `<LaborTableWrapper>` (TanStack Table v8) with interactive filtering, sorting, and touch swipe.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Mobile PWA Layout Efficiency" and Specification 03: "Component Specifications".
 *    - Gives nursery leadership an immediate overview of staff accounts and POS access authorizations.
 * 
 * 3. WHAT WAS USED:
 *    - Shared UI primitives: `<MetricCard>` and `<Button>`.
 *    - Lucide React icons (`Users`, `UserCheck`, `Shield`, `Phone`, `UserPlus`).
 *    - Centralized route constants (`APP_ROUTES`).
 *    - React 19 hooks (`useMemo`).
 *    - Layout sync hook (`useSetPageHeader`).
 * 
 * 4. HOW IT WORKS:
 *    - Computes workforce metrics via `useMemo`, synchronizes headers, and passes data to the table wrapper.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Shield,
  Phone,
  UserPlus,
} from 'lucide-react';
import { MetricCard, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Employee, LaborDirectoryMetrics } from '../types';
import { LaborTableWrapper } from './LaborTableWrapper';

export interface LaborListModuleProps {
  employees: Employee[];
}

export const LaborListModule: React.FC<LaborListModuleProps> = ({
  employees,
}) => {
  useSetPageHeader({
    title: 'Employee Directory & Staff Credentials',
    subtitle: 'Manage staff accounts, POS login credentials, and user authorizations.',
  });

  // Calculate live labor KPI metrics
  const metrics: LaborDirectoryMetrics = useMemo(() => {
    let active = 0;
    let posCredentials = 0;
    let phones = 0;

    for (const emp of employees) {
      if (emp.status === 'ACTIVE') {
        active += 1;
      }
      if (emp.username) {
        posCredentials += 1;
      }
      if (emp.phone) {
        phones += 1;
      }
    }

    return {
      totalEmployees: employees.length,
      activeStaff: active,
      posCredentialsCount: posCredentials,
      phoneVerifiedCount: phones,
    };
  }, [employees]);

  const addEmployeeButton = (
    <Link href={APP_ROUTES.LABOR_NEW} style={{ textDecoration: 'none' }}>
      <Button variant="primary" leftIcon={<UserPlus size={15} />}>
        Add Employee
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
        aria-label="Employee Workforce Metrics Summary"
      >
        <MetricCard
          label="Total Employees"
          value={metrics.totalEmployees}
          icon={<Users size={14} />}
          variant="cornflower"
          description="Registered staff profiles"
        />

        <MetricCard
          label="Active Staff Roster"
          value={metrics.activeStaff}
          icon={<UserCheck size={14} />}
          variant="success"
          description="Active accounts"
        />

        <MetricCard
          label="POS Login Accounts"
          value={metrics.posCredentialsCount}
          icon={<Shield size={14} />}
          variant="lavender"
          description="Counter billing operators"
        />

        <MetricCard
          label="Contact Phones"
          value={metrics.phoneVerifiedCount}
          icon={<Phone size={14} />}
          variant="marigold"
          description="Primary contact numbers"
        />
      </section>

      {/* Main TanStack Data Table with Search, Filter & Swipe Scroll */}
      <LaborTableWrapper
        employees={employees}
        toolbarActions={addEmployeeButton}
      />
    </div>
  );
};
