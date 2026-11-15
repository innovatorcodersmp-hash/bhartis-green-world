/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/components/ContractTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<ContractTableWrapper>`, configuring TanStack Table v8 column definitions for Landscaping Contracts.
 *    - Structured columns for:
 *      * Contract ID (Monospace badge)
 *      * Client Profile (Name & Phone)
 *      * Project Classification (Lawn, Orchard, Residential, Drip Irrigation badges)
 *      * Site Location & Area Dimensions
 *      * Completion Progress Percentage (Visual progress bar)
 *      * Execution Milestone Stage (Color-coded indicator)
 *      * Financial Valuation (Quotation vs. Balance Due)
 *      * Row Actions:
 *        a) "💳 Record Payment": Opens `<ContractPaymentModal>` to log stage payments or advances.
 *        b) "📄 Stage Invoice": Instant one-click vector PDF generation and download via `generateContractInvoicePdf`.
 *        c) "✏️ Edit": Direct navigation to `APP_ROUTES.CONTRACTS_EDIT`.
 *    - Enforced 44px minimum touch targets on all interactive action buttons.
 *    - Re-exported `<GardenContractTableWrapper>` alias for consistent naming across views.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT CONTRACT STAGE INVOICING AND ADVANCE PAYMENT LEDGER IN MODULE 6".
 *    - Satisfies Specification 03 Section 2.3: Responsive TanStack Data Table Wrapper with horizontal swipe container.
 *    - Empowers nursery landscapers and accounting personnel to collect stage payments and dispatch invoices seamlessly.
 * 
 * 3. WHAT WAS USED:
 *    - `@tanstack/react-table` column definitions (`ColumnDef<GardenContractWithRelations>`).
 *    - Next.js `Link` component.
 *    - Lucide React icons (`Edit3`, `MapPin`, `CreditCard`, `FileText`, `CheckCircle2`, `Loader2`).
 *    - Centralized route constants (`APP_ROUTES`).
 *    - Shared `<DataTable>` component.
 *    - `<ContractPaymentModal>` dialog.
 *    - Vector PDF invoice generator `generateContractInvoicePdf`.
 * 
 * 4. HOW IT WORKS:
 *    - Renders contract data inside `<DataTable>`, handles state for row-level stage payment logging,
 *      and triggers vector PDF generation directly in the browser.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3, MapPin, CreditCard, FileText, Loader2 } from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import { DataTable } from '@/components/datatable';
import {
  GardenContractWithRelations,
  ProjectType,
  ContractStage,
} from '../types';
import { ContractPaymentModal } from './ContractPaymentModal';
import { generateContractInvoicePdf } from '../utils';

export interface ContractTableWrapperProps {
  contracts: GardenContractWithRelations[];
  toolbarActions?: React.ReactNode;
}

const PROJECT_TYPE_STYLES: Record<
  ProjectType,
  { bg: string; color: string; border: string; label: string }
> = {
  LAWN: {
    bg: '#ECFDF5',
    color: '#047857',
    border: '#A7F3D0',
    label: 'Lawn & Turf',
  },
  ORCHARD: {
    bg: '#FFFBEB',
    color: '#B45309',
    border: '#FDE68A',
    label: 'Fruit Orchard',
  },
  RESIDENTIAL: {
    bg: '#EFF6FF',
    color: '#1D4ED8',
    border: '#BFDBFE',
    label: 'Residential',
  },
  DRIP_IRRIGATION: {
    bg: '#F5F3FF',
    color: '#6D28D9',
    border: '#DDD6FE',
    label: 'Drip Irrigation',
  },
};

const STAGE_STYLES: Record<
  ContractStage,
  { bg: string; color: string; border: string; label: string }
> = {
  SITE_PREP: {
    bg: '#F3F4F6',
    color: '#374151',
    border: '#E5E7EB',
    label: '1. Site Prep',
  },
  PLANTING: {
    bg: '#ECFDF5',
    color: '#047857',
    border: '#A7F3D0',
    label: '2. Planting',
  },
  IRRIGATION_SETUP: {
    bg: '#EFF6FF',
    color: '#1D4ED8',
    border: '#BFDBFE',
    label: '3. Irrigation',
  },
  MAINTENANCE_HANDOVER: {
    bg: '#FEF3C7',
    color: '#92400E',
    border: '#FCD34D',
    label: '4. Handover',
  },
};

export const ContractTableWrapper: React.FC<ContractTableWrapperProps> = ({
  contracts,
  toolbarActions,
}) => {
  // Modal & PDF state
  const [paymentContract, setPaymentContract] = useState<GardenContractWithRelations | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [downloadingContractId, setDownloadingContractId] = useState<string | null>(null);

  const handleOpenPaymentModal = useCallback((contract: GardenContractWithRelations) => {
    setPaymentContract(contract);
    setIsPaymentModalOpen(true);
  }, []);

  const handleClosePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setPaymentContract(null);
  }, []);

  const handleDownloadStageInvoice = useCallback(
    (contract: GardenContractWithRelations) => {
      setDownloadingContractId(contract.id);
      try {
        generateContractInvoicePdf(
          contract,
          {
            stageName: contract.currentStage,
            invoiceAmount: contract.totalEstimate,
            invoiceDate: new Date().toISOString(),
            receiptNo: `INV-${contract.contractNo}-${contract.currentStage}`,
            totalPaid: contract.advanceReceived,
            balanceDue: contract.balanceAmount,
            notes: contract.supervisorNotes,
          },
          true
        );
      } catch (err) {
        console.error('Failed to generate stage invoice PDF:', err);
      } finally {
        setTimeout(() => {
          setDownloadingContractId(null);
        }, 600);
      }
    },
    []
  );

  const columns: ColumnDef<GardenContractWithRelations>[] = [
    {
      accessorKey: 'contractNo',
      header: 'Contract ID',
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
          {row.original.contractNo}
        </span>
      ),
    },
    {
      id: 'customer',
      header: 'Client Details',
      cell: ({ row }) => {
        const client = row.original.customer;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>
              {client?.name || 'Unassigned'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              {client?.phone || 'No phone'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'projectType',
      header: 'Project Type',
      cell: ({ row }) => {
        const type = row.original.projectType as ProjectType;
        const style = PROJECT_TYPE_STYLES[type] || {
          bg: '#F3F4F6',
          color: '#374151',
          border: '#E5E7EB',
          label: type,
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
      id: 'siteDetails',
      header: 'Site Location & Area',
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', maxWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#374151', fontSize: '0.8125rem' }}>
            <MapPin size={12} color="#6B7280" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.original.siteAddress}
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#6B7280', fontWeight: 500 }}>
            Plot: {row.original.plotSize}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'progressPercent',
      header: 'Progress',
      cell: ({ row }) => {
        const pct = row.original.progressPercent;
        const barColor = pct >= 80 ? '#16A34A' : pct >= 40 ? '#2563EB' : '#D97706';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '95px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontWeight: 600, color: '#374151' }}>
              <span>{pct}% Done</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: barColor,
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'currentStage',
      header: 'Stage',
      cell: ({ row }) => {
        const stage = row.original.currentStage as ContractStage;
        const style = STAGE_STYLES[stage] || {
          bg: '#F3F4F6',
          color: '#374151',
          border: '#E5E7EB',
          label: stage,
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
              fontSize: '0.6875rem',
              fontWeight: 600,
            }}
          >
            {style.label}
          </span>
        );
      },
    },
    {
      id: 'financials',
      header: 'Estimate / Due',
      cell: ({ row }) => {
        const estimate = row.original.totalEstimate;
        const balance = row.original.balanceAmount;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontWeight: 600, color: '#1B4D3E', fontSize: '0.8125rem' }}>
              ₹{estimate.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: balance > 0 ? '#DC2626' : '#16A34A',
              }}
            >
              {balance > 0
                ? `Due: ₹${balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                : 'Settled'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const contract = row.original;
        const isDownloading = downloadingContractId === contract.id;

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            {/* Record Payment Action */}
            <button
              type="button"
              onClick={() => handleOpenPaymentModal(contract)}
              style={{
                minHeight: '44px',
                minWidth: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                backgroundColor: '#ECFDF5',
                color: '#047857',
                border: '1px solid #A7F3D0',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              aria-label={`Record payment for contract ${contract.contractNo}`}
              title="Record stage payment or advance"
            >
              <CreditCard size={14} />
              <span>Payment</span>
            </button>

            {/* Stage Invoice Action */}
            <button
              type="button"
              onClick={() => handleDownloadStageInvoice(contract)}
              disabled={isDownloading}
              style={{
                minHeight: '44px',
                minWidth: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: isDownloading ? 'wait' : 'pointer',
                transition: 'background-color 0.15s',
              }}
              aria-label={`Download milestone stage invoice for ${contract.contractNo}`}
              title="Download Stage Tax Invoice PDF"
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              <span>Invoice</span>
            </button>

            {/* Edit Contract Action */}
            <Link
              href={APP_ROUTES.CONTRACTS_EDIT(contract.id)}
              style={{
                minHeight: '44px',
                minWidth: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                backgroundColor: '#F3F4F6',
                color: '#374151',
                border: '1px solid #E5E7EB',
                fontSize: '0.75rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
              aria-label={`Edit contract ${contract.contractNo}`}
              title="Edit contract details"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={contracts}
        searchPlaceholder="Search by contract ID, client name, or site location..."
        emptyMessage="No landscaping contracts found in the directory."
        toolbarActions={toolbarActions}
      />

      {/* Interactive Payment Ledger Modal */}
      <ContractPaymentModal
        contract={paymentContract}
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
      />
    </>
  );
};

export { ContractTableWrapper as GardenContractTableWrapper };
