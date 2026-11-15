/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/plants/components/BulkPlantQrModal.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<BulkPlantQrModal>`, an accessible dialog for batch previewing and printing
 *      sheets of botanical QR pot tags for all or filtered plants in the nursery catalogue.
 *    - Integrated `QRCodeSVG` from `qrcode.react` generating vector QR codes for each plant's SKU.
 *    - Provided live search filter and category selector pills (All, Flowering, Fruit, Indoor, Herbs).
 *    - Structured printable pot tag cards displaying Bilingual Names, SKU, Retail Price, Location, and QR code.
 *    - Configured single-click print action invoking `window.print()`, formatted via `@media print`
 *      for standard A4 adhesive label sheets.
 *    - Included keyboard accessibility (Escape to dismiss) and backdrop touch dismiss.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Add a 'Bulk Print QR Codes' button right next to the 'Add Plant' button
 *      on the Plant Master Directory page".
 *    - Enables nursery staff to tag entire new batches of plants with sticky QR codes in a single print run.
 * 
 * 3. WHAT WAS USED:
 *    - `qrcode.react` (`QRCodeSVG`).
 *    - Shared UI primitive `<Button />`.
 *    - Lucide React icons (`Printer`, `X`, `QrCode`, `Search`).
 *    - Dedicated SASS module with print media query styles (`BulkPlantQrModal.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - When the "Bulk Print QR" button is clicked, this modal opens with the rendered sticker sheet.
 *      Clicking "Print Sticker Sheet" invokes browser printing, where CSS isolates only the sticker grid.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, QrCode, Search, Sprout } from 'lucide-react';
import { Button } from '@/components/ui';
import { Plant, PlantCategory } from '../types';
import styles from './BulkPlantQrModal.module.scss';

export interface BulkPlantQrModalProps {
  plants: Plant[];
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'All Categories',
  FLOWER: 'Flowering',
  FRUIT: 'Fruit Trees',
  ORNAMENTAL: 'Indoor / Ornamental',
  MEDICINAL: 'Herbs & Medicinal',
};

export const BulkPlantQrModal: React.FC<BulkPlantQrModalProps> = ({
  plants,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

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

  // Filter plants based on category and search query
  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const matchesCategory =
        selectedCategory === 'ALL' || plant.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        plant.name.toLowerCase().includes(query) ||
        (plant.marathiName && plant.marathiName.toLowerCase().includes(query)) ||
        plant.sku.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [plants, selectedCategory, searchQuery]);

  if (!isOpen) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-plant-qr-modal-title"
    >
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup} id="bulk-plant-qr-modal-title">
            <div className={styles.headerIconBadge}>
              <QrCode size={18} />
            </div>
            <div>
              <div className={styles.titleText}>Bulk Print Botanical QR Tags</div>
              <div className={styles.subtitleText}>
                Batch adhesive label sheet for pot tags and nursery stock
              </div>
            </div>
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

        {/* Toolbar: Category Filters & Search */}
        <div className={styles.modalToolbar}>
          <div className={styles.filterControls}>
            <input
              type="text"
              placeholder="Search plant or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Filter QR tags"
            />

            {(['ALL', 'FLOWER', 'FRUIT', 'ORNAMENTAL', 'MEDICINAL'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.categoryPill} ${selectedCategory === cat ? styles.activeCategory : ''
                    }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              )
            )}
          </div>

          <div className={styles.toolbarActions}>
            <span className={styles.badgeCount}>
              {filteredPlants.length} of {plants.length} Labels
            </span>

          </div>
        </div>

        {/* Printable Sheet Body */}
        <div className={styles.sheetContainer}>
          {filteredPlants.length === 0 ? (
            <div className={styles.emptyState}>
              <Sprout size={32} opacity={0.4} />
              <p>No matching plant records found for this filter.</p>
            </div>
          ) : (
            <div className={styles.printableSheet}>
              {filteredPlants.map((plant) => {
                const qrValue = plant.sku || plant.id;
                const categoryClass = styles[plant.category] || '';

                return (
                  <div key={plant.id} className={styles.stickerCard}>
                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <span className={styles.nurseryBrand}>
                        BHARTI&apos;S GREEN WORLD • Kolhapur
                      </span>
                      <span className={`${styles.categoryTag} ${categoryClass}`}>
                        {plant.category}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className={styles.cardBody}>
                      <div className={styles.cardDetails}>
                        <div className={styles.plantNameEn} title={plant.name}>
                          {plant.name}
                        </div>
                        {plant.marathiName && (
                          <div
                            className={styles.plantNameMr}
                            title={plant.marathiName}
                          >
                            {plant.marathiName}
                          </div>
                        )}

                        <div className={styles.skuCode}>SKU: {plant.sku}</div>

                        <div className={styles.priceTag}>
                          ₹{plant.price.toFixed(2)}
                        </div>
                      </div>

                      <div className={styles.qrWrapper}>
                        <QRCodeSVG
                          value={qrValue}
                          size={76}
                          level="M"
                          includeMargin={false}
                        />
                        <span className={styles.qrCaption}>Scan to Bill</span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className={styles.cardFooter}>
                      <span>Loc: {plant.polyhouseNo || 'Main Yard'}</span>
                      <span>Stock: {plant.stockCount} pots</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerActions}>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              disabled={filteredPlants.length === 0}
              leftIcon={<Printer size={15} />}
            >
              Print Sheet ({filteredPlants.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
