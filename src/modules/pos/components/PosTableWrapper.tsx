/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/components/PosTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<PosTableWrapper>`, configuring TanStack Table v8 column definitions for POS billing logs.
 *    - Added side-by-side "Invoice" (PDF download/view) and "WhatsApp" (direct Click-to-Chat) action buttons in the Actions column.
 *    - Integrated `generateInvoicePdf` for instant vector PDF invoice generation.
 *    - Integrated `openWhatsAppInvoice` to prefill the customer's phone and itemized invoice details on WhatsApp Web / mobile.
 *    - Maintained full receipt preview modal (`<PosCheckoutSuccessModal>`) via clickable bill numbers.
 *    - Sourced styling from modular SCSS (`PosTableWrapper.module.scss`) mapped to centralized design tokens.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: ADD WHATSAPP INVOICE SEND ACTION TO POS BILLING LIST & CHECKOUT".
 *    - Matches the Landscaping Contracts quotation table layout with paired PDF and WhatsApp action triggers.
 *    - Empowers cashiers to dispatch digital paperless e-Bills instantly to customer WhatsApp with 1 click.
 *    - Complies with Specification 01: "PWA Clean UI Standards" & Specification 03: "Component Specifications".
 * 
 * 3. WHAT WAS USED:
 *    - `@tanstack/react-table` column definitions (`ColumnDef<PosBillWithRelations>`).
 *    - Lucide React icons (`Receipt`, `User`, `Calendar`, `AlertCircle`, `CheckCircle2`, `Banknote`, `Smartphone`, `BookOpen`, `Download`, `Share2`).
 *    - POS utilities `generateInvoicePdf`, `openWhatsAppInvoice`.
 *    - Shared `<DataTable>` component with touch swipe banner.
 *    - SCSS Modules mapped to design tokens (`PosTableWrapper.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Clicking "Invoice" downloads the official vector PDF tax invoice instantly.
 *    - Clicking "WhatsApp" launches a WhatsApp Web / app link pre-filled with customer number and botanical item details.
 *    - Clicking the bill number opens the receipt preview modal with thermal print capabilities.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  Receipt,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Banknote,
  Smartphone,
  BookOpen,
  Download,
  Share2,
} from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { APP_ROUTES } from '@/lib/constants/routes';
import { PosBillWithRelations, PaymentMode } from '../types';
import { generateInvoicePdf, openWhatsAppInvoice } from '../utils';
import { PosCheckoutSuccessModal } from './PosCheckoutSuccessModal';
import styles from './PosTableWrapper.module.scss';

export interface PosTableWrapperProps {
  bills: PosBillWithRelations[];
  toolbarActions?: React.ReactNode;
}

const PAYMENT_MODE_STYLES: Record<
  PaymentMode,
  { label: string; bg: string; color: string; border: string; icon: React.ReactNode }
> = {
  CASH: {
    label: 'Cash',
    bg: '#ECFDF5',
    color: '#047857',
    border: '#A7F3D0',
    icon: <Banknote size={12} />,
  },
  UPI: {
    label: 'UPI / QR',
    bg: '#EFF6FF',
    color: '#1D4ED8',
    border: '#BFDBFE',
    icon: <Smartphone size={12} />,
  },
  CREDIT_UDHAR: {
    label: 'Udhar (Credit)',
    bg: '#FFFBEB',
    color: '#B45309',
    border: '#FDE68A',
    icon: <BookOpen size={12} />,
  },
};

export const PosTableWrapper: React.FC<PosTableWrapperProps> = ({
  bills,
  toolbarActions,
}) => {
  const router = useRouter();
  const [selectedBillForShare, setSelectedBillForShare] = useState<PosBillWithRelations | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleDownloadInvoice = (bill: PosBillWithRelations) => {
    try {
      generateInvoicePdf(bill);
      showToast(`✓ Official PDF invoice for ${bill.billNumber} downloaded successfully.`);
    } catch (err) {
      console.error('Invoice download error:', err);
      showToast(`⚠️ Unable to download invoice PDF for ${bill.billNumber}.`);
    }
  };

  const handleShareWhatsApp = (bill: PosBillWithRelations) => {
    try {
      openWhatsAppInvoice(bill);
      showToast(`✓ WhatsApp invoice link opened for ${bill.billNumber}.`);
    } catch (err) {
      console.error('WhatsApp link error:', err);
      showToast(`⚠️ Unable to open WhatsApp link for ${bill.billNumber}.`);
    }
  };

  const columns: ColumnDef<PosBillWithRelations>[] = [
    {
      accessorKey: 'billNumber',
      header: 'Bill Number',
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Receipt size={14} color="#1B4D3E" />
            <span
              className={styles.billNumberLink}
              onClick={() => setSelectedBillForShare(row.original)}
              title="Click to view full receipt preview and print"
            >
              {row.original.billNumber}
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#6B7280', paddingLeft: '1.25rem' }}>
            ID: {row.original.id.slice(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'customer.name',
      header: 'Customer / Buyer',
      cell: ({ row }) => {
        const customer = row.original.customer;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#374151' }}>
            <User size={14} color="#6B7280" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
              {customer?.name || 'Walk-in Retail Guest'}
            </span>
            {customer?.phone && (
              <span style={{ fontSize: '0.6875rem', color: '#6B7280' }}>
                ({customer.phone})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'paymentMode',
      header: 'Payment Mode',
      cell: ({ row }) => {
        const style = PAYMENT_MODE_STYLES[row.original.paymentMode] || {
          label: row.original.paymentMode,
          bg: '#F3F4F6',
          color: '#374151',
          border: '#E5E7EB',
          icon: null,
        };

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              backgroundColor: style.bg,
              color: style.color,
              border: `1px solid ${style.border}`,
            }}
          >
            {style.icon}
            {style.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }) => (
        <span style={{ fontWeight: 700, color: '#1B4D3E', fontSize: '0.875rem' }}>
          ₹{row.original.totalAmount.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'amountPaid',
      header: 'Amount Paid',
      cell: ({ row }) => (
        <span style={{ fontWeight: 500, color: '#047857', fontSize: '0.8125rem' }}>
          ₹{row.original.amountPaid.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'balanceDue',
      header: 'Balance Due',
      cell: ({ row }) => {
        const due = row.original.balanceDue;
        return due > 0 ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#DC2626',
              fontWeight: 700,
              fontSize: '0.8125rem',
              backgroundColor: '#FEF2F2',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              border: '1px solid #FECACA',
            }}
          >
            <AlertCircle size={12} />
            ₹{due.toFixed(2)}
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#059669',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={12} />
            Nil
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Billing Date',
      cell: ({ row }) => {
        const dateObj = new Date(row.original.createdAt);
        const formatted = isNaN(dateObj.getTime())
          ? '-'
          : dateObj.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#6B7280' }}>
            <Calendar size={13} />
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{formatted}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const bill = row.original;
        return (
          <div className={styles.actionBtnGroup}>
            {/* 1. Download / View PDF Invoice */}
            <button
              type="button"
              className={`${styles.tableActionBtn} ${styles.invoiceBtn}`}
              onClick={() => handleDownloadInvoice(bill)}
              title={`Download official PDF invoice for ${bill.billNumber}`}
              aria-label={`Download official PDF invoice for ${bill.billNumber}`}
            >
              <Download size={14} />
              <span>Invoice</span>
            </button>

            {/* 2. Direct Share via WhatsApp */}
            <button
              type="button"
              className={`${styles.tableActionBtn} ${styles.whatsAppBtn}`}
              onClick={() => handleShareWhatsApp(bill)}
              title={`Send formatted WhatsApp e-Bill to customer for ${bill.billNumber}`}
              aria-label={`Send formatted WhatsApp e-Bill to customer for ${bill.billNumber}`}
            >
              <Share2 size={14} />
              <span>WhatsApp</span>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={bills}
        searchPlaceholder="Search by bill number, customer name, or payment mode..."
        emptyMessage="No POS retail billing transactions found in counter records."
        toolbarActions={toolbarActions}
      />

      {toastMessage && (
        <div className={styles.toastNotice} role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      <PosCheckoutSuccessModal
        bill={selectedBillForShare}
        isOpen={Boolean(selectedBillForShare)}
        onClose={() => setSelectedBillForShare(null)}
        onNewBill={() => {
          setSelectedBillForShare(null);
          router.push(APP_ROUTES.POS_NEW);
        }}
        initialCustomerPhone={selectedBillForShare?.customer?.phone || ''}
      />
    </>
  );
};
