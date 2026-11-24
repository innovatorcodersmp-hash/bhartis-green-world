/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/components/EstimateTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<EstimateTableWrapper>`, configuring TanStack Table v8 columns for Landscaping Quotations & Site Estimates.
 *    - Structured summary KPI metric cards: Total Estimates, Draft Quotes, Approved Pipeline, Converted Contracts, and Total Pipeline Value.
 *    - Implemented row-wise actions:
 *      * **"📄 Download Quote PDF"**: Generates executive vector A4 quotation PDF via `generateEstimatePdf`.
 *      * **"💬 Share via WhatsApp"**: Formats itemized estimate summary and launches WhatsApp Click-to-Chat with prefilled quotation.
 *      * **"🚀 Convert to Contract"**: Atomically bridges approved estimate into an active `GardenContract` via `convertEstimateToContractAction`.
 *    - Enforced 44px minimum touch targets and mobile-responsive horizontal scrolling on table views.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: CREATE APP ROUTER PAGE & ESTIMATE TABLE".
 *    - Streamlines the sales-to-execution pipeline for Kolhapur garden design, lawn sodding, and corporate landscaping projects.
 *    - Complies with Specification 01: "Mobile-First PWA Guidelines" & Specification 03: "DataTable Component Specifications".
 * 
 * 3. WHAT WAS USED:
 *    - `@tanstack/react-table` column definitions (`ColumnDef<LandscapingEstimateWithParsedItems>`).
 *    - Lucide React icons (`FileText`, `Plus`, `Download`, `Share2`, `CheckCircle2`, `Clock`, `ArrowRight`, `Sparkles`, `CheckCheck`).
 *    - Shared components (`<DataTable>`, `<MetricCard>`, `<Button>`).
 *    - Vector PDF generator `generateEstimatePdf`.
 *    - Server Action `convertEstimateToContractAction`.
 *    - Centralized route constants (`APP_ROUTES`).
 *    - SCSS Modules mapped to design tokens (`EstimateTableWrapper.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Renders KPI metric cards from calculated estimate dataset.
 *    - Binds row actions to client PDF generator, WhatsApp API, and transactional contract conversion.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  FileText,
  Plus,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCheck,
  AlertCircle,
  Loader2,
  Sprout,
} from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { MetricCard, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  LandscapingEstimateWithParsedItems,
  EstimateDirectoryMetrics,
} from '../types';
import { generateEstimatePdf } from '../utils';
import { convertEstimateToContractAction } from '../actions';
import styles from './EstimateTableWrapper.module.scss';

export interface EstimateTableWrapperProps {
  estimates: LandscapingEstimateWithParsedItems[];
}

export const EstimateTableWrapper: React.FC<EstimateTableWrapperProps> = ({
  estimates,
}) => {
  const router = useRouter();

  useSetPageHeader({
    title: 'Site Estimates & Quotations',
    subtitle: 'Commercial Landscaping & Garden Design Proposals • Kolhapur',
  });
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [estimateToConvert, setEstimateToConvert] =
    useState<LandscapingEstimateWithParsedItems | null>(null);

  // Compute KPI Metrics
  const metrics: EstimateDirectoryMetrics = useMemo(() => {
    let draftCount = 0;
    let sentApprovedCount = 0;
    let convertedCount = 0;
    let totalPipelineValue = 0;

    estimates.forEach((est) => {
      totalPipelineValue += est.grandTotal;
      if (est.status === 'DRAFT') draftCount++;
      else if (est.status === 'SENT' || est.status === 'APPROVED') sentApprovedCount++;
      else if (est.status === 'CONVERTED') convertedCount++;
    });

    return {
      totalEstimates: estimates.length,
      draftCount,
      sentApprovedCount,
      convertedCount,
      totalPipelineValue,
    };
  }, [estimates]);

  // Action: Download Vector PDF
  const handleDownloadPdf = (estimate: LandscapingEstimateWithParsedItems) => {
    generateEstimatePdf(estimate, true);
    setToastMessage(`✓ Quotation PDF ${estimate.estimateNo} downloaded successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Action: Share via WhatsApp Click-to-Chat
  const handleShareWhatsApp = (estimate: LandscapingEstimateWithParsedItems) => {
    const formattedPhone = estimate.clientPhone.replace(/\D/g, '').slice(-10);
    const estimateDate = new Date(estimate.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const itemsSummary = estimate.lineItems
      .slice(0, 5)
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.description}* - ${it.qty} @ ₹${it.unitRate.toFixed(2)} = ₹${it.total.toFixed(2)}`
      )
      .join('\n');

    const moreItemsNote =
      estimate.lineItems.length > 5
        ? `\n...and ${estimate.lineItems.length - 5} more line items.`
        : '';

    const messageLines = [
      '🌿 *BHARTI\'S GREEN WORLD • SITE QUOTATION* 🌿',
      '📍 Shiroli / Kolhapur, Maharashtra',
      '📞 Phone: +91 98220 12345',
      '--------------------------------',
      `*Estimate No:* ${estimate.estimateNo}`,
      `*Date:* ${estimateDate}`,
      `*Client:* ${estimate.clientName}`,
      `*Site:* ${estimate.siteLocation} (${estimate.plotArea})`,
      estimate.scopeOfWork ? `*Scope:* ${estimate.scopeOfWork}` : '',
      '--------------------------------',
      '🌱 *PROPOSED MATERIALS & PLANTINGS:*',
      itemsSummary,
      moreItemsNote,
      '--------------------------------',
      `🌾 *Material Subtotal:* ₹${estimate.materialTotal.toFixed(2)}`,
      `🚜 *Site Labor & Prep:* ₹${estimate.laborCharges.toFixed(2)}`,
      `💰 *Grand Total Estimate:* ₹${estimate.grandTotal.toFixed(2)}`,
      '--------------------------------',
      '✅ *Estimate Validity:* 30 Calendar Days.',
      '🙏 Thank you for considering Bharti\'s Green World for your landscaping project!',
      '🌸 Please let us know if you approve this quotation so we can mobilize the site team.',
    ]
      .filter(Boolean)
      .join('\n');

    const whatsappUrl = `https://wa.me/91${formattedPhone}?text=${encodeURIComponent(
      messageLines
    )}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Action: Confirm and Convert Estimate to Active Contract
  const handleConfirmConvert = () => {
    if (!estimateToConvert) return;

    setConvertingId(estimateToConvert.id);
    startTransition(async () => {
      const result = await convertEstimateToContractAction(estimateToConvert.id);
      setConvertingId(null);
      setEstimateToConvert(null);

      if (result.success && result.data) {
        setToastMessage(
          `🚀 Success! Estimate ${result.data.estimate.estimateNo} was converted to Contract #${result.data.contract.contractNo}.`
        );
        router.refresh();
      } else {
        alert(result.error || 'Failed to convert estimate to contract.');
      }
    });
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<LandscapingEstimateWithParsedItems>[]>(
    () => [
      {
        accessorKey: 'estimateNo',
        header: 'Estimate No',
        cell: ({ row }) => (
          <span className={styles.estimateNoCell}>{row.original.estimateNo}</span>
        ),
      },
      {
        accessorKey: 'clientName',
        header: 'Client Details',
        cell: ({ row }) => (
          <div>
            <div className={styles.clientNameText}>{row.original.clientName}</div>
            <div className={styles.clientPhoneText}>+91 {row.original.clientPhone}</div>
          </div>
        ),
      },
      {
        accessorKey: 'siteLocation',
        header: 'Site & Area',
        cell: ({ row }) => (
          <div>
            <div className={styles.siteLocationText}>{row.original.siteLocation}</div>
            <span className={styles.plotAreaBadge}>{row.original.plotArea}</span>
          </div>
        ),
      },
      {
        accessorKey: 'materialTotal',
        header: 'Materials (₹)',
        cell: ({ row }) => (
          <span>₹{row.original.materialTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        ),
      },
      {
        accessorKey: 'laborCharges',
        header: 'Labor (₹)',
        cell: ({ row }) => (
          <span>₹{row.original.laborCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        ),
      },
      {
        accessorKey: 'grandTotal',
        header: 'Grand Total (₹)',
        cell: ({ row }) => (
          <span className={styles.grandTotalText}>
            ₹{row.original.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const statusClass =
            status === 'DRAFT'
              ? styles.statusDraft
              : status === 'SENT'
              ? styles.statusSent
              : status === 'APPROVED'
              ? styles.statusApproved
              : styles.statusConverted;

          return (
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {status === 'CONVERTED' ? (
                <>
                  <CheckCheck size={12} />
                  <span>CONVERTED</span>
                </>
              ) : (
                status
              )}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Quotation Actions',
        cell: ({ row }) => {
          const estimate = row.original;
          const isConverted = estimate.status === 'CONVERTED';

          return (
            <div className={styles.actionBtnGroup}>
              {/* 1. Download PDF */}
              <button
                type="button"
                className={`${styles.tableActionBtn} ${styles.pdfBtn}`}
                onClick={() => handleDownloadPdf(estimate)}
                title="Download official branded PDF quotation"
              >
                <Download size={14} />
                <span>PDF Quote</span>
              </button>

              {/* 2. Share via WhatsApp */}
              <button
                type="button"
                className={`${styles.tableActionBtn} ${styles.whatsAppBtn}`}
                onClick={() => handleShareWhatsApp(estimate)}
                title="Share formatted quotation with client on WhatsApp"
              >
                <Share2 size={14} />
                <span>WhatsApp</span>
              </button>

              {/* 3. Convert to Contract */}
              {!isConverted ? (
                <button
                  type="button"
                  className={`${styles.tableActionBtn} ${styles.convertBtn}`}
                  onClick={() => setEstimateToConvert(estimate)}
                  disabled={convertingId === estimate.id}
                  title="Convert approved estimate to an active landscaping contract"
                >
                  {convertingId === estimate.id ? (
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>Convert to Contract</span>
                </button>
              ) : (
                <span className={styles.convertedBadge}>
                  <CheckCheck size={13} />
                  <span>Contract Active</span>
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [convertingId]
  );

  return (
    <div className={styles.moduleWrapper}>
      {/* Micro-toast Feedback Notice */}
      {toastMessage && (
        <div className={styles.toastNotice} role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Summary KPI Metric Cards */}
      <section className={styles.metricsGrid}>
        <MetricCard
          label="Total Site Estimates"
          value={metrics.totalEstimates}
          trend={{ direction: 'up', text: 'All Time' }}
          description="Total quotations drafted"
          icon={<FileText size={16} />}
          variant="cornflower"
        />

        <MetricCard
          label="Draft Proposals"
          value={metrics.draftCount}
          variant="marigold"
          description="Awaiting client dispatch"
          icon={<Clock size={16} />}
        />

        <MetricCard
          label="Approved / Active Quotes"
          value={metrics.sentApprovedCount}
          variant="success"
          trend={{ direction: 'up', text: 'Active' }}
          description="Client review pipeline"
          icon={<CheckCircle2 size={16} />}
        />

        <MetricCard
          label="Total Estimate Pipeline"
          value={`₹${metrics.totalPipelineValue.toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
          variant="lavender"
          description={`${metrics.convertedCount} Converted to contracts`}
          icon={<Sparkles size={16} />}
        />
      </section>

      {/* 2. TanStack Data Table of All Estimates */}
      <DataTable
        columns={columns}
        data={estimates}
        searchPlaceholder="Search estimates by client or site..."
        toolbarActions={
          <div className={styles.toolbarActions}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => router.push(APP_ROUTES.CONTRACTS_SITE_VISITS)}
              leftIcon={<Sprout size={16} />}
            >
              Site Visits
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => router.push(APP_ROUTES.CONTRACTS)}
              leftIcon={<ArrowRight size={16} />}
            >
              View Active Contracts
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => router.push(APP_ROUTES.CONTRACTS_ESTIMATES_NEW)}
              leftIcon={<Plus size={16} />}
            >
              + Create New Estimate
            </Button>
          </div>
        }
      />

      {/* 3. Conversion Confirmation Dialog */}
      {estimateToConvert && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEstimateToConvert(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.confirmDialog}>
            <h3 className={styles.dialogTitle}>
              Convert Estimate to Active Contract?
            </h3>
            <p className={styles.dialogBody}>
              You are about to convert quotation{' '}
              <strong>{estimateToConvert.estimateNo}</strong> for{' '}
              <strong>{estimateToConvert.clientName}</strong> (₹
              {estimateToConvert.grandTotal.toLocaleString('en-IN')}) into a formal{' '}
              <strong>Garden Contract</strong>.
              <br />
              <br />
              This will automatically register the client into the customer directory (if not present), create an active contract with stage <em>SITE_PREP</em>, and mark this estimate as <em>CONVERTED</em>.
            </p>

            <div className={styles.dialogActions}>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setEstimateToConvert(null)}
                disabled={isPending}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirmConvert}
                isLoading={isPending}
                leftIcon={<Sparkles size={16} />}
              >
                Yes, Create Contract
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
