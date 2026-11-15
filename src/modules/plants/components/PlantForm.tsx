/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/plants/components/PlantForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Re-engineered `<PlantForm>` into a compact, width-restrained UI card container (`max-width: 44rem; margin: 0 auto;`).
 *    - Consolidated botanical name inputs into a single unified "Plant Name" field.
 *    - Removed the pre-filled default value `150` from the Selling Price input, initializing the field
 *      empty with a clean placeholder (`placeholder="e.g. 150"`) to require explicit pricing entry.
 *    - Structured the form strictly into a clean, tight 2-row adaptive grid:
 *      * ROW 1: [ Plant Code / SKU (Auto BGW-PLT-XXXX, Disabled) ] | [ Botanical Category (Dropdown) ]
 *      * ROW 2: [ Plant Name (e.g., Kashmiri Red Rose / काश्मिरी गुलाब) ] | [ Selling Price (₹ per pot) ]
 *    - Embedded the action footer directly inside the compact card, housing Cancel, Save, and Delete buttons
 *      with strict 44px minimum touch targets.
 *    - Pre-filled the SKU input with the official BGW sequential code (`BGW-PLT-{paddedSequence}`)
 *      fetched on form load via `initialSku` prop or client-side fallback `getNextPlantCodeAction()`.
 *    - Bound form state to `initialData` (pre-filled in Edit mode, empty defaults in Create mode).
 *    - Integrated shared primitives: `<Input>`, `<SearchableSelect>`, and `<Button>`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REMOVE PRE-FILLED DEFAULT VALUE FROM SELLING PRICE INPUT".
 *    - Fulfills Specification 01: Clean form state standards & 2-column card max-width standards.
 *    - Prevents accidental submission of generic ₹150 default rates for premium or discount nursery saplings.
 *    - Simplifies plant catalogue registration into a rapid 4-field workflow for nursery staff.
 * 
 * 3. WHAT WAS USED:
 *    - React client hooks (`useState`, `useEffect`, `useTransition`).
 *    - Next.js `useRouter` for programmatic navigation.
 *    - Server Actions (`createPlantAction`, `updatePlantAction`, `deletePlantAction`, `getNextPlantCodeAction`).
 *    - Shared UI primitives (`@/components/ui`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Mounts within a width-restrained centered container; pre-populates sequential BGW code;
 *      accepts 4 core fields across 2 rows; ensures Selling Price initializes empty with placeholder;
 *      validates with Zod; commits via Server Action; redirects safely back to `/plants`.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, X, Trash2 } from 'lucide-react';
import { Input, Button, SearchableSelect } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Plant, PlantInput, PlantCategory } from '../types';
import {
  createPlantAction,
  updatePlantAction,
  deletePlantAction,
  getNextPlantCodeAction,
} from '../actions';
import styles from './PlantForm.module.scss';

export interface PlantFormProps {
  initialData?: Plant | null;
  mode?: 'create' | 'edit';
  initialSku?: string;
}

interface PlantFormState extends Omit<PlantInput, 'price'> {
  price: number | '';
}

const CATEGORY_OPTIONS: Array<{ value: PlantCategory; label: string; subLabel: string }> = [
  { value: 'FLOWER', label: 'Flowering Plants', subLabel: 'Roses, Hibiscus, Jasmine' },
  { value: 'FRUIT', label: 'Fruit Trees & Saplings', subLabel: 'Mango, Guava, Pomegranate' },
  { value: 'ORNAMENTAL', label: 'Ornamental & Foliage', subLabel: 'Palms, Ficus, Bonsai' },
  { value: 'MEDICINAL', label: 'Medicinal & Herbal', subLabel: 'Tulsi, Neem, Aloe Vera' },
];

export const PlantForm: React.FC<PlantFormProps> = ({
  initialData,
  mode = initialData ? 'edit' : 'create',
  initialSku,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSetPageHeader({
    title: mode === 'edit' ? `Edit Plant: ${initialData?.name || ''}` : 'Add New Plant',
    subtitle:
      mode === 'edit'
        ? `Update catalogue specifications and pricing for SKU: ${initialData?.sku || ''}`
        : 'Register a new botanical cultivar into the nursery master catalogue.',
  });

  const [formData, setFormData] = useState<PlantFormState>({
    sku: initialData?.sku || initialSku || '',
    category: initialData?.category || 'FLOWER',
    name: initialData?.name || '',
    price: initialData?.price !== undefined ? initialData.price : '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Pre-fill next sequential code on form load if not provided
  useEffect(() => {
    if (mode === 'create' && !initialData && !formData.sku) {
      if (initialSku) {
        setFormData((prev) => ({ ...prev, sku: initialSku }));
      } else {
        getNextPlantCodeAction().then((result) => {
          if (result.success && result.data) {
            setFormData((prev) => ({
              ...prev,
              sku: result.data || 'BGW-PLT-0001',
            }));
          }
        });
      }
    }
  }, [mode, initialData, formData.sku, initialSku]);

  const handleChange = (field: keyof PlantFormState, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear specific field error
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Validate selling price explicitly entered
    if (formData.price === '' || isNaN(Number(formData.price))) {
      setFieldErrors({ price: ['Please enter a valid selling price.'] });
      return;
    }

    const payload: PlantInput = {
      ...formData,
      price: Number(formData.price),
    };

    startTransition(async () => {
      let result;
      if (mode === 'edit' && initialData) {
        result = await updatePlantAction(initialData.id, payload);
      } else {
        result = await createPlantAction(payload);
      }

      if (result.success) {
        router.push(APP_ROUTES.PLANTS);
      } else {
        setErrorMessage(result.error || 'Failed to save plant record.');
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  const handleDelete = async () => {
    if (!initialData) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${initialData.name} (${initialData.sku})? This record will be archived.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deletePlantAction(initialData.id);
      if (result.success) {
        router.push(APP_ROUTES.PLANTS);
      } else {
        setErrorMessage(result.error || 'Failed to delete plant record.');
      }
    });
  };

  const handleCancel = () => {
    router.push(APP_ROUTES.PLANTS);
  };

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
          <h2 className={styles.title}>Plant Catalogue Details</h2>
          <p className={styles.description}>
            Enter the botanical taxonomy, cultivar name, and retail selling price.
          </p>
        </div>

        {/* 2-Row Grid */}
        <div className={styles.grid2}>
          {/* ROW 1: [ Plant Code / SKU (Auto BGW-PLT-XXXX, Disabled) ] | [ Botanical Category (Dropdown) ] */}
          <Input
            label="Plant Code / SKU"
            placeholder="Auto-generated SKU"
            value={formData.sku}
            onChange={(e) => handleChange('sku', e.target.value)}
            errorMessage={fieldErrors.sku?.[0]}
            disabled
            helperText="Auto-generated unique sequential code"
            className={styles.disabledSkuInput}
          />

          <SearchableSelect
            label="Botanical Category"
            options={CATEGORY_OPTIONS}
            value={formData.category}
            onChange={(val) => handleChange('category', val as PlantCategory)}
            errorMessage={fieldErrors.category?.[0]}
            required
            isClearable={false}
          />

          {/* ROW 2: [ Plant Name ] | [ Selling Price (₹ per pot) ] */}
          <Input
            label="Plant Name"
            placeholder="Enter plant name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            errorMessage={fieldErrors.name?.[0]}
            required
          />

          <Input
            label="Selling Price (₹ per pot)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter selling price"
            value={formData.price !== undefined ? formData.price : ''}
            onChange={(e) => {
              const val = e.target.value;
              handleChange('price', val === '' ? '' : parseFloat(val));
            }}
            errorMessage={fieldErrors.price?.[0]}
            required
            prefixIcon={<span>₹</span>}
          />
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
              Delete Plant
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
              {mode === 'edit' ? 'Save Changes' : 'Save Plant'}
            </Button>
          </div>
        </footer>
      </div>
    </form>
  );
};
