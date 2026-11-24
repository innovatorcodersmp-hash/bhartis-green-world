/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/landscaping/components/SiteVisitSuccessModal.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<SiteVisitSuccessModal>` confirmation dialog for Landscaping Site Visits.
 *    - Displays real-time message preview generated from the approved WhatsApp template.
 *    - Integrated 1-click **Send WhatsApp Update** action (`openSiteVisitWhatsApp`) matching
 *      the POS invoice receipt flow.
 *    - Added clipboard copying for fallback manual sending on desktop or mobile.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT SITE VISIT & MAINTENANCE WHATSAPP UPDATE".
 *    - Delivers a seamless post-save cashier and supervisor experience to immediately notify clients.
 * 
 * 3. WHAT WAS USED:
 *    - Lucide React icons (`CheckCircle2`, `X`, `Copy`, `Check`, `Share2`).
 *    - WhatsApp utilities (`openSiteVisitWhatsApp`, `formatSiteVisitWhatsAppMessage`, `sanitizeWhatsAppPhone`).
 *    - Button primitives (`@/components/ui`).
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { SiteVisit } from '../types';
import {
  openSiteVisitWhatsApp,
  formatSiteVisitWhatsAppMessage,
  sanitizeWhatsAppPhone,
} from '../utils';
import styles from './SiteVisitSuccessModal.module.scss';

export interface SiteVisitSuccessModalProps {
  visit: SiteVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onNewVisit?: () => void;
}

export const SiteVisitSuccessModal: React.FC<SiteVisitSuccessModalProps> = ({
  visit,
  isOpen,
  onClose,
  onNewVisit,
}) => {
  const [copied, setCopied] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

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

  if (!isOpen || !visit) {
    return null;
  }

  const messageText = formatSiteVisitWhatsAppMessage(visit);
  const sanitized = sanitizeWhatsAppPhone(visit.customerMobile);

  const handleSendWhatsApp = () => {
    openSiteVisitWhatsApp(visit);
    setToastNotice(
      sanitized
        ? `✓ WhatsApp Click-to-Chat opened for +${sanitized}.`
        : '✓ WhatsApp opened! Select contact to send update.'
    );
  };

  const handleCopyMessage = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(messageText);
        setCopied(true);
        setToastNotice('✓ Formatted update message copied to clipboard.');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-visit-success-title"
    >
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.successIconBadge}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className={styles.titleText} id="site-visit-success-title">
                Site Visit Logged Successfully
              </h3>
              <p className={styles.subtitleText}>
                {visit.siteName} • {visit.customerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {toastNotice && (
            <div className={styles.toastNotice} role="status">
              <CheckCircle2 size={16} />
              <span>{toastNotice}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className={styles.primaryActionsRow}>
            <button
              type="button"
              className={styles.whatsAppSendBtn}
              onClick={handleSendWhatsApp}
              title="Open WhatsApp Click-to-Chat with pre-filled message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 2C6.494 2 2 6.494 2 12.031c0 1.769.458 3.494 1.332 5.01L2 22l5.127-1.312c1.472.802 3.13 1.343 4.904 1.343 5.537 0 10.031-4.494 10.031-10.031S17.568 2 12.031 2zm0 18.25c-1.572 0-3.08-.419-4.417-1.212l-.317-.188-3.284.841.876-3.204-.207-.328c-.876-1.393-1.342-3.018-1.342-4.707 0-4.664 3.795-8.459 8.459-8.459 4.664 0 8.459 3.795 8.459 8.459 0 4.664-3.795 8.459-8.459 8.459zm4.646-6.331c-.255-.128-1.508-.744-1.741-.829-.234-.085-.404-.128-.574.128-.17.255-.658.829-.807.999-.149.17-.297.191-.552.064-.255-.128-1.077-.397-2.052-1.266-.759-.677-1.272-1.514-1.421-1.77-.149-.255-.016-.393.112-.52.115-.114.255-.297.382-.446.128-.149.17-.255.255-.425.085-.17.042-.319-.021-.446-.064-.128-.574-1.381-.786-1.891-.207-.497-.417-.43-.574-.438-.149-.008-.319-.008-.489-.008-.17 0-.446.064-.679.319-.234.255-.892.871-.892 2.125s.914 2.465 1.041 2.635c.128.17 1.799 2.748 4.359 3.853.609.263 1.084.42 1.455.538.612.195 1.169.167 1.61.101.492-.074 1.508-.616 1.721-1.211.213-.595.213-1.105.149-1.211-.064-.106-.234-.17-.489-.297z" />
              </svg>
              <span>Send WhatsApp Update</span>
            </button>

            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyMessage}
              title="Copy formatted message text"
            >
              {copied ? <Check size={15} color="#059669" /> : <Copy size={15} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Formatted Message Preview */}
          <div className={styles.previewSection}>
            <div className={styles.previewLabel}>
              <span>WhatsApp Message Preview</span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 'normal', color: '#64748B' }}>
                Recipient: +{sanitized || 'Direct Chat'}
              </span>
            </div>
            <div className={styles.messagePreviewBox}>
              {messageText}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {onNewVisit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNewVisit}
            >
              Log Another Visit
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            View Site Visits
          </Button>
        </div>
      </div>
    </div>
  );
};

