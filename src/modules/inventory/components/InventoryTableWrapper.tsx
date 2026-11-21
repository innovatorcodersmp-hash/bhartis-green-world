/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/inventory/components/InventoryTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<InventoryTableWrapper>`, configuring TanStack Table v8 column definitions for Sapling Batches and Inventory.
 *    - Structured columns for Batch Code, Plant Cultivar (with Marathi vernacular title), Supplying Vendor,
 *      Initial Consignment Qty, Current Live Units, Mortality Losses, Arrival Date, and 44px mobile touch Edit buttons.
 *    - Enhanced Batch Code column with dynamic badge indicator for multi-plant shared batches (`Shared (X varieties)`).
 *    - Implemented visual alert badges for batches displaying mortality or depleted stock levels.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills User Request: "Inventory Table Grouping / Display (InventoryTableWrapper.tsx)".
 *    - Allows nursery supervisors to immediately spot shared consignment lots and audit individual plant cultivars.
 * 
 * 3. WHAT WAS USED:
 *    - `@tanstack/react-table` column definitions (`ColumnDef<InventoryBatchWithRelations>`).
 *    - Next.js `Link` component.
 *    - Lucide React icons (`Sprout`, `Truck`, `AlertTriangle`, `Edit3`, `Calendar`, `Layers`).
 *    - Centralized route constants (`APP_ROUTES`).
 *    - Shared `<DataTable>` component with touch swipe helper banner.
 * 
 * 4. HOW IT WORKS:
 *    - Receives `batches` with joined `plant` and `vendor` records;
 *    - Pre-computes batch frequency map to identify multi-plant consignments;
 *    - Passes data to `<DataTable>` with search filtering across batch numbers, plant names, and vendors.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Sprout, Truck, AlertTriangle, Edit3, Calendar, Layers } from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import { DataTable } from '@/components/datatable';
import { InventoryBatchWithRelations } from '../types';

export interface InventoryTableWrapperProps {
  batches: InventoryBatchWithRelations[];
  toolbarActions?: React.ReactNode;
}

export const InventoryTableWrapper: React.FC<InventoryTableWrapperProps> = ({
  batches,
  toolbarActions,
}) => {
  // Pre-calculate count of items sharing each batch number
  const batchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of batches) {
      counts[b.batchNumber] = (counts[b.batchNumber] || 0) + 1;
    }
    return counts;
  }, [batches]);

  const columns: ColumnDef<InventoryBatchWithRelations>[] = [
    {
      accessorKey: 'batchNumber',
      header: 'Batch Number',
      cell: ({ row }) => {
        const count = batchCounts[row.original.batchNumber] || 1;
        const isShared = count > 1;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontWeight: 700, color: '#1B4D3E', fontSize: '0.9375rem', letterSpacing: '0.025em' }}>
              {row.original.batchNumber}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                ID: {row.original.id.slice(0, 8)}...
              </span>
              {isShared && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#065F46',
                    backgroundColor: '#ECFDF5',
                    padding: '0.05rem 0.35rem',
                    borderRadius: '4px',
                    border: '1px solid #A7F3D0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                  title="Multiple plant cultivars in this consignment batch"
                >
                  <Layers size={11} />
                  <span>Shared ({count})</span>
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'plant.name',
      header: 'Plant Cultivar',
      cell: ({ row }) => {
        const plant = row.original.plant;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sprout size={15} color="#1B4D3E" />
              <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.875rem' }}>
                {plant?.name || 'Unknown Plant'}
              </span>
            </div>
            {plant?.marathiName && (
              <span style={{ fontSize: '0.75rem', color: '#6B7280', paddingLeft: '1.25rem' }}>
                {plant.marathiName} ({plant.sku})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'vendor.name',
      header: 'Source / Vendor',
      cell: ({ row }) => {
        const vendor = row.original.vendor;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#374151' }}>
            <Truck size={15} color="#6B7280" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {vendor?.name || 'Internal Propagation / In-House'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'initialQty',
      header: 'Initial Qty',
      cell: ({ row }) => (
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4B5563' }}>
          {row.original.initialQty.toLocaleString('en-IN')} pots
        </span>
      ),
    },
    {
      accessorKey: 'currentQty',
      header: 'Current Stock',
      cell: ({ row }) => {
        const current = row.original.currentQty;
        const isDepleted = current === 0;
        const isLow = current > 0 && current < 15;

        // Step 3 Palette: Green (in stock), Marigold (low stock), Coral (out of stock)
        const bg = isDepleted
          ? 'rgba(251, 113, 133, 0.12)'
          : isLow
          ? 'rgba(245, 158, 11, 0.12)'
          : '#ECFDF5';
        const text = isDepleted
          ? '#E11D48'
          : isLow
          ? '#B45309'
          : '#047857';
        const border = isDepleted
          ? 'rgba(251, 113, 133, 0.35)'
          : isLow
          ? 'rgba(245, 158, 11, 0.35)'
          : '#A7F3D0';

        return (
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.8125rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: bg,
              color: text,
              border: `1px solid ${border}`,
            }}
          >
            {current.toLocaleString('en-IN')} pots
          </span>
        );
      },
    },
    {
      accessorKey: 'mortalityQty',
      header: 'Mortality',
      cell: ({ row }) => {
        const mortality = row.original.mortalityQty;
        const hasMortality = mortality > 0;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {hasMortality && <AlertTriangle size={14} color="#D97706" />}
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: hasMortality ? 600 : 400,
                color: hasMortality ? '#D97706' : '#6B7280',
              }}
            >
              {mortality.toLocaleString('en-IN')} pots
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'purchaseDate',
      header: 'Arrival Date',
      cell: ({ row }) => {
        const dateObj = new Date(row.original.purchaseDate);
        const formatted = isNaN(dateObj.getTime())
          ? '-'
          : dateObj.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6B7280' }}>
            <Calendar size={14} />
            <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>{formatted}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Link
          href={APP_ROUTES.INVENTORY_EDIT(row.original.id)}
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
          aria-label={`Edit Batch ${row.original.batchNumber}`}
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
      data={batches}
      searchPlaceholder="Search by batch number, plant name, or vendor..."
      emptyMessage="No sapling inventory batches found in nursery records."
      toolbarActions={toolbarActions}
    />
  );
};
