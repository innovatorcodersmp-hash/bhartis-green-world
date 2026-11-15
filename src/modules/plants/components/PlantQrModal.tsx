/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/plants/components/PlantQrModal.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<PlantQrModal>`, an accessible dialog for previewing and printing botanical QR pot tags.
 *    - Integrated `QRCodeSVG` from `qrcode.react` generating vector QR codes encoding the plant's SKU.
 *    - Rendered bilingual botanical names (English & Marathi), SKU, retail price, category, and polyhouse location.
 *    - Implemented a single-click "🖨️ Print Label" trigger connected to `window.print()` formatted for thermal sticker printers.
 *    - Included keyboard accessibility (Escape to dismiss) and backdrop touch dismiss.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "PWA Clean UI Standards" & Specification 08: "Dependency Governance".
 *    - Enables physical plant pots and sapling bags in the Kolhapur nursery to be tagged with weatherproof QR stickers.
 *    - Works in synergy with the POS Smartphone Camera Scanner for instant scan-to-bill checkout.
 * 
 * 3. WHAT WAS USED:
 *    - `qrcode.react` (`QRCodeSVG`).
 *    - Shared UI primitive `<Button />`.
 *    - Lucide React icons (`Printer`, `X`, `QrCode`, `Sprout`).
 *    - Dedicated SASS module with print media query styles (`PlantQrModal.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - When a plant row's QR action is clicked, this modal opens with the rendered tag.
 *      Clicking "Print Label" invokes browser printing, where CSS isolates only the sticker tag.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui';
import { Plant } from '../types';
import styles from './PlantQrModal.module.scss';

export interface PlantQrModalProps {
  plant: Plant | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlantQrModal: React.FC<PlantQrModalProps> = ({
  plant,
  isOpen,
  onClose,
}) => {
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

  if (!isOpen || !plant) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const qrValue = plant.sku || plant.id;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="plant-qr-modal-title"
    >
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle} id="plant-qr-modal-title">
            <QrCode size={18} />
            <span>Botanical QR Pot Label</span>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          <p className={styles.previewNotice}>
            Thermal sticker preview for pot tags and plant bags. Encoded SKU works with the POS Cashier Scanner.
          </p>

          <div className={styles.labelPreviewContainer}>
            {/* The Printable Sticker Tag */}
            <div className={styles.stickerTag}>
              {/* Tag Header */}
              <div className={styles.tagHeader}>
                <span className={styles.nurseryTitle}>BHARTI&apos;S GREEN WORLD - Kolhapur</span>
                <span className={styles.tagCategory}>{plant.category}</span>
              </div>

              {/* Tag Main Content */}
              <div className={styles.tagContent}>
                <div className={styles.tagDetails}>
                  <div className={styles.plantNameEn}>{plant.name}</div>
                  {plant.marathiName && (
                    <div className={styles.plantNameMr}>{plant.marathiName}</div>
                  )}

                  <div className={styles.plantSku}>
                    SKU: {plant.sku}
                  </div>

                  <div className={styles.plantPrice}>
                    ₹{plant.price.toFixed(2)}
                  </div>
                </div>

                <div className={styles.qrContainer}>
                  <QRCodeSVG
                    value={qrValue}
                    size={88}
                    level="M"
                    includeMargin={false}
                  />
                  <span className={styles.qrCaption}>Scan to Bill</span>
                </div>
              </div>

              {/* Tag Footer */}
              <div className={styles.tagFooter}>
                <span>Location: {plant.polyhouseNo || 'Main Yard'}</span>
                <span>Stock: {plant.stockCount} pots</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handlePrint}
            leftIcon={<Printer size={15} />}
          >
            Print Tag
          </Button>
        </div>
      </div>
    </div>
  );
};
