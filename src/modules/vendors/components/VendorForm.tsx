/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/vendors/components/VendorForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Re-engineered `<VendorForm>` into a compact, width-restrained UI card container (`max-width: 44rem; margin: 0 auto;`).
 *    - Strictly enforced 10-digit numeric mobile validation (strips non-digits, caps at 10 digits).
 *    - Structured the fields into a tight 2x2 grid:
 *      * ROW 1: [ Vendor / Business Name ] | [ Contact Person Name ]
 *      * ROW 2: [ Mobile Number (10 Digits) ] | [ Procurement Category ]
 *    - Removed redundant helper text and unnecessary wide padding for a clean, unified aesthetic identical to Plant Master.
 *    - Integrated action controls ("Cancel", "Save Vendor", and "Delete Vendor" for edit mode) cleanly inside the card footer.
 *    - Preserved 44px minimum touch targets and mobile-first PWA responsiveness.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REDESIGN VENDOR FORM WITH COMPACT UI AND RESTRAINED CARD WIDTH".
 *    - Fulfills Specification 01: Clean, centered card UI standards & max-width constraints.
 *    - Eliminates excessive widescreen stretching and delivers a fast, ergonomic supplier entry experience.
 * 
 * 3. WHAT WAS USED:
 *    - React client hooks (`useState`, `useTransition`).
 *    - Next.js `useRouter`.
 *    - Server Actions (`createVendorAction`, `updateVendorAction`, `deleteVendorAction`).
 *    - Shared UI primitives (`@/components/ui`: `<Input>`, `<SearchableSelect>`, `<Button>`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Mounts within a width-restrained centered card;
 *      presents 4 core supplier fields across a tight 2x2 grid;
 *      validates with Zod via Server Actions; redirects back to `/vendors` on completion.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, X, Trash2, Phone, UserCheck } from 'lucide-react';
import { Input, Button, SearchableSelect } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Vendor, VendorInput } from '../types';
import {
  createVendorAction,
  updateVendorAction,
  deleteVendorAction,
} from '../actions';
import styles from './VendorForm.module.scss';

export interface VendorFormProps {
  initialData?: Vendor | null;
  mode?: 'create' | 'edit';
}

const CATEGORY_OPTIONS = [
  { value: 'SEEDS_SAPLINGS', label: 'Seeds & Live Saplings', subLabel: 'Grafted fruit plants, rose cuttings' },
  { value: 'POTS_CONTAINERS', label: 'Clay & Plastic Pots', subLabel: 'Ceramic, terracotta, grow bags' },
  { value: 'FERTILIZERS_SOIL', label: 'Fertilizers & Soil Mixes', subLabel: 'Organic vermicompost, red soil, cocopeat' },
  { value: 'IRRIGATION_DRIP', label: 'Irrigation & Drip Systems', subLabel: 'Pipes, drippers, sprinklers, pumps' },
  { value: 'GARDEN_TOOLS_MACHINERY', label: 'Garden Tools & Machinery', subLabel: 'Lawn mowers, shears, sprayers' },
];

export const VendorForm: React.FC<VendorFormProps> = ({
  initialData,
  mode = initialData ? 'edit' : 'create',
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSetPageHeader({
    title: mode === 'edit' ? `Edit Vendor: ${initialData?.name || ''}` : 'Add New Vendor',
    subtitle:
      mode === 'edit'
        ? `Update supplier contact and procurement category for: ${initialData?.phone || ''}`
        : 'Register a wholesale nursery supplier or equipment vendor.',
  });

  const [formData, setFormData] = useState<VendorInput>({
    name: initialData?.name || '',
    contactPerson: initialData?.contactPerson || '',
    phone: initialData?.phone || '',
    category: initialData?.category || 'SEEDS_SAPLINGS',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleChange = (field: keyof VendorInput, value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (formData.phone.length < 10) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: ['Mobile number must be exactly 10 digits.'],
      }));
      return;
    }

    startTransition(async () => {
      let result;
      if (mode === 'edit' && initialData) {
        result = await updateVendorAction(initialData.id, formData);
      } else {
        result = await createVendorAction(formData);
      }

      if (result.success) {
        router.push(APP_ROUTES.VENDORS);
      } else {
        setErrorMessage(result.error || 'Failed to save vendor details.');
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  const handleDelete = async () => {
    if (!initialData) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${initialData.name} (${initialData.phone})? This record will be archived.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteVendorAction(initialData.id);
      if (result.success) {
        router.push(APP_ROUTES.VENDORS);
      } else {
        setErrorMessage(result.error || 'Failed to archive vendor record.');
      }
    });
  };

  const handleCancel = () => {
    router.push(APP_ROUTES.VENDORS);
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
          <h2 className={styles.title}>
            {mode === 'edit' ? 'Edit Vendor Details' : 'Supplier & Business Identity'}
          </h2>
          <p className={styles.description}>
            {mode === 'edit'
              ? 'Update wholesale supplier contact information and procurement category.'
              : 'Enter wholesale business name, designated representative, and verified mobile number.'}
          </p>
        </div>

        {/* Tight 2x2 Grid */}
        <div className={styles.grid2}>
          {/* ROW 1: [ Vendor / Business Name ] | [ Contact Person Name ] */}
          <Input
            label="Vendor / Business Name"
            placeholder="Enter vendor or business name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            errorMessage={fieldErrors.name?.[0]}
            required
          />

          <Input
            label="Contact Person Name"
            placeholder="Enter contact person name"
            value={formData.contactPerson || ''}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
            errorMessage={fieldErrors.contactPerson?.[0]}
            prefixIcon={<UserCheck size={18} />}
          />

          {/* ROW 2: [ Mobile Number (10 Digits) ] | [ Procurement Category ] */}
          <Input
            label="Mobile Number (10 Digits)"
            placeholder="Enter mobile number"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={formData.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              handleChange('phone', digits);
            }}
            errorMessage={fieldErrors.phone?.[0]}
            required
            prefixIcon={<Phone size={18} />}
          />

          <SearchableSelect
            label="Procurement Category"
            options={CATEGORY_OPTIONS}
            value={formData.category}
            onChange={(val) => handleChange('category', val)}
            errorMessage={fieldErrors.category?.[0]}
            required
            isClearable={false}
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
              Delete Vendor
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
              {mode === 'edit' ? 'Save Changes' : 'Save Vendor'}
            </Button>
          </div>
        </footer>
      </div>
    </form>
  );
};
