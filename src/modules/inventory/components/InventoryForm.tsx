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
 *    - Re-engineered `<InventoryForm>` into an ultra-compact UI card layout minimizing vertical screen height.
 *    - Replaced the large 3-card summary block with a sleek, single-line horizontal ribbon (`.summaryRibbon`):
 *      `Total Investment: ₹X,XXX | Ready to Sell: X Pots | Damaged Loss: ₹X`.
 *    - Reduced card padding, field margins, and grid gaps across the 2-column rows to eliminate excess scrolling.
 *    - Preserved the "Unit Purchase Cost (₹ per pot)" input and clean empty initialization in Create mode.
 *    - Automated "Batch Code / Number" with sequential codes (`BGW-BAT-YYYY-XXXX`) rendered in read-only monospace style.
 *    - Positioned "Cancel" and "Save Batch" buttons cleanly inside the card footer with 44px minimum touch targets.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: ULTRA-COMPACT REDESIGN FOR INVENTORY BATCH FORM AND FINANCIAL SUMMARY".
 *    - Fulfills Specification 01: Clean, tight form standards & compact viewport ergonomics.
 *    - Allows nursery supervisors and counter billing staff to view the entire batch form and financial metrics
 *      on a single screen without vertical scrolling fatigue.
 * 
 * 3. WHAT WAS USED:
 *    - React client hooks (`useState`, `useEffect`, `useTransition`, `useMemo`).
 *    - Next.js `useRouter`.
 *    - Server Actions (`createInventoryBatchAction`, `updateInventoryBatchAction`, `deleteInventoryBatchAction`, `getNextBatchCodeAction`).
 *    - Shared UI primitives (`@/components/ui`: `<Input>`, `<SearchableSelect>`, `<Button>`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Mounts within a compact centered card; arranges 8 form fields across 4 tight rows;
 *      dynamically computes and displays the single-line summary ribbon;
 *      validates inputs upon submission; commits via Server Action; and redirects to `/inventory`.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, X, Trash2, Calendar } from 'lucide-react';
import { Input, Button, SearchableSelect } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  InventoryBatchWithRelations,
  InventoryBatchInput,
  Plant,
  Vendor,
} from '../types';
import {
  createInventoryBatchAction,
  updateInventoryBatchAction,
  deleteInventoryBatchAction,
  getNextBatchCodeAction,
} from '../actions';
import styles from './InventoryForm.module.scss';

export interface InventoryFormProps {
  initialData?: InventoryBatchWithRelations | null;
  mode?: 'create' | 'edit';
  plants: Plant[];
  vendors: Vendor[];
  initialBatchCode?: string;
}

export interface InventoryFormState {
  batchNumber: string;
  plantId: string;
  vendorId?: string;
  initialQty: number | '';
  currentQty: number | '';
  mortalityQty: number | '';
  unitCostPrice: number | '';
  purchaseDate: string;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  initialData,
  mode = initialData ? 'edit' : 'create',
  plants,
  vendors,
  initialBatchCode,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSetPageHeader({
    title: mode === 'edit' ? `Edit Batch: ${initialData?.batchNumber || ''}` : 'Log New Sapling Batch',
    subtitle:
      mode === 'edit'
        ? `Update stock levels, unit cost, and mortality audits for batch: ${initialData?.batchNumber || ''}`
        : 'Register a new sapling procurement batch or internal propagation lot.',
  });

  // Map plants to select options
  const plantOptions = useMemo(
    () =>
      plants.map((p) => ({
        value: p.id,
        label: `${p.sku} - ${p.name}`,
        subLabel: p.marathiName || undefined,
      })),
    [plants]
  );

  // Map vendors to select options
  const vendorOptions = useMemo(
    () =>
      vendors.map((v) => ({
        value: v.id,
        label: v.name,
        subLabel: v.phone,
      })),
    [vendors]
  );

  const formattedDate = initialData?.purchaseDate
    ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<InventoryFormState>({
    batchNumber: initialData?.batchNumber || initialBatchCode || '',
    plantId: initialData?.plantId || (plants[0]?.id || ''),
    vendorId: initialData?.vendorId || '',
    initialQty: initialData?.initialQty !== undefined ? initialData.initialQty : '',
    currentQty: initialData?.currentQty !== undefined ? initialData.currentQty : '',
    mortalityQty: initialData?.mortalityQty !== undefined ? initialData.mortalityQty : '',
    unitCostPrice:
      initialData?.unitCostPrice !== null && initialData?.unitCostPrice !== undefined
        ? initialData.unitCostPrice
        : '',
    purchaseDate: formattedDate,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Pre-fill next sequential batch code on form load if in create mode
  useEffect(() => {
    if (mode === 'create' && !initialData && !formData.batchNumber) {
      if (initialBatchCode) {
        setFormData((prev) => ({ ...prev, batchNumber: initialBatchCode }));
      } else {
        getNextBatchCodeAction().then((result) => {
          if (result.success && result.data) {
            setFormData((prev) => ({
              ...prev,
              batchNumber: result.data || `BGW-BAT-${new Date().getFullYear()}-0001`,
            }));
          }
        });
      }
    }
  }, [mode, initialData, formData.batchNumber, initialBatchCode]);

  const handleChange = (field: keyof InventoryFormState, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Automatically recalculate Ready to Sell Stock when Total Received changes
  const handleInitialQtyChange = (valStr: string) => {
    if (valStr === '') {
      setFormData((prev) => ({
        ...prev,
        initialQty: '',
        currentQty: '',
      }));
      return;
    }

    const val = parseInt(valStr, 10);
    const parsedInitial = isNaN(val) ? 0 : val;

    setFormData((prev) => {
      const mortality = typeof prev.mortalityQty === 'number' ? prev.mortalityQty : 0;
      const autoCurrent = Math.max(0, parsedInitial - mortality);
      return {
        ...prev,
        initialQty: parsedInitial,
        currentQty: autoCurrent,
      };
    });

    if (fieldErrors.initialQty || fieldErrors.currentQty) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.initialQty;
        delete updated.currentQty;
        return updated;
      });
    }
  };

  // Automatically recalculate Ready to Sell Stock when Damaged Pots changes
  const handleMortalityQtyChange = (valStr: string) => {
    if (valStr === '') {
      setFormData((prev) => {
        const initial = typeof prev.initialQty === 'number' ? prev.initialQty : '';
        return {
          ...prev,
          mortalityQty: '',
          currentQty: initial,
        };
      });
      return;
    }

    const val = parseInt(valStr, 10);
    const parsedMortality = isNaN(val) ? 0 : val;

    setFormData((prev) => {
      const initial = typeof prev.initialQty === 'number' ? prev.initialQty : 0;
      const autoCurrent = Math.max(0, initial - parsedMortality);
      return {
        ...prev,
        mortalityQty: parsedMortality,
        currentQty: typeof prev.initialQty === 'number' ? autoCurrent : '',
      };
    });

    if (fieldErrors.mortalityQty || fieldErrors.currentQty) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.mortalityQty;
        delete updated.currentQty;
        return updated;
      });
    }
  };

  // Handle Unit Purchase Cost changes
  const handleUnitCostChange = (valStr: string) => {
    if (valStr === '') {
      setFormData((prev) => ({
        ...prev,
        unitCostPrice: '',
      }));
      return;
    }

    const val = parseFloat(valStr);
    const parsedCost = isNaN(val) ? '' : val;

    setFormData((prev) => ({
      ...prev,
      unitCostPrice: parsedCost,
    }));

    if (fieldErrors.unitCostPrice) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.unitCostPrice;
        return updated;
      });
    }
  };

  // Allow manual adjustment of Ready to Sell Stock if needed
  const handleCurrentQtyChange = (valStr: string) => {
    if (valStr === '') {
      setFormData((prev) => ({
        ...prev,
        currentQty: '',
      }));
      return;
    }

    const val = parseInt(valStr, 10);
    const parsedCurrent = isNaN(val) ? 0 : val;

    setFormData((prev) => ({
      ...prev,
      currentQty: parsedCurrent,
    }));

    if (fieldErrors.currentQty) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.currentQty;
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side required numerical validations
    if (formData.initialQty === '' || isNaN(Number(formData.initialQty)) || Number(formData.initialQty) < 1) {
      setErrorMessage('Please enter the total received pots (must be at least 1).');
      setFieldErrors({ initialQty: ['Total received pots must be at least 1.'] });
      return;
    }

    if (formData.currentQty === '' || isNaN(Number(formData.currentQty)) || Number(formData.currentQty) < 0) {
      setErrorMessage('Please enter or verify the ready to sell stock quantity.');
      setFieldErrors({ currentQty: ['Ready to sell stock cannot be negative.'] });
      return;
    }

    if (formData.unitCostPrice !== '' && Number(formData.unitCostPrice) < 0) {
      setErrorMessage('Unit purchase cost cannot be negative.');
      setFieldErrors({ unitCostPrice: ['Unit purchase cost cannot be negative.'] });
      return;
    }

    const payload: InventoryBatchInput = {
      batchNumber: formData.batchNumber,
      plantId: formData.plantId,
      vendorId: formData.vendorId || undefined,
      initialQty: Number(formData.initialQty),
      currentQty: Number(formData.currentQty),
      mortalityQty: formData.mortalityQty === '' ? 0 : Number(formData.mortalityQty),
      unitCostPrice: formData.unitCostPrice === '' ? null : Number(formData.unitCostPrice),
      purchaseDate: formData.purchaseDate,
    };

    startTransition(async () => {
      let result;
      if (mode === 'edit' && initialData) {
        result = await updateInventoryBatchAction(initialData.id, payload);
      } else {
        result = await createInventoryBatchAction(payload);
      }

      if (result.success) {
        router.push(APP_ROUTES.INVENTORY);
      } else {
        setErrorMessage(result.error || 'Failed to save inventory batch details.');
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  const handleDelete = async () => {
    if (!initialData) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete batch ${initialData.batchNumber}? This record will be archived.`
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

  const handleCancel = () => {
    router.push(APP_ROUTES.INVENTORY);
  };

  // Dynamic Batch Calculations
  const receivedNum = typeof formData.initialQty === 'number' ? formData.initialQty : 0;
  const unitCostNum = typeof formData.unitCostPrice === 'number' ? formData.unitCostPrice : 0;
  const damagedNum = typeof formData.mortalityQty === 'number' ? formData.mortalityQty : 0;
  const readyStockNum = typeof formData.currentQty === 'number' ? formData.currentQty : Math.max(0, receivedNum - damagedNum);

  const totalInvestment = receivedNum * unitCostNum;
  const damagedLossAmount = damagedNum * unitCostNum;

  const hasCostData = typeof formData.unitCostPrice === 'number' && formData.unitCostPrice > 0;
  const hasQuantityData = typeof formData.initialQty === 'number' && formData.initialQty > 0;

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer} noValidate>
      {/* Top Error Alert Banner */}
      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Compact Restrained Card */}
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'edit' ? 'Edit Sapling Batch' : 'Log New Sapling Batch'}
          </h2>
          <p className={styles.description}>
            {mode === 'edit'
              ? 'Update stock counts, unit purchase cost, mortality audits, and arrival dates.'
              : 'Register a new nursery sapling consignment or internal propagation lot.'}
          </p>
        </div>

        {/* Clean, Compact 2-Column Grid */}
        <div className={styles.grid2}>
          {/* ROW 1: [ Batch Code / Number (Disabled, Auto-generated) ] | [ Purchase / Arrival Date ] */}
          <Input
            label="Batch Code / Number"
            placeholder="Auto-generated batch number"
            value={formData.batchNumber}
            onChange={(e) => handleChange('batchNumber', e.target.value)}
            errorMessage={fieldErrors.batchNumber?.[0]}
            disabled
            helperText="Auto-generated unique batch tracking identifier"
            className={styles.disabledBatchInput}
          />

          <Input
            label="Purchase / Arrival Date"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => handleChange('purchaseDate', e.target.value)}
            errorMessage={fieldErrors.purchaseDate?.[0]}
            required
            prefixIcon={<Calendar size={18} />}
          />

          {/* ROW 2: [ Plant Cultivar / Variety ] | [ Supplying Vendor (Optional) ] */}
          <SearchableSelect
            label="Plant Cultivar / Variety"
            options={plantOptions}
            value={formData.plantId}
            onChange={(val) => handleChange('plantId', val)}
            errorMessage={fieldErrors.plantId?.[0]}
            required
            placeholder="Select plant variety"
            isClearable={false}
          />

          <SearchableSelect
            label="Supplying Vendor (Optional)"
            options={vendorOptions}
            value={formData.vendorId || ''}
            onChange={(val) => handleChange('vendorId', val)}
            errorMessage={fieldErrors.vendorId?.[0]}
            placeholder="Select supplier (optional)"
          />

          {/* ROW 3: [ Total Received Pots (एकूण आलेली झाडे) ] | [ Unit Purchase Cost (₹ per pot) ] */}
          <Input
            label="Total Received Pots (एकूण आलेली झाडे)"
            type="number"
            step="1"
            min="1"
            placeholder="Enter received quantity"
            value={formData.initialQty !== undefined ? formData.initialQty : ''}
            onChange={(e) => handleInitialQtyChange(e.target.value)}
            errorMessage={fieldErrors.initialQty?.[0]}
            required
          />

          <Input
            label="Unit Purchase Cost (₹ per pot)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter unit cost"
            value={formData.unitCostPrice !== undefined ? formData.unitCostPrice : ''}
            onChange={(e) => handleUnitCostChange(e.target.value)}
            errorMessage={fieldErrors.unitCostPrice?.[0]}
            prefixIcon={<span>₹</span>}
          />

          {/* ROW 4: [ Damaged / Dead Pots (खराब / वाळलेली झाडे) ] | [ Ready to Sell Stock (विक्रीसाठी तयार झाडे) ] */}
          <Input
            label="Damaged / Dead Pots (खराब / वाळलेली झाडे)"
            type="number"
            step="1"
            min="0"
            placeholder="Enter damaged quantity"
            value={formData.mortalityQty !== undefined ? formData.mortalityQty : ''}
            onChange={(e) => handleMortalityQtyChange(e.target.value)}
            errorMessage={fieldErrors.mortalityQty?.[0]}
          />

          <Input
            label="Ready to Sell Stock (विक्रीसाठी तयार झाडे)"
            type="number"
            step="1"
            min="0"
            placeholder="Enter ready stock quantity"
            value={formData.currentQty !== undefined ? formData.currentQty : ''}
            onChange={(e) => handleCurrentQtyChange(e.target.value)}
            errorMessage={fieldErrors.currentQty?.[0]}
            required
          />

          {/* ROW 5: Sleek Single-Line Horizontal Financial & Stock Summary Ribbon */}
          <div className={styles.summaryRibbon} role="status">
            <div className={styles.ribbonItem}>
              <span className={styles.ribbonLabel}>Total Investment:</span>
              <span className={styles.ribbonValue}>
                {hasCostData && hasQuantityData
                  ? `₹${totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                  : '₹0'}
              </span>
            </div>

            <span className={styles.ribbonDivider}>|</span>

            <div className={styles.ribbonItem}>
              <span className={styles.ribbonLabel}>Ready to Sell:</span>
              <span className={styles.ribbonValue}>
                {hasQuantityData ? `${readyStockNum} Pots` : '0 Pots'}
              </span>
            </div>

            <span className={styles.ribbonDivider}>|</span>

            <div className={styles.ribbonItem}>
              <span className={styles.ribbonLabel}>Damaged Loss:</span>
              <span
                className={`${styles.ribbonValue} ${
                  damagedLossAmount > 0 ? styles.ribbonLossDanger : ''
                }`}
              >
                {hasCostData && damagedNum > 0
                  ? `₹${damagedLossAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                  : '₹0'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <footer className={styles.footer}>
          {mode === 'edit' && initialData ? (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isPending}
              isLoading={isPending}
              leftIcon={<Trash2 size={16} />}
            >
              Delete Batch
            </Button>
          ) : (
            <div />
          )}

          <div className={styles.primaryActions}>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              leftIcon={<X size={16} />}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              leftIcon={<Save size={16} />}
            >
              {mode === 'edit' ? 'Save Changes' : 'Save Batch'}
            </Button>
          </div>
        </footer>
      </div>
    </form>
  );
};
