/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/labor/components/LaborTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<LaborTableWrapper>`, configuring TanStack Table v8 column definitions for Employee records.
 *    - Structured columns for Employee Name, POS Username, Contact Phone, Account Status, and Actions.
 *    - Removed operational roles and daily wage columns per management workflow update.
 *    - Enforced 44px minimum touch targets on navigation action buttons.
 *    - Wrapped table inside `<DataTable>` with horizontal swipe scroll support for mobile devices.
 * 
 * 2. WHY IT WAS DONE:
 *    - Satisfies Specification 03 Section 2.3: Responsive TanStack Data Table Wrapper.
 *    - Allows nursery administrators to manage workforce rosters and verify counter cashier logins
 *      in a unified, mobile-friendly interface.
 * 
 * 3. WHAT WAS USED:
 *    - `@tanstack/react-table` column definitions (`ColumnDef<Employee>`).
 *    - Next.js `Link` component.
 *    - Lucide React icons (`Edit3`, `Phone`).
 *    - Centralized route constants (`APP_ROUTES`).
 *    - Shared `<DataTable>` component.
 * 
 * 4. HOW IT WORKS:
 *    - Maps raw employee rows to formatted table columns with responsive status badges.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3, Phone } from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import { DataTable } from '@/components/datatable';
import { Employee } from '../types';

export interface LaborTableWrapperProps {
  employees: Employee[];
  toolbarActions?: React.ReactNode;
}

export const LaborTableWrapper: React.FC<LaborTableWrapperProps> = ({
  employees,
  toolbarActions,
}) => {
  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'name',
      header: 'Staff Full Name',
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <span style={{ fontWeight: 600, color: '#111827' }}>
            {row.original.name}
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#6B7280' }}>
            ID: {row.original.id.slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'username',
      header: 'POS Login Username',
      cell: ({ row }) => {
        const username = row.original.username;
        return username ? (
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 600,
              color: '#1B4D3E',
              backgroundColor: '#E8F2EE',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
            }}
          >
            @{username}
          </span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontStyle: 'italic' }}>
            No login provisioned
          </span>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Contact Phone',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#374151', fontSize: '0.8125rem' }}>
          <Phone size={12} color="#6B7280" />
          <span>{row.original.phone}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.status === 'ACTIVE';
        return (
          <span
            style={{
              display: 'inline-block',
              backgroundColor: isActive ? '#ECFDF5' : '#F3F4F6',
              color: isActive ? '#047857' : '#6B7280',
              border: `1px solid ${isActive ? '#A7F3D0' : '#E5E7EB'}`,
              padding: '0.15rem 0.45rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: 600,
            }}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Link
          href={APP_ROUTES.LABOR_EDIT(row.original.id)}
          style={{
            minHeight: '44px',
            minWidth: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            backgroundColor: '#E8F2EE',
            color: '#1B4D3E',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
          aria-label={`Edit staff profile ${row.original.name}`}
        >
          <Edit3 size={15} />
          <span>Edit</span>
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={employees}
      searchPlaceholder="Search by staff name, username, or phone..."
      emptyMessage="No employee records found in the directory."
      toolbarActions={toolbarActions}
    />
  );
};
