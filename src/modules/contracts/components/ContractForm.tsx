/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/components/ContractForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<ContractForm>`, the single reusable full-screen interface for registering
 *      and editing Landscaping Projects & Garden Contracts.
 *    - Strictly enforced 10-digit numeric mobile validation (strips non-digits, caps at 10 digits).
 *    - Standardized all input placeholders to direct, concise action prompts ("Auto-generated contract code",
 *      "Enter site address and location", "Enter client full name", etc.) and purged redundant helper text.
 *    - Implemented bidirectional live calculation for `Total Project Estimate (₹)`:
 *      * Computes Total Estimate live in real time (`Plot Area × Price per Sq. Ft.`) whenever
 *        either `plotSize` or `pricePerSqFt` changes, eliminating the stale condition lock.
 *      * Dynamically syncs `balanceDue` (`totalEstimate - advanceReceived`).
 *    - Streamlined Section 2 "Project Specifications":
 *      * Removed "Current Execution Stage" and "Progress Percentage (%)" from initial form UI.
 *      * Arranged the 3 remaining specifications (Project Classification, Plot Area / Lawn Dimension,
 *        and Price per Sq. Ft.) into a single compact line (`.grid3`).
 *      * Preserved backend state defaults (`currentStage: 'SITE_PREP'`, `progressPercent: 0`) in the payload.
 *    - Added double-submission guard (`useRef(false)`) to protect against duplicate POST requests.
 *    - Integrated Customer Directory auto-binding with auto-registration of walk-in/new clients:
 *      * When a registered customer is selected, binds and locks Name and Phone number.
 *      * When "Walk-in / New Customer" is selected, exposes clean inputs for Name and Mobile
 *        that automatically register into the Customer Master on save.
 *    - Added "Price per Sq. Ft. (₹)" numeric input adjacent to "Plot Area / Lawn Dimension" for dynamic calculations.
 *    - Supported dual modes (`create` vs `edit`) via `initialData` hydration.
 *    - Structured sections adhering to enterprise compact card layout and adaptive grid rules:
 *      * Section 1: Client Identity & Site Location (.grid3 + walk-in fields / locked banner)
 *      * Section 2: Project Specifications (.grid3 single-row layout)
 *      * Section 3: Financial Estimates & Advances (.grid3 with live balance due)
 *      * Section 4: Site Supervisor Instructions (.singleColumn)
 *    - Handled client-side validation, server action invocation, and automatic redirection to `APP_ROUTES.CONTRACTS`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: AUTOMATE CONTRACT NUMBER GENERATION WITH BGW PREFIX IN LANDSCAPING MODULE".
 *    - Complies with Specification 01: Clean form standards & disabled auto-generated fields.
 *    - Pre-fills and locks sequential `BGW-CNT-YYYY-XXXX` code matching Plant SKU and POS Invoice styling.
 *    - Resolves estimate calculation bugs and delivers real-time bidirectional balance calculation.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 client hooks (`useState`, `useTransition`, `useMemo`, `useRef`, `useEffect`).
 *    - Next.js `useRouter`.
 *    - Shared UI primitives (`@/components/ui/` -> `Input`, `SearchableSelect`, `Button`).
 *    - Lucide React icons (`FileText`, `CheckCircle2`, `X`, `AlertCircle`, `IndianRupee`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Pre-populates auto-generated sequential `BGW-CNT-YYYY-XXXX` contract number on mount.
 *    - Collects contract specifications, locks against concurrent double-clicks, sends sanitized payload to
 *      `createContractAction` or `updateContractAction`, and safely redirects back to the contract directory.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  CheckCircle2,
  X,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';
import { Input, Button, SearchableSelect } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  GardenContract,
  Customer,
  ProjectType,
  ContractStage,
  ContractInput,
} from '../types';
import {
  createContractAction,
  updateContractAction,
  getNextContractNumberAction,
} from '../actions';
import styles from './ContractForm.module.scss';

export interface ContractFormProps {
  mode: 'create' | 'edit';
  initialData?: GardenContract | null;
  customers: Customer[];
  initialContractNo?: string;
}

const PROJECT_TYPE_OPTIONS = [
  { value: 'LAWN', label: 'Lawn & Turf Development (Natural/Bermuda)' },
  { value: 'ORCHARD', label: 'Commercial Fruit Tree Orchard' },
  { value: 'RESIDENTIAL', label: 'Residential Villa Landscaping' },
  { value: 'DRIP_IRRIGATION', label: 'Automated Drip Irrigation System' },
];

export const ContractForm: React.FC<ContractFormProps> = ({
  mode,
  initialData,
  customers,
  initialContractNo,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSetPageHeader({
    title: mode === 'create' ? 'Create New Landscaping Contract' : 'Edit Landscaping Contract',
    subtitle: mode === 'create'
      ? 'Register a new garden, turf, or irrigation project for residential or corporate clients.'
      : `Modify project specifications and milestones for contract ${initialData?.contractNo || ''}.`,
  });

  const WALK_IN_VALUE = 'WALK_IN_NEW';

  // Client Select Options
  const customerOptions = useMemo(
    () => [
      {
        value: WALK_IN_VALUE,
        label: '➕ Walk-in / New Customer (Type Details Below)',
      },
      ...customers.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.phone})`,
        subLabel: c.address ? `Address: ${c.address}` : undefined,
      })),
    ],
    [customers]
  );

  // Form Field States
  const [contractNo, setContractNo] = useState(
    () => initialData?.contractNo || initialContractNo || ''
  );
  const [customerId, setCustomerId] = useState(() => initialData?.customerId || '');
  const initialCustomer = customers.find((c) => c.id === initialData?.customerId);
  const [clientName, setClientName] = useState(() => initialCustomer?.name || '');
  const [clientPhone, setClientPhone] = useState(() => initialCustomer?.phone || '');
  const [siteAddress, setSiteAddress] = useState(() => initialData?.siteAddress || '');

  // Pre-fill next sequential code on form load if not provided
  useEffect(() => {
    if (mode === 'create' && !initialData && !contractNo) {
      if (initialContractNo) {
        setContractNo(initialContractNo);
      } else {
        getNextContractNumberAction().then((result) => {
          if (result.success && result.data) {
            setContractNo(result.data);
          }
        });
      }
    }
  }, [mode, initialData, contractNo, initialContractNo]);

  const isRegisteredCustomer = Boolean(
    customerId && customerId !== WALK_IN_VALUE
  );

  const selectedCustomer = useMemo(
    () => (isRegisteredCustomer ? customers.find((c) => c.id === customerId) : null),
    [customers, customerId, isRegisteredCustomer]
  );

  const handleCustomerChange = (val: string) => {
    setCustomerId(val);
    if (!val || val === WALK_IN_VALUE) {
      if (val === WALK_IN_VALUE) {
        setClientName('');
        setClientPhone('');
      }
      return;
    }
    const matched = customers.find((c) => c.id === val);
    if (matched) {
      setClientName(matched.name);
      setClientPhone(matched.phone);
      if (matched.address && !siteAddress) {
        setSiteAddress(matched.address);
      }
    }
  };
  const [projectType, setProjectType] = useState<ProjectType>(
    () => (initialData?.projectType as ProjectType) || 'LAWN'
  );
  const [plotSize, setPlotSize] = useState(() => initialData?.plotSize || '');
  const [pricePerSqFt, setPricePerSqFt] = useState<number | ''>('');
  const [totalEstimate, setTotalEstimate] = useState<number | ''>(
    () => (initialData?.totalEstimate !== undefined ? initialData.totalEstimate : '')
  );
  const [advanceReceived, setAdvanceReceived] = useState<number | ''>(
    () => (initialData?.advanceReceived !== undefined ? initialData.advanceReceived : 0)
  );
  const [currentStage, setCurrentStage] = useState<ContractStage>(
    () => (initialData?.currentStage as ContractStage) || 'SITE_PREP'
  );
  const [progressPercent, setProgressPercent] = useState<number>(
    () => (initialData?.progressPercent !== undefined ? initialData.progressPercent : 0)
  );
  const [supervisorNotes, setSupervisorNotes] = useState(
    () => initialData?.supervisorNotes || ''
  );

  // Error States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Synchronous submission lock
  const isSubmittingRef = useRef(false);

  // Computed Live Balance Due
  const numericEstimate = Number(totalEstimate) || 0;
  const numericAdvance = Number(advanceReceived) || 0;
  const balanceDue = Math.max(0, numericEstimate - numericAdvance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPending || isSubmittingRef.current) {
      return;
    }

    setErrorMessage(null);
    setFieldErrors({});
    isSubmittingRef.current = true;

    if (!isRegisteredCustomer && clientPhone.length < 10) {
      setFieldErrors((prev) => ({
        ...prev,
        clientPhone: ['Mobile number must be exactly 10 digits.'],
      }));
      isSubmittingRef.current = false;
      return;
    }

    const payload: ContractInput = {
      contractNo,
      customerId: isRegisteredCustomer ? customerId : WALK_IN_VALUE,
      clientName: isRegisteredCustomer ? undefined : clientName,
      clientPhone: isRegisteredCustomer ? undefined : clientPhone,
      siteAddress,
      projectType,
      plotSize,
      totalEstimate: Number(totalEstimate) || 0,
      advanceReceived: Number(advanceReceived) || 0,
      currentStage,
      progressPercent: Number(progressPercent) || 0,
      supervisorNotes: supervisorNotes || null,
    };

    startTransition(async () => {
      try {
        const result =
          mode === 'create'
            ? await createContractAction(payload)
            : await updateContractAction(initialData!.id, payload);

        if (result.success) {
          router.push(APP_ROUTES.CONTRACTS);
        } else {
          isSubmittingRef.current = false;
          setErrorMessage(result.error || 'Failed to save contract record.');
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors as Record<string, string[]>);
          }
        }
      } catch (err) {
        isSubmittingRef.current = false;
        console.error('Error submitting contract:', err);
        setErrorMessage('A network or server error occurred while saving. Please try again.');
      }
    });
  };

  const handleCancel = () => {
    router.push(APP_ROUTES.CONTRACTS);
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

      {/* Section 1: Client Identity & Site Location */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>1. Client Identity & Project Site</h2>

        </div>

        <div className={styles.grid3}>
          <Input
            label="Contract Number"
            value={contractNo}
            onChange={(e) => setContractNo(e.target.value.toUpperCase())}
            errorMessage={fieldErrors.contractNo?.[0]}
            required
            disabled
            placeholder="Auto-generated contract code"
            helperText="Auto-generated unique contract tracking code"
            className={styles.disabledCodeInput}
          />

          <SearchableSelect
            label="Select From Customer Directory"
            options={customerOptions}
            value={customerId}
            onChange={handleCustomerChange}
            errorMessage={fieldErrors.customerId?.[0]}
            placeholder="Search registered client by name or phone"
            required
            helperText={
              isRegisteredCustomer
                ? '🔒 Auto-locked from directory'
                : 'Select registered client or choose "Walk-in / New Customer".'
            }
          />

          <Input
            label="Site Address & Location"
            value={siteAddress}
            onChange={(e) => setSiteAddress(e.target.value)}
            errorMessage={fieldErrors.siteAddress?.[0]}
            required
            placeholder="Enter site address and location"
          />
        </div>

        {/* If Walk-in / New Client, expose Name and Phone fields for Master auto-registration */}
        {!isRegisteredCustomer && (
          <div className={styles.grid2}>
            <Input
              label="Client / Owner Full Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              errorMessage={fieldErrors.clientName?.[0]}
              required
              placeholder="Enter client full name"
              helperText="Auto-registered into Customer Master on contract save."
            />
            <Input
              label="Client Mobile Number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={clientPhone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setClientPhone(digits);
                if (fieldErrors.clientPhone) {
                  setFieldErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.clientPhone;
                    return updated;
                  });
                }
              }}
              errorMessage={fieldErrors.clientPhone?.[0]}
              required
              placeholder="Enter mobile number"
              helperText="10-digit phone for WhatsApp updates & master registration."
            />
          </div>
        )}

        {isRegisteredCustomer && selectedCustomer && (
          <div className={styles.lockedCustomerCard}>
            <div className={styles.lockedCustomerDetails}>
              <span className={styles.lockedCustomerName}>{selectedCustomer.name}</span>
              <span className={styles.lockedCustomerPhone}>📱 {selectedCustomer.phone}</span>
            </div>
            <span className={styles.lockedBadge}>🔒 Bound &amp; Locked from Directory</span>
          </div>
        )}
      </section>

      {/* Section 2: Project Specifications */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>2. Project Specifications</h2>
        </div>

        <div className={styles.grid3}>
          <SearchableSelect
            label="Project Classification"
            options={PROJECT_TYPE_OPTIONS}
            value={projectType}
            onChange={(val) => setProjectType(val as ProjectType)}
            errorMessage={fieldErrors.projectType?.[0]}
            required
          />

          <Input
            label="Plot Area / Lawn Dimension"
            value={plotSize}
            onChange={(e) => {
              const newPlot = e.target.value;
              setPlotSize(newPlot);
              const numericPlot = parseFloat(newPlot.replace(/[^0-9.]/g, '')) || 0;
              if (pricePerSqFt !== '' && numericPlot > 0) {
                setTotalEstimate(Number((numericPlot * Number(pricePerSqFt)).toFixed(2)));
              }
            }}
            errorMessage={fieldErrors.plotSize?.[0]}
            required
            placeholder="Enter plot area or dimensions"
          />

          <Input
            label="Price per Sq. Ft. (₹)"
            type="number"
            min="0"
            step="any"
            value={pricePerSqFt}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Number(e.target.value);
              setPricePerSqFt(val);
              const numericPlot = parseFloat(plotSize.replace(/[^0-9.]/g, '')) || 0;
              if (val !== '' && numericPlot > 0) {
                setTotalEstimate(Number((numericPlot * Number(val)).toFixed(2)));
              }
            }}
            placeholder="Enter rate per sq ft"
            helperText={
              pricePerSqFt && (parseFloat(plotSize.replace(/[^0-9.]/g, '')) || 0) > 0
                ? `Computed: ₹${((parseFloat(plotSize.replace(/[^0-9.]/g, '')) || 0) * Number(pricePerSqFt)).toLocaleString('en-IN')}`
                : ''
            }
          />
        </div>
      </section>

      {/* Section 3: Financial Estimates & Advances */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>3. Financial Estimates & Payment Terms</h2>

        </div>

        <div className={styles.grid3}>
          <Input
            label="Total Project Estimate (₹)"
            type="number"
            min="0"
            step="0.01"
            value={totalEstimate}
            onChange={(e) => setTotalEstimate(e.target.value === '' ? '' : parseFloat(e.target.value))}
            errorMessage={fieldErrors.totalEstimate?.[0]}
            prefixIcon={<span>₹</span>}
            required
            placeholder="0.00"
          />

          <Input
            label="Advance Received (₹)"
            type="number"
            min="0"
            step="0.01"
            value={advanceReceived}
            onChange={(e) => setAdvanceReceived(e.target.value === '' ? '' : parseFloat(e.target.value))}
            errorMessage={fieldErrors.advanceReceived?.[0]}
            prefixIcon={<span>₹</span>}
            required
            placeholder="0.00"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#4B5563' }}>
              Pending Balance Due
            </span>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: balanceDue > 0 ? '#DC2626' : '#16A34A',
                paddingTop: '0.25rem',
              }}
            >
              ₹{balanceDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>

          </div>
        </div>
      </section>

      {/* Section 4: Site Notes & Special Instructions */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>4. Supervisor Notes & Special Instructions</h2>
        </div>

        <div className={styles.singleColumn}>
          <Input
            label="Site Supervisor Notes"
            value={supervisorNotes}
            onChange={(e) => setSupervisorNotes(e.target.value)}
            errorMessage={fieldErrors.supervisorNotes?.[0]}
            placeholder="Enter supervisor site observations or special execution notes"
          />
        </div>
      </section>

      {/* Section 5: Bottom Sticky Action Controls */}
      <footer className={styles.actionsBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1B4D3E', fontWeight: 600, fontSize: '0.875rem' }}>
          <FileText size={16} />
          <span>{mode === 'create' ? 'New Landscaping Agreement' : `Editing ${contractNo}`}</span>
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
            Save Contract
          </Button>
        </div>
      </footer>
    </form>
  );
};
