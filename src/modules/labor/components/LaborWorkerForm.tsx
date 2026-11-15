/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/labor/components/LaborWorkerForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<LaborWorkerForm>`, the single reusable full-screen interface for registering
 *      and updating staff profiles and counter cashier credentials.
 *    - Strictly enforced 10-digit numeric mobile validation (strips non-digits, caps at 10 digits).
 *    - Replaced all "e.g." placeholders with direct, clean action prompts ("Enter full name", "Enter mobile number", etc.).
 *    - Removed redundant helper captions beneath input fields to establish clean, compact form ergonomics.
 *    - Supported dual modes (`create` vs `edit`) via `initialData` hydration.
 *    - Implemented credentials provisioning: Full Name, Mobile Contact, POS Login Username,
 *      and Password (with interactive show/hide eye toggle).
 *    - Removed operational role and wage compensation section per management workflow update.
 *    - Applied enterprise minimalist underline inputs and plain English buttons ("Save Employee", "Cancel").
 *    - Enforced client-side validation, server action mutation, and programmatic redirect to `APP_ROUTES.LABOR`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Single Reusable Form", "Strict Dedicated Full-Screen Routes", "Zero Modals/Popups".
 *    - Allows nursery management in Kolhapur to configure login accounts for counter cashiers and staff
 *      on mobile and tablet screens.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 client hooks (`useState`, `useTransition`).
 *    - Next.js `useRouter`.
 *    - Shared UI primitives (`@/components/ui/` -> `Input`, `Button`).
 *    - Lucide React icons (`UserCheck`, `CheckCircle2`, `X`, `AlertCircle`, `Eye`, `EyeOff`, `Lock`, `Phone`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Submits sanitized payload to `createEmployeeAction` or `updateEmployeeAction`, redirecting to `/labor` upon success.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Phone,
} from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  Employee,
  EmployeeInput,
} from '../types';
import { createEmployeeAction, updateEmployeeAction } from '../actions';
import styles from './LaborWorkerForm.module.scss';

export interface LaborWorkerFormProps {
  mode: 'create' | 'edit';
  initialData?: Employee | null;
}

export const LaborWorkerForm: React.FC<LaborWorkerFormProps> = ({
  mode,
  initialData,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSetPageHeader({
    title: mode === 'create' ? 'Register New Staff / Worker' : 'Edit Employee Profile',
    subtitle: mode === 'create'
      ? 'Provision staff profile and POS counter login credentials.'
      : `Modify staff profile and credentials for ${initialData?.name || ''}.`,
  });

  // Form Field States
  const [fullName, setFullName] = useState(() => initialData?.name || '');
  const [username, setUsername] = useState(() => initialData?.username || '');
  const [password, setPassword] = useState(() => initialData?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(() => initialData?.phone || '');

  // Errors
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (phone.length < 10) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: ['Mobile number must be exactly 10 digits.'],
      }));
      return;
    }

    const payload: EmployeeInput = {
      fullName,
      username: username || '',
      password: password || '',
      phone,
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createEmployeeAction(payload)
          : await updateEmployeeAction(initialData!.id, payload);

      if (result.success) {
        router.push(APP_ROUTES.LABOR);
      } else {
        setErrorMessage(result.error || 'Failed to save employee profile.');
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as Record<string, string[]>);
        }
      }
    });
  };

  const handleCancel = () => {
    router.push(APP_ROUTES.LABOR);
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

      {/* Staff Identity & POS Credentials */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Personal Identity & POS Credentials</h2>
          <p className={styles.sectionDescription}>
            Enter worker legal name, mobile contact, and provision user login for ERP and billing counters.
          </p>
        </div>

        <div className={styles.grid2}>
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            errorMessage={fieldErrors.fullName?.[0]}
            required
            placeholder="Enter full name"
          />

          <Input
            label="Mobile Phone Number"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              setPhone(digits);
              if (fieldErrors.phone) {
                setFieldErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.phone;
                  return updated;
                });
              }
            }}
            errorMessage={fieldErrors.phone?.[0]}
            prefixIcon={<Phone size={14} />}
            required
            placeholder="Enter mobile number"
          />

          <Input
            label="POS Login Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            errorMessage={fieldErrors.username?.[0]}
            required
            placeholder="Enter username"
          />

          <Input
            label="Password / PIN"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errorMessage={fieldErrors.password?.[0]}
            prefixIcon={<Lock size={14} />}
            suffixIcon={
              <button
                type="button"
                className={styles.passwordToggleBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            required
            placeholder="Enter password or PIN"
          />
        </div>
      </section>

      {/* Bottom Sticky Action Controls */}
      <footer className={styles.actionsBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1B4D3E', fontWeight: 600, fontSize: '0.875rem' }}>
          <UserCheck size={16} />
          <span>{mode === 'create' ? 'New Employee Provisioning' : `Editing ${fullName}`}</span>
        </div>

        <div className={styles.primaryButtonGroup}>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            leftIcon={<X size={15} />}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
            leftIcon={<CheckCircle2 size={15} />}
          >
            Save Employee
          </Button>
        </div>
      </footer>
    </form>
  );
};
