/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/vendors/components/VendorTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<VendorTableWrapper>`, configuring TanStack Table v8 column definitions for Supplier & Sourcing directory.
 *    - Structured columns for Vendor Business Name, Designated Representative, Direct Mobile Dialing Link,
 *      and Sourcing Category badges.
 *    - Integrated 44px mobile touch Edit buttons navigating to dedicated full-screen edit routes.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 03 Section 2.3: Responsive TanStack Data Table Wrapper.
 *    - Allows nursery procurement managers to instantly call sapling suppliers or fertilizer wholesalers directly from mobile.
 *    - Eliminates modal overlays by redirecting edit actions to `/vendors/[id]/edit`.
 * 
 * 3. WHAT WAS USED:
 *    - `@tanstack/react-table` column definitions (`ColumnDef<Vendor>`).
 *    - Next.js `Link` primitive.
 *    - Lucide React icons (`Phone`, `Edit3`, `Truck`, `UserCheck`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Supplies vendor data and formatted column definitions to the `<DataTable>` horizontal swipe container.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Phone, Edit3, UserCheck } from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import { DataTable } from '@/components/datatable';
import { Vendor } from '../types';

export interface VendorTableWrapperProps {
  vendors: Vendor[];
  toolbarActions?: React.ReactNode;
}

const CATEGORY_LABELS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  SEEDS_SAPLINGS: {
    label: 'Seeds & Saplings',
    bg: '#ECFDF5',
    color: '#047857',
    border: '#A7F3D0',
  },
  POTS_CONTAINERS: {
    label: 'Pots & Containers',
    bg: '#FFFBEB',
    color: '#B45309',
    border: '#FDE68A',
  },
  FERTILIZERS_SOIL: {
    label: 'Fertilizers & Soil',
    bg: '#FDF2F8',
    color: '#BE185D',
    border: '#FBCFE8',
  },
  IRRIGATION_DRIP: {
    label: 'Irrigation & Drip',
    bg: '#EFF6FF',
    color: '#1D4ED8',
    border: '#BFDBFE',
  },
  GARDEN_TOOLS_MACHINERY: {
    label: 'Tools & Machinery',
    bg: '#F3F4F6',
    color: '#374151',
    border: '#D1D5DB',
  },
};

export const VendorTableWrapper: React.FC<VendorTableWrapperProps> = ({
  vendors,
  toolbarActions,
}) => {
  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: 'name',
      header: 'Vendor / Business Name',
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
      accessorKey: 'contactPerson',
      header: 'Contact Person',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#374151' }}>
          <UserCheck size={15} color="#6B7280" />
          <span style={{ fontSize: '0.875rem' }}>
            {row.original.contactPerson || 'Proprietor / Sales Desk'}
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
      accessorKey: 'category',
      header: 'Procurement Category',
      cell: ({ row }) => {
        const cat =
          CATEGORY_LABELS[row.original.category] || {
            label: row.original.category,
            bg: '#F3F4F6',
            color: '#374151',
            border: '#D1D5DB',
          };

        return (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              backgroundColor: cat.bg,
              color: cat.color,
              border: `1px solid ${cat.border}`,
              display: 'inline-block',
            }}
          >
            {cat.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Link
          href={APP_ROUTES.VENDORS_EDIT(row.original.id)}
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
      data={vendors}
      searchPlaceholder="Search by vendor name, representative, or category..."
      emptyMessage="No vendor records found in the directory."
      toolbarActions={toolbarActions}
    />
  );
};
