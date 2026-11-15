/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/customers/components/CustomerTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<CustomerTableWrapper>`, configuring TanStack Table v8 columns for Customer CRM & Udhar Ledger.
 *    - Structured columns for Customer Name, Mobile Number with direct call trigger, Address,
 *      and high-contrast Outstanding Udhar credit indicator.
 *    - Highlighted active credit dues in high-contrast red and fully settled balances in soft green.
 *    - Integrated 44px mobile touch Edit buttons navigating to dedicated full-screen edit routes.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 03 Section 2.3: Responsive TanStack Data Table Wrapper.
 *    - Essential for fast counter search by customer mobile number or surname during retail checkout.
 *    - Eliminates modals by redirecting edit actions to `/customers/[id]/edit`.
 * 
 * 3. WHAT WAS USED:
 *    - `@tanstack/react-table` column definitions (`ColumnDef<Customer>`).
 *    - Next.js `Link` primitive.
 *    - Lucide React icons (`Phone`, `Edit3`, `CheckCircle2`, `AlertCircle`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Supplies customer data and column definitions to the `<DataTable>` swipe-enabled primitive.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Phone, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import { DataTable } from '@/components/datatable';
import { Customer } from '../types';

export interface CustomerTableWrapperProps {
  customers: Customer[];
  toolbarActions?: React.ReactNode;
}

export const CustomerTableWrapper: React.FC<CustomerTableWrapperProps> = ({
  customers,
  toolbarActions,
}) => {
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Customer Name',
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9375rem' }}>
            {row.original.name}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            ID: {row.original.id.slice(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Mobile Number',
      cell: ({ row }) => (
        <a
          href={`tel:${row.original.phone}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: 'monospace',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#1B4D3E',
            textDecoration: 'none',
          }}
          aria-label={`Call ${row.original.name}`}
        >
          <Phone size={14} />
          <span>{row.original.phone}</span>
        </a>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address / Locality',
      cell: ({ row }) => (
        <span style={{ fontSize: '0.8125rem', color: '#4B5563' }}>
          {row.original.address || 'Kolhapur (Unspecified)'}
        </span>
      ),
    },
    {
      accessorKey: 'totalUdharDue',
      header: 'Outstanding Udhar',
      cell: ({ row }) => {
        const due = row.original.totalUdharDue;
        const hasDue = due > 0;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {hasDue ? (
              <span
                style={{
                  fontWeight: 700,
                  color: '#E11D48',
                  backgroundColor: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.875rem',
                }}
              >
                <AlertCircle size={13} />
                <span>₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </span>
            ) : (
              <span
                style={{
                  fontWeight: 600,
                  color: '#16A34A',
                  backgroundColor: '#DCFCE7',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.8125rem',
                }}
              >
                <CheckCircle2 size={13} />
                <span>Settled (Nil)</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Link
          href={APP_ROUTES.CUSTOMERS_EDIT(row.original.id)}
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
          aria-label={`Edit ${row.original.name}`}
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
      data={customers}
      searchPlaceholder="Search by customer name, mobile number, or address..."
      emptyMessage="No customer records found in the directory."
      toolbarActions={toolbarActions}
    />
  );
};
