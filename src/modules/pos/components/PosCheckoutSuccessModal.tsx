/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/components/PosCheckoutSuccessModal.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Compacted the executive post-checkout confirmation & receipt sharing dialog (`<PosCheckoutSuccessModal>`).
 *    - Added direct "💬 WhatsApp" invoice send action alongside "📎 Share PDF" and "📥 Invoice PDF" download buttons.
 *    - Integrated `openWhatsAppInvoice` to prefill customer phone and itemized botanical billing details on WhatsApp.
 *    - Removed the signature block ("Customer / Receiver's Signature", "Authorized Signatory") and bottom disclaimers
 *      from the receipt preview sheet, matching the compact, clean vector PDF layout.
 *    - Receipt preview and printed vouchers now terminate cleanly right below the Financial Settlement Summary box.
 *    - Maintained official nursery logo badge (`/images/logo.png`) with resilient fallback icon.
 *    - Unified vector PDF generator for WhatsApp mobile sharing (`navigator.share`) and direct file download (`doc.save`).
 *    - Preserved internal auto-bound customer phone state and 1-click thermal/browser print support.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REMOVE SIGNATURES AND FOOTER TO COMPACT THE PDF INVOICE LAYOUT".
 *    - Eliminates redundant signature rows and lengthy legal text from standard botanical cash/UPI receipts.
 *    - Ensures exact visual synchronization between on-screen preview, paper prints, and shared PDF invoices.
 *    - Complies with Specification 01: "PWA Clean UI Standards" & Specification 03: "Component Specifications".
 * 
 * 3. WHAT WAS USED:
 *    - React 19 client hooks (`useState`, `useEffect`, `useCallback`, `useRef`).
 *    - Shared UI primitive `<Button />`.
 *    - Lucide React icons (`Printer`, `Download`, `X`, `CheckCircle2`, `Leaf`, `RotateCcw`, `Receipt`, `ArrowRight`, `Paperclip`, `Loader2`, `Copy`).
 *    - Vector PDF utility `generateInvoicePdf` (`jspdf`).
 *    - Clipboard API (`navigator.clipboard.writeText`).
 *    - SCSS Modules mapped to design tokens (`PosCheckoutSuccessModal.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Automatically receives bill record and renders a compact invoice preview ending at the grand total summary.
 *    - Supports sharing via WhatsApp (Web Share API with auto-copied mobile number) and download of compact vector PDF.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Paperclip,
  Loader2,
  Copy,
  Leaf,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { PosBillWithRelations } from '../types';
import { generateInvoicePdf, openWhatsAppInvoice, sanitizeWhatsAppPhone } from '../utils';
import styles from './PosCheckoutSuccessModal.module.scss';

export interface PosCheckoutSuccessModalProps {
  bill: PosBillWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onNewBill: () => void;
  initialCustomerPhone?: string;
}

export const PosCheckoutSuccessModal: React.FC<PosCheckoutSuccessModalProps> = ({
  bill,
  isOpen,
  onClose,
  onNewBill,
  initialCustomerPhone,
}) => {
  const [customerPhone, setCustomerPhone] = useState(
    initialCustomerPhone || bill?.customer?.phone || ''
  );
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [shareStatusNotice, setShareStatusNotice] = useState<string | null>(null);
  const [clipboardToastNotice, setClipboardToastNotice] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  // Ref to the rendered receipt preview for html2canvas capture
  const receiptRef = useRef<HTMLDivElement>(null);

  // Initialize or auto-bind phone number when bill changes or initialCustomerPhone arrives
  useEffect(() => {
    if (bill) {
      const resolvedPhone = bill.customer?.phone || initialCustomerPhone || '';
      setCustomerPhone(resolvedPhone);
      setPhoneError(null);
      setShareStatusNotice(null);
      setClipboardToastNotice(null);
    }
  }, [bill, initialCustomerPhone]);

  // Handle escape key to dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !bill) {
    return null;
  }

  // ==========================================================================
  // UNIFIED VECTOR PDF SHARING VIA WEB SHARE API & AUTO PHONE CLIPBOARD
  // ==========================================================================
  const handleSharePdfViaWhatsApp = async () => {
    if (!bill) return;

    setPhoneError(null);
    setShareStatusNotice(null);

    // 1. Validate customer mobile number
    const digitsOnly = customerPhone.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 10) {
      setPhoneError('No valid 10-digit mobile number linked to this bill. Please enter contact in customer directory or cart.');
      return;
    }

    // 2. Format +91XXXXXXXXXX and copy to clipboard for rapid WhatsApp recipient search
    const formattedClipPhone = `+91${digitsOnly.slice(-10)}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formattedClipPhone);
        setClipboardToastNotice(
          `Phone number ${formattedClipPhone} copied! Paste directly in WhatsApp recipient search.`
        );
      }
    } catch (clipErr) {
      console.warn('Clipboard write failed:', clipErr);
    }

    setIsSharingPdf(true);

    try {
      // 3. Generate unified executive vector PDF instance matching download output
      const doc = generateInvoicePdf(bill, false);
      const filename = `Bharti_Nursery_Invoice_${bill.billNumber}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      // 4. Trigger Web Share API if supported
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [pdfFile] });

      if (canShareFiles && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Invoice ${bill.billNumber}`,
            text: "Bharti's Green World Invoice",
          });
          setShareStatusNotice('✓ Official PDF invoice shared successfully via system share sheet.');
        } catch (shareErr: unknown) {
          if (
            shareErr instanceof Error &&
            (shareErr.name === 'AbortError' || shareErr.message.includes('abort'))
          ) {
            // User cancelled share sheet
            return;
          }
          throw shareErr;
        }
      } else {
        // Desktop fallback: download the identical vector PDF
        doc.save(filename);
        setShareStatusNotice(
          '✓ Official PDF downloaded! You can attach it directly into WhatsApp Web or chats.'
        );
      }
    } catch (err: unknown) {
      console.error('Share execution error:', err);
      setPhoneError('Unable to generate or share PDF invoice.');
    } finally {
      setIsSharingPdf(false);
    }
  };

  // ==========================================================================
  // WHATSAPP E-BILL GENERATOR & CLICK-TO-CHAT
  // ==========================================================================
  const handleSendWhatsApp = () => {
    setPhoneError(null);
    setShareStatusNotice(null);

    const sanitizedPhone = sanitizeWhatsAppPhone(customerPhone);
    openWhatsAppInvoice(bill, { customerPhone });
    setShareStatusNotice(
      sanitizedPhone
        ? `✓ WhatsApp Click-to-Chat opened for +${sanitizedPhone}.`
        : '✓ WhatsApp opened! Select recipient to send invoice.'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateInvoicePdf(bill);
    setShareStatusNotice('✓ Official PDF invoice downloaded successfully.');
  };

  const customerName = bill.customer?.name || 'Walk-in Retail Buyer';
  const customerPhoneDisplay = bill.customer?.phone || customerPhone || 'Walk-in Guest';

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-success-modal-title"
    >
      <div className={styles.modalCard}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.successIconBadge}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className={styles.titleText} id="pos-success-modal-title">
                Bill Completed Successfully
              </div>
              <div className={styles.billSubBadge}>{bill.billNumber}</div>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
            title="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Section A: WhatsApp e-Bill Dispatch & PDF Sharing Card (Clean View without visible input) */}
          <section className={styles.whatsAppBox}>
            <div className={styles.whatsAppHeader}>
              {/* WhatsApp custom green SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 2C6.494 2 2 6.494 2 12.031c0 1.769.458 3.494 1.332 5.01L2 22l5.127-1.312c1.472.802 3.13 1.343 4.904 1.343 5.537 0 10.031-4.494 10.031-10.031S17.568 2 12.031 2zm0 18.25c-1.572 0-3.08-.419-4.417-1.212l-.317-.188-3.284.841.876-3.204-.207-.328c-.876-1.393-1.342-3.018-1.342-4.707 0-4.664 3.795-8.459 8.459-8.459 4.664 0 8.459 3.795 8.459 8.459 0 4.664-3.795 8.459-8.459 8.459zm4.646-6.331c-.255-.128-1.508-.744-1.741-.829-.234-.085-.404-.128-.574.128-.17.255-.658.829-.807.999-.149.17-.297.191-.552.064-.255-.128-1.077-.397-2.052-1.266-.759-.677-1.272-1.514-1.421-1.77-.149-.255-.016-.393.112-.52.115-.114.255-.297.382-.446.128-.149.17-.255.255-.425.085-.17.042-.319-.021-.446-.064-.128-.574-1.381-.786-1.891-.207-.497-.417-.43-.574-.438-.149-.008-.319-.008-.489-.008-.17 0-.446.064-.679.319-.234.255-.892.871-.892 2.125s.914 2.465 1.041 2.635c.128.17 1.799 2.748 4.359 3.853.609.263 1.084.42 1.455.538.612.195 1.169.167 1.61.101.492-.074 1.508-.616 1.721-1.211.213-.595.213-1.105.149-1.211-.064-.106-.234-.17-.489-.297z" />
              </svg>
              <span>Instant Digital e-Bill &amp; Official PDF Invoice</span>
            </div>

            <p className={styles.whatsAppPrompt}>
              Share paperless botanical PDF invoice directly with customer via WhatsApp or download for records.
            </p>

            {/* Recipient Details Badge - Clutter-free view */}
            <div className={styles.recipientBadgeRow}>
              <span className={styles.recipientLabel}>Customer Recipient:</span>
              <span className={styles.recipientValue}>
                {customerName} {customerPhone ? `(${customerPhone})` : '• Walk-in (No Phone Linked)'}
              </span>
            </div>

            {phoneError && <div className={styles.phoneError}>{phoneError}</div>}
            {clipboardToastNotice && (
              <div className={styles.clipboardToast} role="status">
                <Copy size={14} />
                <span>{clipboardToastNotice}</span>
              </div>
            )}
            {shareStatusNotice && (
              <div className={styles.shareStatusNotice}>{shareStatusNotice}</div>
            )}

            <div className={styles.shareButtonsRow}>
              {/* 1. Direct WhatsApp Click-to-Chat */}
              <button
                type="button"
                className={styles.whatsAppSendBtn}
                onClick={handleSendWhatsApp}
                title="Send pre-filled itemized invoice to customer on WhatsApp"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 2C6.494 2 2 6.494 2 12.031c0 1.769.458 3.494 1.332 5.01L2 22l5.127-1.312c1.472.802 3.13 1.343 4.904 1.343 5.537 0 10.031-4.494 10.031-10.031S17.568 2 12.031 2zm0 18.25c-1.572 0-3.08-.419-4.417-1.212l-.317-.188-3.284.841.876-3.204-.207-.328c-.876-1.393-1.342-3.018-1.342-4.707 0-4.664 3.795-8.459 8.459-8.459 4.664 0 8.459 3.795 8.459 8.459 0 4.664-3.795 8.459-8.459 8.459zm4.646-6.331c-.255-.128-1.508-.744-1.741-.829-.234-.085-.404-.128-.574.128-.17.255-.658.829-.807.999-.149.17-.297.191-.552.064-.255-.128-1.077-.397-2.052-1.266-.759-.677-1.272-1.514-1.421-1.77-.149-.255-.016-.393.112-.52.115-.114.255-.297.382-.446.128-.149.17-.255.255-.425.085-.17.042-.319-.021-.446-.064-.128-.574-1.381-.786-1.891-.207-.497-.417-.43-.574-.438-.149-.008-.319-.008-.489-.008-.17 0-.446.064-.679.319-.234.255-.892.871-.892 2.125s.914 2.465 1.041 2.635c.128.17 1.799 2.748 4.359 3.853.609.263 1.084.42 1.455.538.612.195 1.169.167 1.61.101.492-.074 1.508-.616 1.721-1.211.213-.595.213-1.105.149-1.211-.064-.106-.234-.17-.489-.297z" />
                </svg>
                <span>💬 WhatsApp</span>
              </button>

              {/* 2. Direct Web Share API PDF Attachment */}
              <button
                type="button"
                className={styles.whatsAppSharePdfBtn}
                onClick={handleSharePdfViaWhatsApp}
                disabled={isSharingPdf}
                title="Directly attach and share PDF invoice via mobile share sheet to WhatsApp"
              >
                {isSharingPdf ? (
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Paperclip size={15} />
                )}
                <span>
                  {isSharingPdf ? 'Synthesizing PDF...' : '📎 Share PDF'}
                </span>
              </button>

              {/* 3. Official Vector PDF Download */}
              <button
                type="button"
                className={styles.pdfDownloadBtn}
                onClick={handleDownloadPdf}
                title="Download official branded PDF tax invoice"
              >
                <Download size={15} />
                <span>📥 Invoice PDF</span>
              </button>
            </div>

            <div className={styles.shareOptionsHint}>
              💡 <strong>Smart Sharing:</strong> Tap &quot;📎 Share PDF via WhatsApp&quot; to auto-copy recipient phone and attach the official PDF directly.
            </div>
          </section>

          {/* Section B: Redesigned Executive Tax Invoice Preview Sheet (Captured by html2canvas & Printer) */}
          <div ref={receiptRef} className={styles.invoiceSheet}>
            {/* 1. Header Banner */}
            <div className={styles.invoiceHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.logoBadge}>
                  {!logoFailed ? (
                    <img
                      src="/images/logo.png"
                      alt="Bharti's Green World Logo"
                      className={styles.logoImg}
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <div className={styles.fallbackIcon} aria-hidden="true">
                      <Leaf size={24} />
                    </div>
                  )}
                </div>

                <div className={styles.brandInfo}>
                  <h1 className={styles.nurseryName}>BHARTI&apos;S GREEN WORLD</h1>
                  <p className={styles.nurserySubtitle}>Plant Nursery &amp; Landscaping • Kolhapur</p>
                  <p className={styles.nurseryContact}>
                    📍 Shiroli / Kolhapur, Maharashtra 416122 • 📞 +91 98220 12345
                  </p>
                  <p className={styles.nurseryTaxInfo}>
                    GSTIN / Nursery Reg: 27AABCB1234F1Z5 • Email: contact@bhartisgreenworld.com
                  </p>
                </div>
              </div>

              <div className={styles.headerRight}>
                <div className={styles.invoiceTypeBadge}>TAX INVOICE / CASH MEMO</div>
                <div className={styles.invoiceNumberDisplay}>{bill.billNumber}</div>
              </div>
            </div>

            {/* 2. Customer & Metadata Box */}
            <div className={styles.metadataCard}>
              <div className={styles.metadataCol}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Invoice Date:</span>
                  <span className={styles.metaValue}>
                    {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Invoice Time:</span>
                  <span className={styles.metaValue}>
                    {new Date(bill.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Payment Mode:</span>
                  <span className={styles.metaValue}>
                    {bill.paymentMode === 'CASH'
                      ? 'Cash Counter'
                      : bill.paymentMode === 'UPI'
                      ? 'UPI / Digital Bank Transfer'
                      : 'Credit (Udhar Ledger)'}
                  </span>
                </div>
              </div>

              <div className={styles.metadataCol}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Customer Name:</span>
                  <span className={styles.metaValueBold}>{customerName}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Contact Number:</span>
                  <span className={styles.metaValue}>{customerPhoneDisplay}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Counter Desk:</span>
                  <span className={styles.metaValue}>Main POS Billing Desk</span>
                </div>
              </div>
            </div>

            {/* 3. Itemized Products Table */}
            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>#</th>
                  <th>Item Description</th>
                  <th style={{ width: '85px', textAlign: 'center' }}>Category</th>
                  <th style={{ width: '65px', textAlign: 'right' }}>Qty</th>
                  <th style={{ width: '85px', textAlign: 'right' }}>Rate (₹)</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <span className={styles.plantName}>{item.plant?.name || 'Botanical Plant Variety'}</span>
                      {item.plant?.sku && (
                        <span className={styles.plantSku}> (SKU: {item.plant.sku})</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={styles.categoryBadge}>{item.plant?.category || 'NURSERY'}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₹{item.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 4. Financial Settlement Summary Box */}
            <div className={styles.settlementSection}>
              <div className={styles.settlementNotes}>
                <div className={styles.taxExemptNote}>
                  🌿 <strong>Agricultural Goods:</strong> Live plants, saplings, and horticultural nursery produce are exempt under GST Notification (Nil-rated agricultural products).
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryRow}>
                  <span>Subtotal:</span>
                  <span>₹{bill.totalAmount.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Discount:</span>
                  <span style={{ color: '#047857' }}>₹0.00</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Net Amount Paid:</span>
                  <span style={{ fontWeight: 700, color: '#047857' }}>₹{bill.amountPaid.toFixed(2)}</span>
                </div>
                {bill.balanceDue > 0 && (
                  <div className={`${styles.summaryRow} ${styles.balanceDueRow}`}>
                    <span>Balance Due (Udhar):</span>
                    <span>₹{bill.balanceDue.toFixed(2)}</span>
                  </div>
                )}
                <div className={`${styles.summaryRow} ${styles.netTotalRow}`}>
                  <span>Grand Total:</span>
                  <span>₹{bill.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className={styles.modalFooter}>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            leftIcon={<Printer size={15} />}
          >
            🖨️ Print Receipt
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onNewBill}
            leftIcon={<RotateCcw size={15} />}
          >
            Start New Bill
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            leftIcon={<ArrowRight size={15} />}
          >
            Return to POS
          </Button>
        </div>
      </div>
    </div>
  );
};
