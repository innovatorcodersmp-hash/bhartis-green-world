/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/landscaping/components/SiteVisitTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Configured TanStack Table v8 columns for routine Landscaping Site Visits & Maintenance logs.
 *    - Integrated direct 1-click **Send WhatsApp Update** action trigger on each visit row.
 *    - Styled WhatsApp button matching `<PosTableWrapper>` with green pill styling and click-to-chat.
 *    - Integrated `<SiteVisitSuccessModal>` preview on view action.
 *    - Handled search filtering, responsive column displays, and toast feedback.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT SITE VISIT & MAINTENANCE WHATSAPP UPDATE".
 *    - Empowers supervisors and cashiers to tap WhatsApp anytime to dispatch pre-filled reports.
 * 
 * 3. WHAT WAS USED:
 *    - TanStack Table v8 (`@tanstack/react-table`).
 *    - Lucide React icons (`Calendar`, `MapPin`, `User`, `Share2`, `Eye`, `CheckCircle2`, `AlertTriangle`).
 *    - WhatsApp utilities (`openSiteVisitWhatsApp`, `formatDisplayDate`, `sanitizeWhatsAppPhone`).
 *    - Shared `<DataTable>` component.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Calendar,
  MapPin,
  User,
  Share2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { SiteVisitWithRelations } from '../types';
import {
  openSiteVisitWhatsApp,
  formatDisplayDate,
  sanitizeWhatsAppPhone,
} from '../utils';
import { SiteVisitSuccessModal } from './SiteVisitSuccessModal';
import styles from './SiteVisitTableWrapper.module.scss';

export interface SiteVisitTableWrapperProps {
  visits: SiteVisitWithRelations[];
  toolbarActions?: React.ReactNode;
}

export const SiteVisitTableWrapper: React.FC<SiteVisitTableWrapperProps> = ({
  visits,
  toolbarActions,
}) => {
  const [selectedVisitForModal, setSelectedVisitForModal] = useState<SiteVisitWithRelations | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleShareWhatsApp = (visit: SiteVisitWithRelations) => {
    try {
      openSiteVisitWhatsApp(visit);
      const sanitized = sanitizeWhatsAppPhone(visit.customerMobile);
      showToast(
        sanitized
          ? `✓ WhatsApp update opened for ${visit.customerName} (+${sanitized}).`
          : `✓ WhatsApp update opened for ${visit.customerName}.`
      );
    } catch (err) {
      console.error('WhatsApp link dispatch error:', err);
      showToast(`⚠️ Unable to launch WhatsApp for ${visit.customerName}.`);
    }
  };

  const columns: ColumnDef<SiteVisitWithRelations>[] = [
    {
      accessorKey: 'visitDate',
      header: 'Visit Date',
      cell: ({ row }) => {
        const dateStr = formatDisplayDate(row.original.visitDate);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={13} color="#1B4D3E" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1B4D3E' }}>
              {dateStr}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'siteName',
      header: 'Site / Project Name',
      cell: ({ row }) => {
        const visit = row.original;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={13} color="#059669" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>
                {visit.siteName}
              </span>
            </div>
            {visit.contract && (
              <span style={{ fontSize: '0.6875rem', color: '#6B7280', fontFamily: 'monospace' }}>
                Ref: {visit.contract.contractNo}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'customerName',
      header: 'Client / Contact',
      cell: ({ row }) => {
        const visit = row.original;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={13} color="#475569" />
              <span style={{ fontSize: '0.8125rem', color: '#1F2937' }}>{visit.customerName}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'monospace' }}>
              +91 {visit.customerMobile}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'areasChecked',
      header: 'Areas Checked',
      cell: ({ row }) => (
        <span style={{ fontSize: '0.75rem', color: '#374151' }}>
          {row.original.areasChecked}
        </span>
      ),
    },
    {
      accessorKey: 'workDone',
      header: 'Work Completed',
      cell: ({ row }) => (
        <span
          style={{
            fontSize: '0.75rem',
            color: '#1F2937',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={row.original.workDone}
        >
          {row.original.workDone}
        </span>
      ),
    },
    {
      accessorKey: 'siteStatus',
      header: 'Site Status',
      cell: ({ row }) => {
        const status = row.original.siteStatus;
        const notes = row.original.replacementNotes;
        const isHealthy = status === 'Healthy';
        const isMinor = status === 'Minor Replacements Needed';

        const badgeClass = isHealthy
          ? styles.badgeHealthy
          : isMinor
          ? styles.badgeMinor
          : styles.badgeAttention;

        const Icon = isHealthy ? CheckCircle2 : isMinor ? AlertTriangle : AlertCircle;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span className={`${styles.statusBadge} ${badgeClass}`}>
              <Icon size={11} />
              <span>{status}</span>
            </span>
            {notes && (
              <span style={{ fontSize: '0.6875rem', color: '#92400E' }} title={notes}>
                Note: {notes}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'nextVisitDate',
      header: 'Next Visit',
      cell: ({ row }) => {
        const nextDate = formatDisplayDate(row.original.nextVisitDate);
        return (
          <span style={{ fontSize: '0.75rem', color: nextDate ? '#065F46' : '#6B7280', fontWeight: nextDate ? 600 : 400 }}>
            {nextDate || 'As scheduled'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const visit = row.original;
        return (
          <div className={styles.actionBtnGroup}>
            {/* 1. Direct Share via WhatsApp */}
            <button
              type="button"
              className={`${styles.tableActionBtn} ${styles.whatsAppBtn}`}
              onClick={() => handleShareWhatsApp(visit)}
              title={`Send formatted WhatsApp maintenance report to ${visit.customerName}`}
              aria-label={`Send formatted WhatsApp maintenance report to ${visit.customerName}`}
            >
              <Share2 size={13} />
              <span>WhatsApp</span>
            </button>

            {/* 2. Preview / View Details Modal */}
            <button
              type="button"
              className={`${styles.tableActionBtn} ${styles.previewBtn}`}
              onClick={() => setSelectedVisitForModal(visit)}
              title="Preview message and visit details"
              aria-label="Preview message and visit details"
            >
              <Eye size={13} />
              <span>Preview</span>
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
        data={visits}
        searchPlaceholder="Search by site location, customer name, mobile, or status..."
        emptyMessage="No routine site visits logged yet. Click '+ Log Site Visit' to record maintenance."
        toolbarActions={toolbarActions}
      />

      {toastMessage && (
        <div className={styles.toastNotice} role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {selectedVisitForModal && (
        <SiteVisitSuccessModal
          visit={selectedVisitForModal}
          isOpen={Boolean(selectedVisitForModal)}
          onClose={() => setSelectedVisitForModal(null)}
        />
      )}
    </>
  );
};

