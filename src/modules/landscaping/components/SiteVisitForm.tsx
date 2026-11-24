/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/landscaping/components/SiteVisitForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<SiteVisitForm>` for logging Landscaping & Routine Garden Maintenance visits.
 *    - Integrated 1-click auto-fill from active Landscaping Project Contracts (Site Address,
 *      Client Name, 10-digit Customer Phone).
 *    - Strictly enforced 10-digit Indian numeric validation on manual phone entry.
 *    - Provided quick-select maintenance task chips (Pruning, Organic Pest Spray, Irrigation Check,
 *      Fertilizing, Soil Conditioning, Lawn Mowing, Weeding & Cleaning) alongside custom notes,
 *      automatically synthesizing a clean, human-readable `workDone` summary.
 *    - Added interactive Site Status selector (`Healthy`, `Minor Replacements Needed`, `Attention Required`)
 *      with conditional replacement sapling inputs.
 *    - Maintained zero "e.g." placeholders across all input slots for clean, production-grade UX.
 *    - Mounted `<SiteVisitSuccessModal>` post-submission with pre-filled WhatsApp click-to-chat dispatch.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT SITE VISIT & MAINTENANCE WHATSAPP UPDATE".
 *    - Delivers an intuitive mobile-friendly inspection workflow for field supervisors at Kolhapur sites.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 hooks (`useState`, `useTransition`, `useMemo`).
 *    - Lucide React icons (`Sprout`, `Calendar`, `MapPin`, `User`, `Phone`, `CheckCircle2`, `AlertCircle`, `X`, `Send`).
 *    - Shared UI primitives (`@/components/ui`: `<Input>`, `<SearchableSelect>`, `<Button>`).
 *    - Server Action `createSiteVisitAction`.
 *    - Success modal `<SiteVisitSuccessModal>`.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  Calendar,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Check,
  Clock,
} from 'lucide-react';
import { Input, Button, SearchableSelect } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  SiteVisit,
  SiteStatusType,
  WORK_DONE_TAGS,
  WorkDoneTag,
  SITE_STATUSES,
} from '../types';
import { createSiteVisitAction } from '../actions';
import { SiteVisitSuccessModal } from './SiteVisitSuccessModal';
import styles from './SiteVisitForm.module.scss';

export interface LinkedContractOption {
  id: string;
  contractNo: string;
  siteAddress: string;
  projectType: string;
  customer: {
    name: string;
    phone: string;
  };
}

export interface SiteVisitFormProps {
  contracts?: LinkedContractOption[];
  initialContractId?: string;
}

export const SiteVisitForm: React.FC<SiteVisitFormProps> = ({
  contracts = [],
  initialContractId,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSetPageHeader({
    title: 'Log Landscaping Site Visit',
    subtitle: 'Record routine garden maintenance, check plant health, and send WhatsApp updates.',
  });

  // Find pre-selected contract if provided
  const initialContract = useMemo(
    () => contracts.find((c) => c.id === initialContractId),
    [contracts, initialContractId]
  );

  // Form State
  const [contractId, setContractId] = useState<string>(initialContract?.id || '');
  const [siteName, setSiteName] = useState<string>(initialContract?.siteAddress || '');
  const [customerName, setCustomerName] = useState<string>(initialContract?.customer.name || '');
  const [customerMobile, setCustomerMobile] = useState<string>(initialContract?.customer.phone || '');

  // Defaults to today's date formatted as YYYY-MM-DD
  const todayFormatted = useMemo(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }, []);

  const [visitDate, setVisitDate] = useState<string>(todayFormatted);
  const [areasChecked, setAreasChecked] = useState<string>('');

  // Quick-select work done tags & additional notes
  const [selectedTags, setSelectedTags] = useState<WorkDoneTag[]>([
    'Pruning',
    'Organic Pest Spray',
  ]);
  const [extraWorkNotes, setExtraWorkNotes] = useState<string>('');

  // Site health status & replacements
  const [siteStatus, setSiteStatus] = useState<SiteStatusType>('Healthy');
  const [replacementCount, setReplacementCount] = useState<number | ''>('');
  const [replacementNotes, setReplacementNotes] = useState<string>('');

  // Next visit & internal notes
  const [nextVisitDate, setNextVisitDate] = useState<string>('');
  const [supervisorNotes, setSupervisorNotes] = useState<string>('');

  // Post-save modal state
  const [savedVisit, setSavedVisit] = useState<SiteVisit | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Validation & Error states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Contract selector options
  const contractOptions = useMemo(
    () => [
      { value: '', label: 'Ad-hoc / Unlinked Site Location' },
      ...contracts.map((c) => ({
        value: c.id,
        label: `${c.contractNo} — ${c.siteAddress}`,
        subLabel: `${c.customer.name} (${c.customer.phone}) • ${c.projectType}`,
      })),
    ],
    [contracts]
  );

  // Auto-fill fields when contract selection changes
  const handleContractChange = (val: string) => {
    setContractId(val);
    const selected = contracts.find((c) => c.id === val);
    if (selected) {
      setSiteName(selected.siteAddress);
      setCustomerName(selected.customer.name);
      setCustomerMobile(selected.customer.phone);
    }
  };

  // Toggle work tags
  const toggleTag = (tag: WorkDoneTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Computed unified work done description
  const combinedWorkDone = useMemo(() => {
    const parts: string[] = [];
    if (selectedTags.length > 0) {
      parts.push(selectedTags.join(', '));
    }
    if (extraWorkNotes.trim()) {
      parts.push(extraWorkNotes.trim());
    }
    return parts.join('. ') || 'Routine inspection and maintenance';
  }, [selectedTags, extraWorkNotes]);

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side validations
    const errors: Record<string, string[]> = {};
    if (!siteName.trim()) {
      errors.siteName = ['Please enter the site or project location.'];
    }
    if (!customerName.trim()) {
      errors.customerName = ['Please enter the customer name.'];
    }
    const cleanPhone = customerMobile.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.customerMobile = ['Customer mobile must be exactly 10 digits.'];
    }
    if (!areasChecked.trim()) {
      errors.areasChecked = ['Please specify the garden areas or plant varieties checked.'];
    }
    if (selectedTags.length === 0 && !extraWorkNotes.trim()) {
      errors.workDone = ['Please select at least one maintenance task or enter notes.'];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage('Please correct the highlighted fields before submitting.');
      return;
    }

    startTransition(async () => {
      const payload = {
        contractId: contractId || null,
        siteName: siteName.trim(),
        customerName: customerName.trim(),
        customerMobile: cleanPhone,
        visitDate,
        areasChecked: areasChecked.trim(),
        workDone: combinedWorkDone,
        siteStatus,
        replacementCount: Number(replacementCount) || 0,
        replacementNotes: replacementNotes.trim() || null,
        nextVisitDate: nextVisitDate.trim() || null,
        supervisorNotes: supervisorNotes.trim() || null,
      };

      const result = await createSiteVisitAction(payload);
      if (result.success && result.data) {
        setSavedVisit(result.data);
        setIsSuccessModalOpen(true);
      } else {
        setErrorMessage(result.error || 'Failed to record site visit.');
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as Record<string, string[]>);
        }
      }
    });
  };

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    setSavedVisit(null);
    router.push(APP_ROUTES.CONTRACTS_SITE_VISITS);
  };

  const handleLogAnother = () => {
    setIsSuccessModalOpen(false);
    setSavedVisit(null);
    setAreasChecked('');
    setExtraWorkNotes('');
    setReplacementNotes('');
    setReplacementCount('');
    setSupervisorNotes('');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.formContainer} noValidate>
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Site Location & Customer Profile */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <MapPin size={16} />
              <span>Site & Client Information</span>
            </h2>
          </div>

          <div className={styles.grid1}>
            <SearchableSelect
              label="Linked Landscaping Project (Optional Auto-fill)"
              options={contractOptions}
              value={contractId}
              onChange={handleContractChange}
              placeholder="Search by contract number, site address, or client name"
              isClearable={true}
              helperText="Selecting a project contract automatically fills site address, customer name, and contact."
            />
          </div>

          <div className={styles.grid3}>
            <Input
              label="Site / Project Name"
              placeholder="Enter site or project address"
              value={siteName}
              onChange={(e) => {
                setSiteName(e.target.value);
                if (fieldErrors.siteName) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.siteName;
                    return next;
                  });
                }
              }}
              errorMessage={fieldErrors.siteName?.[0]}
              prefixIcon={<MapPin size={14} />}
              required
            />

            <Input
              label="Customer Name"
              placeholder="Enter client or owner name"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (fieldErrors.customerName) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.customerName;
                    return next;
                  });
                }
              }}
              errorMessage={fieldErrors.customerName?.[0]}
              prefixIcon={<User size={14} />}
              required
            />

            <Input
              label="Customer Mobile (10-Digit)"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter 10-digit mobile number"
              value={customerMobile}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setCustomerMobile(digits);
                if (fieldErrors.customerMobile) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.customerMobile;
                    return next;
                  });
                }
              }}
              onFocus={(e) => e.currentTarget.select()}
              errorMessage={fieldErrors.customerMobile?.[0]}
              prefixIcon={<Phone size={14} />}
              required
            />
          </div>
        </section>

        {/* Section 2: Visit Timing & Maintenance Work Done */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Sprout size={16} />
              <span>Inspection & Maintenance Completed</span>
            </h2>
          </div>

          <div className={styles.grid2}>
            <Input
              type="date"
              label="Visit Date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              errorMessage={fieldErrors.visitDate?.[0]}
              prefixIcon={<Calendar size={14} />}
              required
            />

            <Input
              label="Area / Plants Checked"
              placeholder="Lawn perimeter, hedge line, ornamental palms"
              value={areasChecked}
              onChange={(e) => {
                setAreasChecked(e.target.value);
                if (fieldErrors.areasChecked) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.areasChecked;
                    return next;
                  });
                }
              }}
              errorMessage={fieldErrors.areasChecked?.[0]}
              required
            />
          </div>

          {/* Quick-Select Work Done Checkbox Chips */}
          <div className={styles.checkboxesGroup}>
            <div className={styles.groupLabel}>
              <span>Work Done (Quick Select)</span>
              <span style={{ fontSize: '0.6875rem', color: '#6B7280', fontWeight: 'normal' }}>
                Tap tasks to toggle
              </span>
            </div>
            <div className={styles.tagsContainer}>
              {WORK_DONE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.tagChip} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={isSelected}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Work Done Notes */}
          <div className={styles.fieldWrapper}>
            <label className={styles.fieldLabel}>Additional Work Notes & Observations</label>
            <textarea
              className={styles.textareaControl}
              rows={2}
              placeholder="Additional maintenance details or observations"
              value={extraWorkNotes}
              onChange={(e) => setExtraWorkNotes(e.target.value)}
            />
          </div>

          {/* Live Preview of Work Done */}
          <div className={styles.liveSummaryCard}>
            <span className={styles.liveSummaryTitle}>Live Message Summary:</span>
            <p className={styles.liveSummaryText}>{combinedWorkDone}</p>
          </div>
        </section>

        {/* Section 3: Site Health Status & Next Visit Scheduling */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Clock size={16} />
              <span>Site Status & Next Visit Schedule</span>
            </h2>
          </div>

          {/* Site Status Selector */}
          <div className={styles.fieldWrapper}>
            <label className={styles.fieldLabel}>Site Health Status</label>
            <div className={styles.statusSelectorRow}>
              {SITE_STATUSES.map((st) => {
                const isActive = siteStatus === st;
                const activeClass =
                  st === 'Healthy'
                    ? styles.activeHealthy
                    : st === 'Minor Replacements Needed'
                    ? styles.activeMinor
                    : styles.activeAttention;

                return (
                  <button
                    key={st}
                    type="button"
                    className={`${styles.statusOption} ${isActive ? activeClass : ''}`}
                    onClick={() => setSiteStatus(st)}
                  >
                    {isActive && <CheckCircle2 size={14} />}
                    <span>{st}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Replacement Inputs */}
          {siteStatus !== 'Healthy' && (
            <div className={styles.grid2}>
              <Input
                label="Replacement Notes"
                placeholder="Specify replacement saplings or plants required"
                value={replacementNotes}
                onChange={(e) => setReplacementNotes(e.target.value)}
                helperText="Appends to the Site Status line in the WhatsApp message."
              />

              <Input
                type="number"
                min="0"
                step="1"
                label="Estimated Replacement Pots / Saplings"
                placeholder="0"
                value={replacementCount}
                onChange={(e) => {
                  const val = e.target.value;
                  setReplacementCount(val === '' ? '' : parseInt(val, 10) || 0);
                }}
                onFocus={(e) => e.currentTarget.select()}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
          )}

          <div className={styles.grid2}>
            <Input
              type="date"
              label="Next Scheduled Visit Date (Optional)"
              value={nextVisitDate}
              onChange={(e) => setNextVisitDate(e.target.value)}
              prefixIcon={<Calendar size={14} />}
              helperText="Formats as 'As scheduled' on WhatsApp when left blank."
            />

            <Input
              label="Internal Supervisor Notes (Private)"
              placeholder="Internal supervisor notes"
              value={supervisorNotes}
              onChange={(e) => setSupervisorNotes(e.target.value)}
              helperText="Saved to database for internal audit only (not sent to client)."
            />
          </div>
        </section>

        {/* Section 4: Action Footer */}
        <footer className={styles.actionsBar}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(APP_ROUTES.CONTRACTS_SITE_VISITS)}
            disabled={isPending}
            leftIcon={<X size={14} />}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isPending}
            leftIcon={<Send size={14} />}
          >
            Save & Share WhatsApp Update
          </Button>
        </footer>
      </form>

      {/* Post-Save WhatsApp Dispatch Modal */}
      <SiteVisitSuccessModal
        visit={savedVisit}
        isOpen={isSuccessModalOpen}
        onClose={handleCloseModal}
        onNewVisit={handleLogAnother}
      />
    </>
  );
};

