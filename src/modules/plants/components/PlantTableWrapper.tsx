/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/plants/components/PlantTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<PlantTableWrapper>`, configuring TanStack Table v8 column definitions for Plant inventory.
 *    - Added a dedicated QR code action button (`QrCode` icon) in the Actions column next to Edit.
 *    - Integrated `<PlantQrModal>` to preview and print thermal/A4 weatherproof pot tags with vector QR codes.
 *    - Rendered SKU codes, bilingual names (English & Marathi), category badges, stock levels, and edit links.
 *    - Integrated low-stock threshold visual alerts (`< 10` pots highlighted with warning pills).
 *    - Built 44px mobile touch action buttons for mobile-first PWA responsiveness.
 * 
 * 2. WHY IT WAS DONE:
 *    - Satisfies Specification 03 Section 2.3: Responsive TanStack Data Table Wrapper.
 *    - Fulfills the requirement for printable plant QR code labels to attach to nursery saplings and pots.
 *    - Works in synergy with the POS Smartphone Camera Scanner for instant scan-to-bill checkout.
 * 
 * 3. WHAT WAS USED:
 *    - `@tanstack/react-table` column definitions (`ColumnDef<Plant>`).
 *    - Next.js `Link` component.
 *    - Lucide React icons (`Edit3`, `AlertTriangle`, `QrCode`).
 *    - Centralized route constants (`APP_ROUTES`).
 *    - Modal sub-component `<PlantQrModal />`.
 * 
 * 4. HOW IT WORKS:
 *    - Cashier or supervisor clicks the QR icon for any plant; state opens `<PlantQrModal>` with the plant's details,
 *      allowing instant one-click printing via `window.print()`.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3, AlertTriangle, QrCode } from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import { DataTable } from '@/components/datatable';
import { Plant, PlantCategory } from '../types';
import { PlantQrModal } from './PlantQrModal';

export interface PlantTableWrapperProps {
  plants: Plant[];
  toolbarActions?: React.ReactNode;
}

const CATEGORY_BADGE_STYLES: Record<
  PlantCategory,
  { bg: string; color: string; border: string; label: string }
> = {
  FLOWER: {
    bg: 'rgba(236, 72, 153, 0.12)',
    color: '#BE185D', // Hibiscus pink
    border: 'rgba(236, 72, 153, 0.35)',
    label: 'Flowering',
  },
  FRUIT: {
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#B45309', // Marigold orange
    border: 'rgba(245, 158, 11, 0.35)',
    label: 'Fruit Tree',
  },
  ORNAMENTAL: {
    bg: 'rgba(167, 139, 250, 0.12)',
    color: '#6D28D9', // Lavender purple
    border: 'rgba(167, 139, 250, 0.35)',
    label: 'Indoor / Ornamental',
  },
  MEDICINAL: {
    bg: 'rgba(56, 189, 248, 0.12)',
    color: '#0369A1', // Sky blue / Herbs
    border: 'rgba(56, 189, 248, 0.35)',
    label: 'Herbs & Medicinal',
  },
};

export const PlantTableWrapper: React.FC<PlantTableWrapperProps> = ({
  plants,
  toolbarActions,
}) => {
  // Active plant selected for QR printing
  const [selectedPlantForQr, setSelectedPlantForQr] = useState<Plant | null>(null);

  const columns: ColumnDef<Plant>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU / Code',
      cell: ({ row }) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#1B4D3E',
            backgroundColor: '#F3F4F6',
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            fontSize: '0.8125rem',
          }}
        >
          {row.original.sku}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Plant Cultivar',
      cell: ({ row }) => {
        const englishName = row.original.name;
        const marathiName = row.original.marathiName;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>
              {englishName}
            </span>
            {marathiName && (
              <span style={{ fontSize: '0.8125rem', color: '#047857' }}>
                {marathiName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original.category as PlantCategory;
        const style = CATEGORY_BADGE_STYLES[category] || {
          bg: '#F3F4F6',
          color: '#374151',
          border: '#E5E7EB',
          label: category,
        };

        return (
          <span
            style={{
              display: 'inline-block',
              backgroundColor: style.bg,
              color: style.color,
              border: `1px solid ${style.border}`,
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {style.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Unit Price',
      cell: ({ row }) => (
        <span style={{ fontWeight: 600, color: '#1B4D3E' }}>
          ₹{row.original.price.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'stockCount',
      header: 'Inventory Stock',
      cell: ({ row }) => {
        const stock = row.original.stockCount;
        const isDepleted = stock === 0;
        const isLowStock = stock > 0 && stock < 10;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                fontWeight: 600,
                color: isDepleted ? '#E11D48' : isLowStock ? '#D97706' : '#1F2937',
              }}
            >
              {stock} pots
            </span>
            {isLowStock && (
              <span
                title="Low Stock Alert (<10 available)"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#B45309',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '0.15rem 0.35rem',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <AlertTriangle size={13} />
              </span>
            )}
            {isDepleted && (
              <span
                title="Out of Stock"
                style={{
                  backgroundColor: 'rgba(251, 113, 133, 0.12)',
                  color: '#E11D48',
                  border: '1px solid rgba(251, 113, 133, 0.35)',
                  padding: '0.15rem 0.35rem',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                }}
              >
                Depleted
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'polyhouseNo',
      header: 'Location',
      cell: ({ row }) => (
        <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
          {row.original.polyhouseNo || 'Main Yard Bed'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setSelectedPlantForQr(row.original)}
            title="Print QR Tag"
            aria-label={`Print QR tag for ${row.original.name}`}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #D1D5DB',
              color: '#1F2937',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <QrCode size={16} />
          </button>

          <Link
            href={APP_ROUTES.PLANTS_EDIT(row.original.id)}
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
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={plants}
        searchPlaceholder="Search by SKU, plant name, or category..."
        emptyMessage="No plant records found in the directory."
        toolbarActions={toolbarActions}
      />

      {/* Printable QR Code Label Modal */}
      <PlantQrModal
        plant={selectedPlantForQr}
        isOpen={Boolean(selectedPlantForQr)}
        onClose={() => setSelectedPlantForQr(null)}
      />
    </>
  );
};
