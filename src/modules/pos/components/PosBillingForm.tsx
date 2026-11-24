/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/components/PosBillingForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Re-engineered `<PosBillingForm>` with an ultra-compact layout and aligned inline header actions.
 *    - Strictly enforced 10-digit numeric mobile validation (strips non-digits, caps at 10 digits) on walk-in customer mobile.
 *    - Moved "Scan QR / Barcode" and "+ Add Plant Item" action buttons inline directly into the header bar
 *      of the "Purchased Botanical Items" section (`styles.headerActions`), removing the bulky dedicated row.
 *    - Consolidated payment mode selectors (`Cash`, `UPI / QR`, `Udhar`) and amount inputs into a single
 *      streamlined horizontal row (`styles.paymentStreamlinedRow`, `styles.hasUpi`).
 *    - Redesigned the checkout financial totals into a sleek horizontal summary ribbon (`styles.summaryPanel`)
 *      displaying total pots, bill amount, amount received, and remaining balance due in one clean line.
 *    - Integrated automated sequential invoice generation (`BGW-INV-YYYY-XXXX`) with disabled monospace input styling.
 *    - Retained smartphone camera QR/barcode scanner with 2-second anti-bounce cooldown lock and WhatsApp e-Bill modal.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: ULTRA-COMPACT POS CASHIER SCREEN & BUTTON ALIGNMENT".
 *    - Fulfills Specification 01: Clean, compact card UI standards, restrained max-width, & cashier viewport ergonomics.
 *    - Ensures the entire checkout counter fits comfortably within 1080p desktop viewports without excess scrolling fatigue.
 *    - Delivers an intuitive, rapid cashier workflow for peak nursery checkout hours at Bharti's Green World.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 client hooks (`useState`, `useTransition`, `useMemo`, `useEffect`, `useCallback`, `useRef`).
 *    - Next.js `useRouter`.
 *    - Lucide React icons (`Receipt`, `Camera`, `Plus`, `Trash2`, `CheckCircle2`, `X`, `AlertCircle`, `Smartphone`, `Banknote`, `BookOpen`).
 *    - Shared UI primitives (`@/components/ui`: `<Input>`, `<SearchableSelect>`, `<Button>`).
 *    - Scanner subcomponent `<PosBarcodeScanner />` and success dialog `<PosCheckoutSuccessModal />`.
 *    - Server Actions `createPosBillAction` and `getNextInvoiceNumberAction`.
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Aligns item addition actions inline inside the section header; switches the payment row between 2 and 3 columns
 *      dynamically when UPI is toggled; displays live horizontal summary calculations; and processes atomic checkout transactions.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  Smartphone,
  Banknote,
  BookOpen,
} from 'lucide-react';
import { Input, Button, SearchableSelect } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Customer, Plant, PaymentMode, PosBillWithRelations } from '../types';
import { createPosBillAction, getNextInvoiceNumberAction } from '../actions';
import { PosBarcodeScanner } from './PosBarcodeScanner';
import { PosCheckoutSuccessModal } from './PosCheckoutSuccessModal';
import styles from './PosBillingForm.module.scss';

export interface PosBillingRowItem {
  plantId: string;
  quantity: number | '';
  unitPrice: number | '';
}

export interface PosBillingFormProps {
  customers: Customer[];
  plants: Plant[];
  initialInvoiceNumber?: string;
}

export const PosBillingForm: React.FC<PosBillingFormProps> = ({
  customers,
  plants,
  initialInvoiceNumber,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSetPageHeader({
    title: 'Retail Billing & Cashier Counter',
    subtitle: 'Generate botanical sales invoices, accept UPI/Cash, and manage customer Udhar.',
  });

  // Map customers to select options
  const customerOptions = useMemo(
    () => [
      { value: '', label: 'Walk-in Retail Buyer (Cash / Guest)' },
      ...customers.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.phone})`,
        subLabel: c.totalUdharDue > 0 ? `Udhar: ₹${c.totalUdharDue.toFixed(2)}` : 'Zero Udhar',
      })),
    ],
    [customers]
  );

  // Map plants to select options
  const plantOptions = useMemo(
    () =>
      plants.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.sku})`,
        subLabel: `₹${p.price} | Stock: ${p.stockCount} pots`,
      })),
    [plants]
  );

  // Plant lookup dictionary
  const plantMap = useMemo(() => {
    const map = new Map<string, Plant>();
    plants.forEach((p) => map.set(p.id, p));
    return map;
  }, [plants]);

  // Form State
  const [billNumber, setBillNumber] = useState<string>(initialInvoiceNumber || '');
  const [customerId, setCustomerId] = useState<string>('');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [transactionId, setTransactionId] = useState<string>('');
  const [items, setItems] = useState<PosBillingRowItem[]>([]);
  const [amountPaid, setAmountPaid] = useState<number | ''>(0);
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false);

  // Auto-fetch sequential invoice code if not provided upfront
  useEffect(() => {
    if (!billNumber) {
      if (initialInvoiceNumber) {
        setBillNumber(initialInvoiceNumber);
      } else {
        getNextInvoiceNumberAction().then((res) => {
          if (res.success && res.data) {
            setBillNumber(res.data);
          }
        });
      }
    }
  }, [billNumber, initialInvoiceNumber]);

  // Post-Checkout Success & WhatsApp e-Bill Dispatch Modal State
  const [completedBill, setCompletedBill] = useState<PosBillWithRelations | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Smartphone Camera Barcode Scanner State & Cooldown Lock
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedToastNotice, setScannedToastNotice] = useState<string | null>(null);

  const lastScannedSkuRef = useRef<string | null>(null);
  const scanLockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on component unmount
  useEffect(() => {
    return () => {
      if (scanLockTimerRef.current) clearTimeout(scanLockTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Real-time Subtotal
  const subtotal = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        0
      ),
    [items]
  );

  // Auto-sync amountPaid with subtotal unless manually altered or in Udhar mode
  useEffect(() => {
    if (!isAmountManuallyEdited) {
      if (paymentMode === 'CREDIT_UDHAR') {
        setAmountPaid(0);
      } else {
        setAmountPaid(subtotal);
      }
    }
  }, [subtotal, paymentMode, isAmountManuallyEdited]);

  const balanceDue = Math.max(0, subtotal - (Number(amountPaid) || 0));

  // Selected customer details
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  // Handle Payment Mode Change Dynamically
  const handlePaymentModeChange = (mode: PaymentMode) => {
    setPaymentMode(mode);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.customerId;
      delete next.transactionId;
      delete next.amountPaid;
      return next;
    });

    if (mode === 'CASH') {
      setTransactionId('');
      if (!isAmountManuallyEdited) {
        setAmountPaid(subtotal);
      }
    } else if (mode === 'UPI') {
      if (!isAmountManuallyEdited) {
        setAmountPaid(subtotal);
      }
    } else if (mode === 'CREDIT_UDHAR') {
      setTransactionId('');
      // Set default Amount Paid to 0 (allow partial advance payment)
      setAmountPaid(0);
      setIsAmountManuallyEdited(true);
    }
  };

  // Line Items Handlers
  const handleAddItem = () => {
    const defaultPlant = plants[0];
    if (!defaultPlant) return;
    setItems((prev) => [
      ...prev,
      {
        plantId: defaultPlant.id,
        quantity: 1,
        unitPrice: defaultPlant.price,
      },
    ]);
  };

  const handleUpdateItemPlant = (index: number, newPlantId: string) => {
    const plant = plantMap.get(newPlantId);
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        plantId: newPlantId,
        unitPrice: plant ? plant.price : next[index].unitPrice,
      };
      return next;
    });
  };

  const handleUpdateItemQuantity = (index: number, val: string) => {
    if (val === '') {
      setItems((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          quantity: '',
        };
        return next;
      });
      return;
    }

    const parsed = parseInt(val, 10);
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: isNaN(parsed) ? '' : Math.max(0, parsed),
      };
      return next;
    });
  };

  const handleBlurItemQuantity = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      const cur = next[index]?.quantity;
      if (cur === '' || cur === 0 || Number(cur) < 1) {
        next[index] = {
          ...next[index],
          quantity: 1,
        };
      }
      return next;
    });
  };

  const handleUpdateItemUnitPrice = (index: number, val: string) => {
    if (val === '') {
      setItems((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          unitPrice: '',
        };
        return next;
      });
      return;
    }

    const parsed = parseFloat(val);
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        unitPrice: isNaN(parsed) ? '' : Math.max(0, parsed),
      };
      return next;
    });
  };

  const handleBlurItemUnitPrice = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      if (next[index]?.unitPrice === '') {
        next[index] = {
          ...next[index],
          unitPrice: 0,
        };
      }
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Handler when a plant is scanned via Smartphone Camera QR/Barcode with 2s Lock
  const handlePlantScanned = useCallback(
    (scannedPlant: Plant) => {
      const sku = scannedPlant.sku || scannedPlant.id;

      // 1. Strict 2-second lock check on same plant QR code
      if (lastScannedSkuRef.current === sku) {
        return;
      }

      // 2. Engage 2-second lock for this specific plant
      lastScannedSkuRef.current = sku;
      if (scanLockTimerRef.current) {
        clearTimeout(scanLockTimerRef.current);
      }
      scanLockTimerRef.current = setTimeout(() => {
        lastScannedSkuRef.current = null;
      }, 2000);

      // 3. Show sleek visual toast notification for 2 seconds
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setScannedToastNotice(`✓ Scanned: ${scannedPlant.name} (SKU: ${scannedPlant.sku})`);
      toastTimerRef.current = setTimeout(() => {
        setScannedToastNotice(null);
      }, 2000);

      // 4. Update cart line items safely
      setItems((prev) => {
        const existingIndex = prev.findIndex((it) => it.plantId === scannedPlant.id);
        if (existingIndex >= 0) {
          const next = [...prev];
          const currentQty = Number(next[existingIndex].quantity) || 0;
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: currentQty + 1,
          };
          return next;
        }

        return [
          ...prev,
          {
            plantId: scannedPlant.id,
            quantity: 1,
            unitPrice: scannedPlant.price,
          },
        ];
      });
    },
    []
  );

  // Submission with Dynamic Udhar & UPI Validations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (items.length === 0) {
      setErrorMessage('Please add at least one botanical plant item to complete checkout.');
      return;
    }

    const hasInvalidItem = items.some((it) => !it.plantId || it.plantId.trim() === '');
    if (hasInvalidItem) {
      setErrorMessage('Please select a valid plant cultivar for all items in the list.');
      return;
    }

    if (!selectedCustomer && walkInPhone.trim() && walkInPhone.trim().length < 10) {
      setFieldErrors((prev) => ({
        ...prev,
        customerPhone: ['Mobile number must be exactly 10 digits.'],
      }));
      return;
    }

    // Require registered customer or verified mobile number for Credit / Udhar or any unpaid balance
    if (paymentMode === 'CREDIT_UDHAR' || balanceDue > 0) {
      const hasCustomer = Boolean(customerId);
      const hasValidPhone = Boolean(walkInPhone.trim() && walkInPhone.trim().length >= 10);

      if (!hasCustomer && !hasValidPhone) {
        setErrorMessage(
          balanceDue > 0
            ? `An unpaid balance of ₹${balanceDue.toFixed(2)} requires selecting a customer or entering a 10-digit mobile number to record the Udhar ledger.`
            : 'Udhar (Credit) sales require selecting a registered customer account or entering a 10-digit mobile number.'
        );
        setFieldErrors({
          customerId: ['Please select a customer or enter mobile number for credit balance.'],
        });
        return;
      }
    }

    startTransition(async () => {
      const payload = {
        billNumber,
        customerId: customerId || undefined,
        customerPhone: selectedCustomer?.phone || walkInPhone.trim() || undefined,
        paymentMode,
        amountPaid: Number(amountPaid) || 0,
        transactionId: paymentMode === 'UPI' && transactionId.trim() ? transactionId.trim() : undefined,
        items: items.map((it) => ({
          plantId: it.plantId,
          quantity: it.quantity === '' || Number(it.quantity) < 1 ? 1 : Math.round(Number(it.quantity)),
          unitPrice: it.unitPrice === '' || Number(it.unitPrice) < 0 ? 0 : Number(it.unitPrice),
        })),
      };

      const result = await createPosBillAction(payload);
      if (result.success && result.data) {
        setCompletedBill(result.data);
        setIsSuccessModalOpen(true);
      } else {
        setErrorMessage(result.error || 'Failed to complete transaction.');
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as Record<string, string[]>);
        }
      }
    });
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setCompletedBill(null);
    router.push(APP_ROUTES.POS);
  };

  const handleStartNewBill = () => {
    setIsSuccessModalOpen(false);
    setCompletedBill(null);
    getNextInvoiceNumberAction().then((res) => {
      if (res.success && res.data) {
        setBillNumber(res.data);
      }
    });
    setCustomerId('');
    setWalkInPhone('');
    setPaymentMode('CASH');
    setTransactionId('');
    setItems([]);
    setAmountPaid(0);
    setIsAmountManuallyEdited(false);
    setErrorMessage(null);
    setFieldErrors({});
  };

  const handleCancel = () => {
    router.push(APP_ROUTES.POS);
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

      {/* Sleek Visual Banner Notification (2-Second Confirmation) */}
      {scannedToastNotice && (
        <div className={styles.scanToast} role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{scannedToastNotice}</span>
        </div>
      )}

      {/* Section 1: Bill Reference & Customer Profile */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerTextGroup}>
            <h2 className={styles.sectionTitle}>Invoice & Customer Identity</h2>

          </div>
        </div>

        <div className={styles.grid3}>
          <Input
            label="Bill / Invoice Number"
            placeholder="Auto-generated invoice number"
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value.toUpperCase())}
            errorMessage={fieldErrors.billNumber?.[0]}
            disabled
            className={styles.disabledInvoiceInput}
          />

          <SearchableSelect
            label="Customer Account (Walk-in or Registered)"
            options={customerOptions}
            value={customerId}
            onChange={(val) => setCustomerId(val)}
            errorMessage={fieldErrors.customerId?.[0]}
            placeholder="Select customer account"
            isClearable={true}
            helperText={
              selectedCustomer && selectedCustomer.totalUdharDue > 0
                ? `⚠️ Customer has ₹${selectedCustomer.totalUdharDue.toFixed(2)} active Udhar.`
                : undefined
            }
          />

          <Input
            label={
              selectedCustomer
                ? 'Customer Mobile (Directory Auto-bound)'
                : paymentMode === 'CREDIT_UDHAR'
                  ? 'Customer Mobile Number (Required for Udhar)'
                  : 'Customer Mobile / WhatsApp (Optional)'
            }
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={selectedCustomer ? selectedCustomer.phone : walkInPhone}
            onChange={(e) => {
              if (!selectedCustomer) {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setWalkInPhone(digits);
                if (fieldErrors.customerPhone) {
                  setFieldErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.customerPhone;
                    return updated;
                  });
                }
              }
            }}
            readOnly={Boolean(selectedCustomer)}
            placeholder="Enter mobile number"
            errorMessage={fieldErrors.customerPhone?.[0]}
          />
        </div>
      </section>

      {/* Section 2: Botanical Plants Cart Line Items */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerTextGroup}>
            <h2 className={styles.sectionTitle}>Purchased Botanical Items</h2>
            {items.length > 0 && (
              <span className={styles.itemCountBadge}>
                {items.length} {items.length === 1 ? 'variety' : 'varieties'}
              </span>
            )}
          </div>

          <div className={styles.headerActions}>
            <Button
              type="button"
              size="sm"
              variant={isScannerOpen ? 'outline' : 'secondary'}
              onClick={() => setIsScannerOpen((prev) => !prev)}
              leftIcon={<Camera size={13} />}
            >
              {isScannerOpen ? 'Close Scanner' : 'Scan Barcode'}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleAddItem}
              leftIcon={<Plus size={13} />}
            >
              Add Plant Item
            </Button>
          </div>
        </div>

        {/* Live Smartphone Camera QR & Barcode Viewfinder */}
        {isScannerOpen && (
          <PosBarcodeScanner
            plants={plants}
            onPlantScanned={handlePlantScanned}
            onClose={() => setIsScannerOpen(false)}
          />
        )}

        <div className={styles.itemsContainer}>
          {items.length === 0 ? (
            <div className={styles.emptyItemsBox}>
              <p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>
                No botanical items added to the bill yet.
              </p>
              <span style={{ fontSize: '0.6875rem', color: '#6B7280' }}>
                Click &quot;+ Add Plant Item&quot; or scan a plant pot barcode/QR to begin checkout.
              </span>
            </div>
          ) : (
            items.map((item, index) => {
              const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

              return (
                <div key={index} className={styles.itemRow}>
                  <SearchableSelect
                    options={plantOptions}
                    value={item.plantId}
                    onChange={(val) => handleUpdateItemPlant(index, val)}
                    placeholder="Select plant variety"
                    isClearable={false}
                  />

                  <Input
                    type="number"
                    label="Qty (Pots)"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                    onBlur={() => handleBlurItemQuantity(index)}
                    onFocus={(e) => e.currentTarget.select()}
                    onWheel={(e) => e.currentTarget.blur()}
                    required
                  />

                  <Input
                    type="number"
                    label="Rate (₹)"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateItemUnitPrice(index, e.target.value)}
                    onBlur={() => handleBlurItemUnitPrice(index)}
                    onFocus={(e) => e.currentTarget.select()}
                    onWheel={(e) => e.currentTarget.blur()}
                    required
                  />

                  <div className={styles.itemTotal}>
                    <small>Item Total</small>
                    <span>₹{lineTotal.toFixed(2)}</span>
                  </div>

                  <button
                    type="button"
                    className={styles.deleteItemBtn}
                    onClick={() => handleRemoveItem(index)}
                    aria-label={`Remove line item ${index + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Section 3: Payment Settlement & Financial Summary */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerTextGroup}>
            <h2 className={styles.sectionTitle}>Payment Mode & Settlement</h2>
          </div>
        </div>

        {/* Single Streamlined Payment Row */}
        <div
          className={`${styles.paymentStreamlinedRow} ${
            paymentMode === 'UPI' ? styles.hasUpi : ''
          }`}
        >
          {/* 1. Payment Mode Selector */}
          <div className={styles.paymentModeCol}>
            <label className={styles.fieldLabel}>Payment Mode</label>
            <div className={styles.paymentModesGroup}>
              <button
                type="button"
                className={`${styles.paymentModeOption} ${
                  paymentMode === 'CASH' ? styles.active : ''
                }`}
                onClick={() => handlePaymentModeChange('CASH')}
              >
                <Banknote size={14} />
                <span>Cash</span>
              </button>

              <button
                type="button"
                className={`${styles.paymentModeOption} ${
                  paymentMode === 'UPI' ? styles.active : ''
                }`}
                onClick={() => handlePaymentModeChange('UPI')}
              >
                <Smartphone size={14} />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                className={`${styles.paymentModeOption} ${
                  paymentMode === 'CREDIT_UDHAR' ? styles.active : ''
                }`}
                onClick={() => handlePaymentModeChange('CREDIT_UDHAR')}
              >
                <BookOpen size={14} />
                <span>Udhar (Credit)</span>
              </button>
            </div>
          </div>

          {/* 2. Dynamic UPI Ref / Transaction ID (Rendered only when UPI is selected) */}
          {paymentMode === 'UPI' && (
            <div className={styles.upiRefCol}>
              <Input
                label="UPI Ref / Transaction ID"
                placeholder="Enter 12-digit UTR number"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                errorMessage={fieldErrors.transactionId?.[0]}
                prefixIcon={<Smartphone size={14} />}
              />
            </div>
          )}

          {/* 3. Amount Paid / Received */}
          <div className={styles.amountPaidCol}>
            <Input
              label="Amount Paid / Received (₹)"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount paid"
              value={amountPaid}
              onChange={(e) => {
                setIsAmountManuallyEdited(true);
                const val = e.target.value;
                setAmountPaid(val === '' ? '' : parseFloat(val) || 0);
              }}
              onBlur={() => {
                if (amountPaid === '') {
                  setAmountPaid(0);
                }
              }}
              onFocus={(e) => e.currentTarget.select()}
              onWheel={(e) => e.currentTarget.blur()}
              errorMessage={fieldErrors.amountPaid?.[0]}
              prefixIcon={<span>₹</span>}
              required
              helperText={
                paymentMode === 'CREDIT_UDHAR'
                  ? 'Enter ₹0 for 100% credit or partial advance.'
                  : undefined
              }
            />
          </div>
        </div>

        {/* Udhar Notice Callout (Rendered only when Udhar is selected) */}
        {paymentMode === 'CREDIT_UDHAR' && (
          <div className={styles.udharNotice}>
            <BookOpen size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              {selectedCustomer
                ? `Balance of ₹${balanceDue.toFixed(2)} will be debited to ${selectedCustomer.name}'s Udhar ledger.`
                : walkInPhone.trim()
                  ? `Balance of ₹${balanceDue.toFixed(2)} will be debited to customer with mobile ${walkInPhone.trim()}.`
                  : '⚠️ Requires selecting a customer account or entering customer mobile number.'}
            </span>
          </div>
        )}

        {/* Sleek Horizontal Financial Summary Ribbon */}
        <div className={styles.summaryPanel}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Items:</span>
            <span className={styles.summaryValue}>
              {items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)} pots
            </span>
          </div>

          <div className={`${styles.summaryItem} ${styles.grandTotal}`}>
            <span className={styles.summaryLabel}>Bill Total:</span>
            <span className={styles.summaryValue}>₹{subtotal.toFixed(2)}</span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Received:</span>
            <span className={styles.summaryValue}>₹{(Number(amountPaid) || 0).toFixed(2)}</span>
          </div>

          <div
            className={`${styles.summaryItem} ${
              balanceDue > 0 ? styles.dueBalance : ''
            }`}
          >
            <span className={styles.summaryLabel}>Balance Due:</span>
            <span className={styles.summaryValue}>
              {balanceDue > 0 ? `₹${balanceDue.toFixed(2)} (Udhar)` : '₹0.00 (Nil)'}
            </span>
          </div>
        </div>
      </section>

      {/* Section 4: Bottom Action Controls */}
      <footer className={styles.actionsBar}>
        <div className={styles.footerCheckoutTotal}>
          <Receipt size={16} />
          <span>Checkout Total: ₹{subtotal.toFixed(2)}</span>
        </div>

        <div className={styles.primaryButtonGroup}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            leftIcon={<X size={14} />}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            variant="primary"
            isLoading={isPending}
            leftIcon={<CheckCircle2 size={14} />}
          >
            Complete Bill
          </Button>
        </div>
      </footer>

      {/* Post-Checkout Success & WhatsApp e-Bill Dispatch Modal */}
      <PosCheckoutSuccessModal
        bill={completedBill}
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        onNewBill={handleStartNewBill}
        initialCustomerPhone={selectedCustomer?.phone || walkInPhone || ''}
      />
    </form>
  );
};
