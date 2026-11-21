/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/inventory/components/InventoryForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Upgraded `<InventoryForm>` to support multi-plant repeater consignment logging under a single shared batch code.
 *    - Implemented shared consignment header entered once:
 *      * Batch Code / Number (prefilled with next auto-generated code, with datalist / selection of existing batch codes).
 *      * Purchase / Arrival Date *.
 *      * Supplying Vendor (Optional).
 *    - Implemented dynamic plant line-item repeater:
 *      * Starts with 1 plant row; clean `+ Add Another Plant` button to add unlimited varieties.
 *      * Each plant entry row features: Plant Cultivar *, Total Received Pots *, Unit Purchase Cost,
 *        Damaged / Dead Pots, and Ready to Sell Stock * (auto-calculated as Received - Damaged with manual override).
 *      * Delete row action icon displayed when > 1 plant entry row exists.
 *      * Strictly eliminates all `e.g.` helper clutter.
 *      * Disables mouse-wheel numeric incrementing (`onWheel={(e) => e.currentTarget.blur()}`) on all number fields.
 *    - Built live-calculating combined summary footer:
 *      * `Total Plants / Varieties: X`
 *      * `Total Investment: ₹X,XXX`
 *      * `Total Ready to Sell: X Pots`
 *    - Preserved single-batch editing mode (`mode === 'edit'`) for individual batch audits and mortality adjustments.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills User Request: "Multi-Plant Repeater UI in InventoryForm.tsx".
 *    - Eliminates repetitive batch number entry when receiving multi-variety truck consignments at the Kolhapur nursery.
 * 
 * 3. WHAT WAS USED:
 *    - React client hooks (`useState`, `useEffect`, `useTransition`, `useMemo`).
 *    - Lucide React icons (`Sprout`, `Plus`, `Trash2`, `Save`, `X`, `AlertCircle`, `Calendar`, `DollarSign`, `Layers`).
 *    - Shared UI primitives (`<Input>`, `<SearchableSelect>`, `<Button>`).
 *    - Server Actions (`createBatchConsignmentAction`, `updateInventoryBatchAction`, `deleteInventoryBatchAction`).
 * 
 * 4. HOW IT WORKS:
 *    - Maintains shared consignment state and an array of plant item rows;
 *    - Auto-computes ready stock as received and mortality quantities change;
 *    - Submits multi-item array atomically via Server Actions;
 *    - Recalculates stock across all affected plant records and navigates back to `/inventory`.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sprout, Plus, Trash2, Save, X, AlertCircle, Calendar } from 'lucide-react';
import { Input, Button, SearchableSelect } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  InventoryBatchWithRelations,
  Plant,
  Vendor,
  BatchPlantItemInput,
  BatchConsignmentInput,
  InventoryBatchInput,
} from '../types';
import {
  createBatchConsignmentAction,
  updateInventoryBatchAction,
  deleteInventoryBatchAction,
} from '../actions';
import styles from './InventoryForm.module.scss';

export interface PlantRowItem {
  id: string; // Internal unique row ID for stable React rendering
  plantId: string;
  initialQty: number | '';
  unitCostPrice: number | '';
  mortalityQty: number | '';
  currentQty: number | '';
}

export interface InventoryFormProps {
  initialData?: InventoryBatchWithRelations | null;
  mode?: 'create' | 'edit';
  plants: Plant[];
  vendors: Vendor[];
  initialBatchCode?: string;
  existingBatchCodes?: string[];
  initialPlantId?: string;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  initialData,
  mode = initialData ? 'edit' : 'create',
  plants,
  vendors,
  initialBatchCode,
  existingBatchCodes = [],
  initialPlantId: initialPlantIdProp,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlantId = initialPlantIdProp || searchParams.get('plantId') || '';
  const [isPending, startTransition] = useTransition();
  const firstRowQtyRef = useRef<HTMLInputElement>(null);

  useSetPageHeader({
    title: mode === 'edit' ? `Edit Batch: ${initialData?.batchNumber || ''}` : 'Log New Sapling Batch',
    subtitle:
      mode === 'edit'
        ? `Update stock levels, unit cost, and mortality audits for batch: ${initialData?.batchNumber || ''}`
        : 'Register nursery sapling procurement consignments and internal propagation batches.',
  });

  // 1. Shared Consignment Header State
  const [batchNumber, setBatchNumber] = useState<string>(
    initialData?.batchNumber || initialBatchCode || ''
  );
  const [purchaseDate, setPurchaseDate] = useState<string>(
    initialData?.purchaseDate
      ? new Date(initialData.purchaseDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [vendorId, setVendorId] = useState<string>(
    initialData?.vendorId || ''
  );

  // Sync batch number if prefill arrives late
  useEffect(() => {
    if (mode === 'create' && initialBatchCode && !batchNumber) {
      setBatchNumber(initialBatchCode);
    }
  }, [initialBatchCode, mode, batchNumber]);

  // 2. Repeatable Plant Line-Items State
  const [plantItems, setPlantItems] = useState<PlantRowItem[]>(() => {
    if (initialData) {
      return [
        {
          id: initialData.id,
          plantId: initialData.plantId,
          initialQty: initialData.initialQty,
          unitCostPrice: initialData.unitCostPrice !== null && initialData.unitCostPrice !== undefined
            ? initialData.unitCostPrice
            : '',
          mortalityQty: initialData.mortalityQty,
          currentQty: initialData.currentQty,
        },
      ];
    }

    const preselectedPlant =
      initialPlantId && plants.some((p) => p.id === initialPlantId)
        ? initialPlantId
        : '';

    return [
      {
        id: `row-${Date.now()}-1`,
        plantId: preselectedPlant,
        initialQty: '',
        unitCostPrice: '',
        mortalityQty: 0,
        currentQty: '',
      },
    ];
  });

  // Sync initialPlantId into the first plant line-item if plants list loads or initialPlantId updates
  useEffect(() => {
    if (mode === 'create' && initialPlantId && plants.some((p) => p.id === initialPlantId)) {
      setPlantItems((prev) => {
        if (prev.length > 0 && (!prev[0].plantId || prev[0].plantId !== initialPlantId)) {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            plantId: initialPlantId,
          };
          return updated;
        }
        return prev;
      });
    }
  }, [initialPlantId, plants, mode]);

  // Auto-focus Total Received Pots on first row when initialPlantId is pre-selected
  useEffect(() => {
    if (initialPlantId && firstRowQtyRef.current) {
      const timer = setTimeout(() => {
        firstRowQtyRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialPlantId]);

  // 3. Validation and Error Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Map plants to SearchableSelect options
  const plantOptions = useMemo(
    () =>
      plants.map((p) => ({
        value: p.id,
        label: p.marathiName ? `${p.name} (${p.marathiName})` : p.name,
        subLabel: `SKU: ${p.sku} • Stock: ${p.stockCount} pots • ₹${p.price}`,
      })),
    [plants]
  );

  // Map vendors to SearchableSelect options
  const vendorOptions = useMemo(
    () => [
      { value: '', label: 'Internal Propagation / In-House Lot' },
      ...vendors.map((v) => ({
        value: v.id,
        label: v.name,
        subLabel: `${v.category} • ${v.phone}`,
      })),
    ],
    [vendors]
  );

  // Handle adding another plant variety row
  const handleAddPlantRow = () => {
    setPlantItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length + 1}`,
        plantId: '',
        initialQty: '',
        unitCostPrice: '',
        mortalityQty: 0,
        currentQty: '',
      },
    ]);
  };

  // Handle removing a plant variety row
  const handleRemovePlantRow = (rowId: string) => {
    if (plantItems.length <= 1) return;
    setPlantItems((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Handle plant line-item field changes
  const updatePlantRow = (rowId: string, updates: Partial<PlantRowItem>) => {
    setPlantItems((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const updated = { ...row, ...updates };

        // Auto-calculate currentQty when initialQty or mortalityQty changes
        if ('initialQty' in updates || 'mortalityQty' in updates) {
          const init = typeof updated.initialQty === 'number' ? updated.initialQty : 0;
          const mort = typeof updated.mortalityQty === 'number' ? updated.mortalityQty : 0;
          if (updated.initialQty !== '') {
            updated.currentQty = Math.max(0, init - mort);
          }
        }

        return updated;
      })
    );
  };

  // 4. Combined Live Summary Footer Calculation
  const summary = useMemo(() => {
    let totalVarieties = 0;
    let totalInvestment = 0;
    let totalReady = 0;
    let totalDamaged = 0;

    for (const item of plantItems) {
      if (item.plantId) totalVarieties++;
      const init = typeof item.initialQty === 'number' ? item.initialQty : 0;
      const curr = typeof item.currentQty === 'number' ? item.currentQty : 0;
      const mort = typeof item.mortalityQty === 'number' ? item.mortalityQty : 0;
      const cost = typeof item.unitCostPrice === 'number' ? item.unitCostPrice : 0;

      totalInvestment += init * cost;
      totalReady += curr;
      totalDamaged += mort;
    }

    return {
      totalVarieties,
      totalInvestment,
      totalReady,
      totalDamaged,
    };
  }, [plantItems]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const trimmedBatchCode = batchNumber.trim().toUpperCase();
    if (!trimmedBatchCode) {
      setErrorMessage('Please specify a Batch Code or Number.');
      setFieldErrors({ batchNumber: ['Batch code is required.'] });
      return;
    }

    if (!purchaseDate) {
      setErrorMessage('Please specify the purchase or arrival date.');
      setFieldErrors({ purchaseDate: ['Arrival date is required.'] });
      return;
    }

    // Validate each plant item row
    for (let i = 0; i < plantItems.length; i++) {
      const row = plantItems[i];
      const rowNum = i + 1;

      if (!row.plantId) {
        setErrorMessage(`Please select a plant cultivar for variety #${rowNum}.`);
        return;
      }

      if (row.initialQty === '' || isNaN(Number(row.initialQty)) || Number(row.initialQty) < 1) {
        setErrorMessage(`Please enter received pots for variety #${rowNum} (at least 1).`);
        return;
      }

      if (row.currentQty === '' || isNaN(Number(row.currentQty)) || Number(row.currentQty) < 0) {
        setErrorMessage(`Please verify ready stock for variety #${rowNum} (cannot be negative).`);
        return;
      }

      if (row.unitCostPrice !== '' && Number(row.unitCostPrice) < 0) {
        setErrorMessage(`Unit purchase cost for variety #${rowNum} cannot be negative.`);
        return;
      }
    }

    startTransition(async () => {
      // 1. Single Edit Mode
      if (mode === 'edit' && initialData) {
        const row = plantItems[0];
        const payload: InventoryBatchInput = {
          batchNumber: trimmedBatchCode,
          plantId: row.plantId,
          vendorId: vendorId || undefined,
          initialQty: Number(row.initialQty),
          currentQty: Number(row.currentQty),
          mortalityQty: row.mortalityQty === '' ? 0 : Number(row.mortalityQty),
          unitCostPrice: row.unitCostPrice === '' ? null : Number(row.unitCostPrice),
          purchaseDate,
        };

        const result = await updateInventoryBatchAction(initialData.id, payload);
        if (result.success) {
          router.push(APP_ROUTES.INVENTORY);
        } else {
          setErrorMessage(result.error || 'Failed to update inventory batch details.');
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        }
        return;
      }

      // 2. Multi-Plant Consignment Create Mode
      const consignmentPayload: BatchConsignmentInput = {
        batchNumber: trimmedBatchCode,
        purchaseDate,
        vendorId: vendorId || null,
        items: plantItems.map((row) => ({
          plantId: row.plantId,
          initialQty: Number(row.initialQty),
          currentQty: Number(row.currentQty),
          mortalityQty: row.mortalityQty === '' ? 0 : Number(row.mortalityQty),
          unitCostPrice: row.unitCostPrice === '' ? null : Number(row.unitCostPrice),
        })),
      };

      const result = await createBatchConsignmentAction(consignmentPayload);
      if (result.success) {
        router.push(APP_ROUTES.INVENTORY);
      } else {
        setErrorMessage(result.error || 'Failed to register consignment batch.');
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    });
  };

  // Archive / Delete handler (Edit mode only)
  const handleDelete = async () => {
    if (!initialData) return;
    const confirmed = window.confirm(
      `Are you sure you want to remove batch ${initialData.batchNumber} from active records?`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteInventoryBatchAction(initialData.id);
      if (result.success) {
        router.push(APP_ROUTES.INVENTORY);
      } else {
        setErrorMessage(result.error || 'Failed to archive batch record.');
      }
    });
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.card} noValidate>
        {/* Form Title & Context */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'edit'
              ? `Edit Batch Consignment: ${initialData?.batchNumber}`
              : 'Log New Sapling Batch'}
          </h2>
          <p className={styles.description}>
            {mode === 'edit'
              ? 'Update stock quantities, unit procurement costs, and mortality adjustments.'
            : 'Enter consignment details once and add multiple plant cultivars under this shared batch.'}
          </p>
        </div>

        {/* Top-Level Server Error Banner */}
        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================================================================ */}
        {/* SECTION 1: SHARED CONSIGNMENT HEADER                             */}
        {/* ================================================================ */}
        <div className={styles.sharedHeaderSection}>
          <div className={styles.sectionHeading}>
            <span>Shared Consignment Details</span>
            {existingBatchCodes.length > 0 && mode === 'create' && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#047857', textTransform: 'none' }}>
                Select or type existing batch to append
              </span>
            )}
          </div>

          <div className={styles.grid3}>
            {/* 1. Batch Code / Number */}
            <div>
              <Input
                label="Batch Code / Number"
                value={batchNumber}
                onChange={(e) => {
                  setBatchNumber(e.target.value);
                  if (fieldErrors.batchNumber) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.batchNumber;
                      return updated;
                    });
                  }
                }}
                required
                list="existing-batch-codes"
                errorMessage={fieldErrors.batchNumber?.[0]}
                disabled={isPending}
              />
              {existingBatchCodes.length > 0 && (
                <datalist id="existing-batch-codes">
                  {existingBatchCodes.map((code) => (
                    <option key={code} value={code} />
                  ))}
                </datalist>
              )}
            </div>

            {/* 2. Purchase / Arrival Date */}
            <div>
              <Input
                label="Purchase / Arrival Date"
                type="date"
                value={purchaseDate}
                onChange={(e) => {
                  setPurchaseDate(e.target.value);
                  if (fieldErrors.purchaseDate) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.purchaseDate;
                      return updated;
                    });
                  }
                }}
                required
                errorMessage={fieldErrors.purchaseDate?.[0]}
                disabled={isPending}
              />
            </div>

            {/* 3. Supplying Vendor (Optional) */}
            <div>
              <SearchableSelect
                label="Supplying Vendor (Optional)"
                options={vendorOptions}
                value={vendorId}
                onChange={(val) => setVendorId(val)}
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 2: REPEATABLE PLANT LINE-ITEM ROWS                       */}
        {/* ================================================================ */}
        <div className={styles.plantRepeaterList}>
          {plantItems.map((row, idx) => (
            <div key={row.id} className={styles.plantCard}>
              <div className={styles.plantCardHeader}>
                <div className={styles.plantCardIndex}>
                  <Sprout size={14} color="#1B4D3E" />
                  <span>Plant Variety #{idx + 1}</span>
                </div>

                {plantItems.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeRowBtn}
                    onClick={() => handleRemovePlantRow(row.id)}
                    title="Remove variety"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Plant Variety Selection */}
              <div>
                <SearchableSelect
                  label="Plant Cultivar / Variety"
                  options={plantOptions}
                  value={row.plantId}
                  onChange={(val) => updatePlantRow(row.id, { plantId: val })}
                  required
                  disabled={isPending}
                />
              </div>

              {/* 4 Quantitative Inputs in Compact Grid */}
              <div className={styles.grid4}>
                {/* 1. Total Received Pots */}
                <div>
                  <Input
                    ref={idx === 0 ? firstRowQtyRef : undefined}
                    autoFocus={Boolean(initialPlantId && idx === 0)}
                    label="Total Received Pots (एकूण आलेली झाडे)"
                    type="number"
                    min="1"
                    step="1"
                    value={row.initialQty}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      updatePlantRow(row.id, { initialQty: isNaN(val as number) ? '' : val });
                    }}
                    required
                    disabled={isPending}
                  />
                </div>

                {/* 2. Unit Purchase Cost */}
                <div>
                  <Input
                    label="Unit Purchase Cost (₹ per pot)"
                    type="number"
                    min="0"
                    step="0.5"
                    value={row.unitCostPrice}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      updatePlantRow(row.id, { unitCostPrice: isNaN(val as number) ? '' : val });
                    }}
                    disabled={isPending}
                  />
                </div>

                {/* 3. Damaged / Dead Pots */}
                <div>
                  <Input
                    label="Damaged / Dead Pots (खराब / वाळलेली झाडे)"
                    type="number"
                    min="0"
                    step="1"
                    value={row.mortalityQty}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      updatePlantRow(row.id, { mortalityQty: isNaN(val as number) ? '' : val });
                    }}
                    disabled={isPending}
                  />
                </div>

                {/* 4. Ready to Sell Stock */}
                <div>
                  <Input
                    label="Ready to Sell Stock (विक्रीसाठी तयार झाडे)"
                    type="number"
                    min="0"
                    step="1"
                    value={row.currentQty}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      updatePlantRow(row.id, { currentQty: isNaN(val as number) ? '' : val });
                    }}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* "+ Add Another Plant" Action Button (Create mode or when adding varieties) */}
          {mode === 'create' && (
            <button
              type="button"
              className={styles.addPlantButton}
              onClick={handleAddPlantRow}
              disabled={isPending}
            >
              <Plus size={15} />
              <span>+ Add Another Plant</span>
            </button>
          )}
        </div>

        {/* ================================================================ */}
        {/* SECTION 3: COMBINED LIVE SUMMARY FOOTER                          */}
        {/* ================================================================ */}
        <div className={styles.summaryRibbon} aria-live="polite">
          <div className={styles.ribbonItem}>
            <span className={styles.ribbonLabel}>Total Plants / Varieties:</span>
            <span className={styles.ribbonValue}>
              {summary.totalVarieties || plantItems.length}
            </span>
          </div>

          <span className={styles.ribbonDivider}>•</span>

          <div className={styles.ribbonItem}>
            <span className={styles.ribbonLabel}>Total Investment:</span>
            <span className={styles.ribbonValue}>
              ₹{summary.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          <span className={styles.ribbonDivider}>•</span>

          <div className={styles.ribbonItem}>
            <span className={styles.ribbonLabel}>Total Ready to Sell:</span>
            <span className={styles.ribbonValue}>
              {summary.totalReady.toLocaleString('en-IN')} Pots
            </span>
          </div>

          {summary.totalDamaged > 0 && (
            <>
              <span className={styles.ribbonDivider}>•</span>
              <div className={styles.ribbonItem}>
                <span className={styles.ribbonLabel}>Damaged:</span>
                <span className={`${styles.ribbonValue} ${styles.ribbonLossDanger}`}>
                  {summary.totalDamaged.toLocaleString('en-IN')} Pots
                </span>
              </div>
            </>
          )}
        </div>

        {/* ================================================================ */}
        {/* SECTION 4: ACTIONS FOOTER                                        */}
        {/* ================================================================ */}
        <div className={styles.footer}>
          <div>
            {mode === 'edit' && initialData && (
              <Button
                type="button"
                variant="danger"
                leftIcon={<Trash2 size={14} />}
                onClick={handleDelete}
                disabled={isPending}
              >
                Archive Batch
              </Button>
            )}
          </div>

          <div className={styles.primaryActions}>
            <Button
              type="button"
              variant="outline"
              leftIcon={<X size={14} />}
              onClick={() => router.push(APP_ROUTES.INVENTORY)}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save size={14} />}
              isLoading={isPending}
            >
              {mode === 'edit' ? 'Save Changes' : `Save Batch Consignment (${plantItems.length})`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
