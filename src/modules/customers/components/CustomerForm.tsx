/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/customers/components/CustomerForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Re-engineered `<CustomerForm>` into a compact, width-restrained UI card container (`max-width: 44rem; margin: 0 auto;`).
 *    - Strictly enforced 10-digit numeric mobile validation (strips non-digits, caps at 10 digits).
 *    - Structured customer identity and contact fields into a tight 2x2 grid identical to Supplier (Vendor) Form:
 *      * ROW 1: [ Customer Full Name ] | [ Mobile Number (10 Digits) ]
 *      * ROW 2: [ Residential / Site Address ] | [ Outstanding Udhar (Credit) Balance (₹) ]
 *    - Consolidated disjointed cards into a single cohesive card surface with integrated action controls in the footer.
 *    - Standardized all input placeholders to direct, concise action prompts without redundant captions.
 *    - Maintained 44px minimum touch targets and mobile-first PWA responsiveness.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "compact thid as we did for supplier".
 *    - Fulfills Specification 01: Clean, centered card UI standards & max-width constraints.
 *    - Eliminates excessive widescreen stretching and delivers a fast, ergonomic customer entry experience.
 * 
 * 3. WHAT WAS USED:
 *    - React client hooks (`useState`, `useTransition`).
 *    - Next.js `useRouter`.
 *    - Server Actions (`createCustomerAction`, `updateCustomerAction`, `deleteCustomerAction`).
 *    - Shared UI primitives (`@/components/ui`: `<Input>`, `<Button>`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Mounts within a width-restrained centered card;
 *      presents 4 core customer fields across a tight 2x2 grid;
 *      validates with Zod via Server Actions; redirects back to `/customers` on completion.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, X, Trash2, Phone, MapPin } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Customer, CustomerInput } from '../types';
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from '../actions';
import styles from './CustomerForm.module.scss';

export interface CustomerFormProps {
  initialData?: Customer | null;
  mode?: 'create' | 'edit';
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  mode = initialData ? 'edit' : 'create',
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSetPageHeader({
    title: mode === 'edit' ? `Edit Customer: ${initialData?.name || ''}` : 'Add New Customer',
    subtitle:
      mode === 'edit'
        ? `Update contact details and credit ledger for: ${initialData?.phone || ''}`
        : 'Register a new retail or landscaping customer in the Kolhapur directory.',
  });

  const [formData, setFormData] = useState<CustomerInput>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    totalUdharDue: initialData?.totalUdharDue ?? 0.0,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleChange = (field: keyof CustomerInput, value: string | number) => {
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
        result = await updateCustomerAction(initialData.id, formData);
      } else {
        result = await createCustomerAction(formData);
      }

      if (result.success) {
        router.push(APP_ROUTES.CUSTOMERS);
      } else {
        setErrorMessage(result.error || 'Failed to save customer details.');
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
      const result = await deleteCustomerAction(initialData.id);
      if (result.success) {
        router.push(APP_ROUTES.CUSTOMERS);
      } else {
        setErrorMessage(result.error || 'Failed to archive customer record.');
      }
    });
  };

  const handleCancel = () => {
    router.push(APP_ROUTES.CUSTOMERS);
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
            {mode === 'edit' ? 'Edit Customer Details' : 'Customer & Contact Identity'}
          </h2>
          <p className={styles.description}>
            {mode === 'edit'
              ? 'Update retail or landscaping client details and Udhar credit ledger.'
              : 'Enter customer full name, verified mobile number, and address.'}
          </p>
        </div>

        {/* Tight 2x2 Grid */}
        <div className={styles.grid2}>
          {/* ROW 1: [ Customer Full Name ] | [ Mobile Number (10 Digits) ] */}
          <Input
            label="Customer Full Name"
            placeholder="Enter customer full name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            errorMessage={fieldErrors.name?.[0]}
            required
          />

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

          {/* ROW 2: [ Residential / Site Address ] | [ Outstanding Udhar (Credit) Balance (₹) ] */}
          <Input
            label="Residential / Site Address"
            placeholder="Enter site or residential address"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            errorMessage={fieldErrors.address?.[0]}
            prefixIcon={<MapPin size={18} />}
          />

          <Input
            label="Outstanding Udhar (Credit) Balance (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.totalUdharDue}
            onChange={(e) => handleChange('totalUdharDue', parseFloat(e.target.value) || 0)}
            errorMessage={fieldErrors.totalUdharDue?.[0]}
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
              Delete Customer
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
              {mode === 'edit' ? 'Save Changes' : 'Save Customer'}
            </Button>
          </div>
        </footer>
      </div>
    </form>
  );
};
