/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/components/EstimateBuilderForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Strictly enforced 10-digit numeric mobile validation (strips non-digits, caps at 10 digits).
 *    - Standardized all input placeholders to direct, concise action prompts ("Enter client full name",
 *      "Enter client mobile number", "Enter site or project address", etc.) and purged redundant helper text.
 *    - Re-architected Section 1 "Client & Site Details" into an ultra-compact 3-column, 2-line layout (`.gridThreeCol`):
 *      * Line 1: Client / Owner Full Name, Client Mobile Number, Site Location / Project Address.
 *      * Line 2: Scope of Work & Description, Plot Area (Sq. Ft.), Price per Sq. Ft. (₹).
 *      * Fits 6 core fields into 2 balanced rows on tablet and desktop viewports.
 *    - Re-architected `<EstimateBuilderForm>` to exclusively fetch and populate plants
 *      from the live Plant Master (`BGW-PLT-XXXX`):
 *      * Locked the Category column into an immutable, read-only botanical accent badge (`Fruit`,
 *        `Flower`, `Ornamental`, `Medicinal`), eliminating the misleading editable `<select>`.
 *      * Preserved authoritative category binding defined during Plant Master registration.
 *      * Removed the duplicate/redundant secondary `<select>` picker button from table rows,
 *        leaving a single, clean, full-width searchable combobox (`<input list="...">`).
 *      * Embedded native `<datalist>` populated solely with live Plant Master records.
 *      * Selecting a plant auto-populates SKU, cultivar name, category, unit rate (₹), and calculates row total.
 *    - Eliminated redundant customer data entry:
 *      * Selecting a registered customer auto-locks Name and Phone number.
 *      * "Walk-in / New Customer" unlocks clean fields for manual entry with auto-registration into Customer Master.
 *    - Synchronous double-click guard (`useRef(false)`) and automatic filtering of blank line items
 *      to ensure clean Zod validation and prevent duplicate POST race conditions.
 *    - Preserved dynamic grand total formula:
 *      Grand Total = (Plot Area × Price per Sq. Ft.) + Sum of selected Plant Line Items + optional Labor.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "here keep 3 column so that place in 2 lines so it will be compact Select registered client or enter walk-in details".
 *    - Reduces vertical screen footprint while keeping form fields balanced and highly readable.
 *    - Enforces strict data integrity: staff cannot erroneously alter a fruit tree or flower to "Soil / Manure".
 * 
 * 3. WHAT WAS USED:
 *    - React 19 client hooks (`useState`, `useTransition`, `useMemo`, `useRef`).
 *    - Next.js `useRouter`.
 *    - Shared UI primitives (`@/components/ui` -> `Input`, `Button`, `SearchableSelect`).
 *    - Lucide React icons (`Sprout`, `Plus`, `Trash2`, `Save`, `ArrowLeft`, `Calculator`, `MapPin`, `User`, `FileText`, `AlertCircle`, `IndianRupee`, `Lock`).
 *    - Centralized route constants (`APP_ROUTES`).
 *    - Server Action `createLandscapingEstimateAction`.
 *    - SCSS Modules mapped to design tokens (`EstimateBuilderForm.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Live `Plant[]` records passed from `NewEstimatePage` via `getPlantsAction()` populate each row's datalist.
 *    - When staff types or clicks the input's dropdown arrow, the browser displays matching cultivars with SKU, price, and category.
 *    - Selecting a plant applies its registered selling price, and recalculates the line total and grand total.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Calculator,
  MapPin,
  User,
  FileText,
  AlertCircle,
  IndianRupee,
  Lock,
} from 'lucide-react';
import { Input, Button, SearchableSelect } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Customer, EstimateLineItem } from '../types';
import type { Plant } from '@/modules/plants/types';
import { createLandscapingEstimateAction } from '../actions';
import styles from './EstimateBuilderForm.module.scss';

export interface EstimateBuilderFormProps {
  customers: Customer[];
  plants?: Plant[];
}

const WALK_IN_CUSTOMER_VALUE = 'WALK_IN_NEW';

// Helper: Format botanical category into friendly title label
function formatCategoryLabel(cat?: string): string {
  if (!cat) return 'Plant';
  switch (cat.toUpperCase()) {
    case 'FRUIT':
      return 'Fruit';
    case 'FLOWER':
      return 'Flower';
    case 'ORNAMENTAL':
      return 'Ornamental';
    case 'MEDICINAL':
      return 'Medicinal';
    default:
      return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  }
}

// Helper: Map category to refined botanical flower accent style classes
function getCategoryBadgeClass(cat?: string): string {
  const c = cat ? cat.toUpperCase() : 'PLANTS';
  if (c === 'FRUIT') return `${styles.categoryBadge} ${styles.badgeFruit}`;
  if (c === 'FLOWER') return `${styles.categoryBadge} ${styles.badgeFlower}`;
  if (c === 'ORNAMENTAL') return `${styles.categoryBadge} ${styles.badgeOrnamental}`;
  if (c === 'MEDICINAL') return `${styles.categoryBadge} ${styles.badgeMedicinal}`;
  return `${styles.categoryBadge} ${styles.badgeDefault}`;
}

export const EstimateBuilderForm: React.FC<EstimateBuilderFormProps> = ({
  customers,
  plants = [],
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSetPageHeader({
    title: 'Create Site Quotation',
  });

  // Form Field States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [siteLocation, setSiteLocation] = useState<string>('');
  const [plotArea, setPlotArea] = useState<string>('');
  const [ratePerSqFt, setRatePerSqFt] = useState<number | ''>('');
  const [scopeOfWork, setScopeOfWork] = useState<string>('');
  const [laborCharges, setLaborCharges] = useState<number | ''>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronous submission lock to prevent duplicate POST requests
  const isSubmittingRef = useRef(false);

  // Line Items State (starts empty by default)
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([]);

  // Flag determining if selected customer is a registered directory entry
  const isRegisteredCustomer = Boolean(
    selectedCustomerId && selectedCustomerId !== WALK_IN_CUSTOMER_VALUE
  );

  // Customer Directory Options with Walk-in / New option
  const customerOptions = useMemo(
    () => [
      {
        value: WALK_IN_CUSTOMER_VALUE,
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

  // Handle Client Directory Selection
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setErrorMessage(null);

    if (!customerId || customerId === WALK_IN_CUSTOMER_VALUE) {
      if (customerId === WALK_IN_CUSTOMER_VALUE) {
        setClientName('');
        setClientPhone('');
        setSiteLocation('');
      }
      return;
    }

    const matched = customers.find((c) => c.id === customerId);
    if (matched) {
      setClientName(matched.name);
      setClientPhone(matched.phone);
      if (matched.address) {
        setSiteLocation(matched.address);
      }
    }
  };

  // Add Dynamic Line Item
  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length + 1}`,
        description: '',
        category: 'PLANTS',
        qty: 1,
        unitRate: 0,
        total: 0,
      },
    ]);
  };

  // Remove Dynamic Line Item
  const handleRemoveItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update Line Item Values
  const handleUpdateItem = (
    index: number,
    field: keyof EstimateLineItem,
    value: string | number
  ) => {
    setErrorMessage(null);
    setLineItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === 'qty' || field === 'unitRate') {
        const qty = Number(field === 'qty' ? value : target.qty) || 0;
        const rate = Number(field === 'unitRate' ? value : target.unitRate) || 0;
        target.total = Number((qty * rate).toFixed(2));
      }

      updated[index] = target;
      return updated;
    });
  };

  // Handle Plant Selection inside row combobox
  const handleRowItemSelectOrType = (index: number, val: string) => {
    setErrorMessage(null);

    // 1. Check if val matches any live Plant Master item (by full formatted label, name, or SKU)
    const matchedPlant = plants.find(
      (p) =>
        `[${p.sku || 'BGW-PLT'}] ${p.name}` === val ||
        p.name.toLowerCase() === val.toLowerCase() ||
        (p.sku && p.sku.toLowerCase() === val.toLowerCase()) ||
        val.startsWith(`[${p.sku}]`)
    );

    if (matchedPlant) {
      const rate = Number(matchedPlant.price) || 0;
      setLineItems((prev) => {
        const updated = [...prev];
        const target = { ...updated[index] };
        target.description = `[${matchedPlant.sku || 'BGW-PLT'}] ${matchedPlant.name}`;
        target.category = matchedPlant.category || 'PLANTS';
        target.unitRate = rate;
        const qty = Number(target.qty) > 0 ? Number(target.qty) : 1;
        target.qty = qty;
        target.total = Number((qty * rate).toFixed(2));
        updated[index] = target;
        return updated;
      });
      return;
    }

    // 2. User typed custom plant/cultivar name or notes
    handleUpdateItem(index, 'description', val);
  };

  // Numeric Conversions & Dynamic Calculations
  const numericPlotArea = useMemo(() => {
    if (!plotArea) return 0;
    const clean = String(plotArea).replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  }, [plotArea]);

  const numericRatePerSqFt = Number(ratePerSqFt) || 0;
  const lawnAreaBaseCost = Number((numericPlotArea * numericRatePerSqFt).toFixed(2));

  // Botanical & Material Items Subtotal
  const plantItemsSubtotal = useMemo(() => {
    return Number(
      lineItems.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0).toFixed(2)
    );
  }, [lineItems]);

  const numericLabor = Number(laborCharges) || 0;

  // Formula: Grand Total = (Plot Area × Price per Sq. Ft.) + Sum of all selected Plant Line Items (+ Labor if provided)
  const grandTotal = Number((lawnAreaBaseCost + plantItemsSubtotal + numericLabor).toFixed(2));
  const materialSubtotal = Number((lawnAreaBaseCost + plantItemsSubtotal).toFixed(2));

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Synchronous guard against rapid double clicks or concurrent submits
    if (isPending || isSubmittingRef.current) {
      return;
    }

    setErrorMessage(null);

    if (!clientName.trim() || clientName.trim().length < 2) {
      setErrorMessage('Please provide a valid client name (minimum 2 characters).');
      return;
    }

    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!siteLocation.trim() || siteLocation.trim().length < 3) {
      setErrorMessage('Please enter a valid site location address (minimum 3 characters).');
      return;
    }

    if (!plotArea.trim()) {
      setErrorMessage('Please specify valid plot or garden dimensions.');
      return;
    }

    // Filter out blank / unfinished line items (e.g. empty added rows)
    const validLineItems = lineItems
      .filter((i) => i.description && i.description.trim().length > 0)
      .map((i, idx) => ({
        ...i,
        id: i.id || `line-${idx + 1}`,
        description: i.description.trim(),
        qty: Number(i.qty) > 0 ? Number(i.qty) : 1,
        unitRate: Number(i.unitRate) >= 0 ? Number(i.unitRate) : 0,
        total: Number((Number(i.qty || 1) * Number(i.unitRate || 0)).toFixed(2)),
      }));

    if (validLineItems.length === 0 && lawnAreaBaseCost <= 0) {
      setErrorMessage(
        'Please add at least one plant line item or specify plot area and price per sq. ft.'
      );
      return;
    }

    isSubmittingRef.current = true;

    const formattedPlotArea =
      numericRatePerSqFt > 0
        ? `${plotArea.includes('sq') ? plotArea : `${plotArea} sq ft`} (@ ₹${numericRatePerSqFt}/sq ft)`
        : plotArea.includes('sq')
          ? plotArea
          : `${plotArea} sq ft`;

    startTransition(async () => {
      try {
        const result = await createLandscapingEstimateAction({
          customerId: isRegisteredCustomer ? selectedCustomerId : undefined,
          clientName: clientName.trim(),
          clientPhone: cleanPhone,
          siteLocation: siteLocation.trim(),
          plotArea: formattedPlotArea,
          scopeOfWork: scopeOfWork?.trim() || null,
          lineItems: validLineItems,
          laborCharges: numericLabor,
          materialTotal: materialSubtotal,
          grandTotal,
          status: 'DRAFT',
        });

        if (result.success) {
          router.push(APP_ROUTES.CONTRACTS_ESTIMATES);
          router.refresh();
        } else {
          isSubmittingRef.current = false;
          setErrorMessage(result.error || 'Failed to save estimate. Please try again.');
        }
      } catch (err) {
        isSubmittingRef.current = false;
        console.error('Error submitting estimate:', err);
        setErrorMessage('A network or server error occurred while saving. Please try again.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formWrapper} noValidate>
      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Client & Site Details Card */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconBadge}>
              <User size={16} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Client &amp; Site Details</h2>

            </div>
          </div>
          {isRegisteredCustomer && (
            <span className={styles.lockedDirectoryPill}>
              <Lock size={12} />
              Auto-filled from Directory (Read-Only)
            </span>
          )}
        </div>

        {/* Standardized Reusable Customer Directory Selection */}
        <div className={styles.directorySelectWrapper}>
          <SearchableSelect
            label="Select From Customer Directory"
            placeholder="Search registered client by name or phone"
            options={customerOptions}
            value={selectedCustomerId}
            onChange={handleCustomerSelect}
            helperText={
              isRegisteredCustomer
                ? 'Client verified. Name and phone are auto-locked below to prevent duplicate entry.'
                : 'Select registered customer or choose "Walk-in / New Customer" to type manually.'
            }
            isClearable
          />
        </div>

        {/* Client & Site Details 3-Column Compact Grid across 2 lines */}
        <div className={styles.gridThreeCol}>
          {/* Line 1 - Col 1: Client Name */}
          <Input
            label="Client / Owner Full Name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            readOnly={isRegisteredCustomer}
            placeholder="Enter client full name"
            prefixIcon={isRegisteredCustomer ? <Lock size={14} color="#059669" /> : <User size={15} />}
            helperText={
              isRegisteredCustomer
                ? 'Bound to registered account'
                : undefined
            }
          />

          {/* Line 1 - Col 2: Client Mobile */}
          <Input
            label="Client Mobile Number"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={clientPhone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              setClientPhone(digits);
              if (errorMessage) setErrorMessage(null);
            }}
            required
            readOnly={isRegisteredCustomer}
            placeholder="Enter mobile number"
            prefixIcon={isRegisteredCustomer ? <Lock size={14} color="#059669" /> : undefined}
            helperText={
              isRegisteredCustomer
                ? 'Locked registered phone number'
                : undefined
            }
          />

          {/* Line 1 - Col 3: Site Location Address */}
          <Input
            label="Site Location / Project Address"
            value={siteLocation}
            onChange={(e) => setSiteLocation(e.target.value)}
            required
            placeholder="Enter site or project address"
            prefixIcon={<MapPin size={15} />}
          />

          {/* Line 2 - Col 1: Scope of Work */}
          <Input
            label="Scope of Work &amp; Description"
            value={scopeOfWork}
            onChange={(e) => setScopeOfWork(e.target.value)}
            placeholder="Enter scope of work (optional)"
          />

          {/* Line 2 - Col 2: Plot Area */}
          <Input
            label="Plot Area (Sq. Ft.)"
            value={plotArea}
            onChange={(e) => setPlotArea(e.target.value)}
            required
            placeholder="Enter plot area"
            prefixIcon={<FileText size={15} />}
          />

          {/* Line 2 - Col 3: Price per Sq. Ft. */}
          <Input
            label="Price per Sq. Ft. (₹)"
            type="number"
            min="0"
            step="any"
            value={ratePerSqFt}
            onChange={(e) =>
              setRatePerSqFt(e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="Enter rate per sq ft"
            prefixIcon={<IndianRupee size={15} />}
            helperText={
              numericPlotArea > 0 && numericRatePerSqFt > 0
                ? `Lawn Cost: ₹${lawnAreaBaseCost.toLocaleString('en-IN')}`
                : undefined
            }
          />
        </div>
      </section>

      {/* 2. Botanical & Material Line Items Card with Embedded Row Selector */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconBadge}>
              <Sprout size={16} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Botanical &amp; Material Line Items</h2>
              <p className={styles.sectionSubtitle}>
                Select live plants from Plant Master (BGW-PLT-XXXX) directly inside each row
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLineItem}
            leftIcon={<Plus size={14} />}
          >
            Add Line Item
          </Button>
        </div>

        {/* Line Items Table with Embedded Row Combobox */}
        <div className={styles.tableScrollWrapper}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th style={{ width: '36px', textAlign: 'center' }}>#</th>
                <th style={{ minWidth: '300px' }}>Description of Item / Cultivar</th>
                <th style={{ width: '120px' }}>Category</th>
                <th style={{ width: '90px' }}>Quantity</th>
                <th style={{ width: '105px' }}>Rate (₹)</th>
                <th style={{ width: '105px' }}>Total (₹)</th>
                <th style={{ width: '44px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTableState}>
                    No plants added yet. Click &ldquo;+ Add Line Item&rdquo; to select plants from Plant Master (BGW-PLT-XXXX).
                  </td>
                </tr>
              ) : (
                lineItems.map((item, index) => (
                  <tr key={item.id || index}>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                    <td>
                      {/* Single Clean Full-Width Searchable Combobox inside row */}
                      <input
                        type="text"
                        list={`plant-datalist-${item.id || index}`}
                        className={styles.tableInput}
                        value={item.description}
                        onChange={(e) => handleRowItemSelectOrType(index, e.target.value)}
                        placeholder="Search plant by SKU or name"
                        required
                      />

                      <datalist id={`plant-datalist-${item.id || index}`}>
                        {plants.map((p) => (
                          <option
                            key={p.id}
                            value={`[${p.sku || 'BGW-PLT'}] ${p.name}`}
                          >
                            ₹{p.price} • {p.category}
                          </option>
                        ))}
                      </datalist>
                    </td>
                    <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                      <span className={getCategoryBadgeClass(item.category)}>
                        {formatCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className={styles.tableInput}
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(index, 'qty', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className={styles.tableInput}
                        value={item.unitRate}
                        onChange={(e) => handleUpdateItem(index, 'unitRate', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className={styles.tableInput}
                        value={item.total}
                        readOnly
                        style={{ backgroundColor: '#F9FAFB', fontWeight: 600 }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className={styles.deleteRowBtn}
                        onClick={() => handleRemoveItem(index)}
                        title="Remove line item"
                        aria-label="Remove line item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooterRow}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLineItem}
            leftIcon={<Plus size={14} />}
          >
            Add Line Item
          </Button>

          <span className={styles.itemCountBadge}>
            {lineItems.length} {lineItems.length === 1 ? 'Item' : 'Items'} Listed
          </span>
        </div>
      </section>

      {/* 3. Labor Charges & Dynamic Calculation Breakdown */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconBadge}>
              <Calculator size={16} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Financial Settlement &amp; Site Labor</h2>
              <p className={styles.sectionSubtitle}>
                Add labor installation, site leveling, and earthwork charges
              </p>
            </div>
          </div>
        </div>

        <div className={styles.gridTwoCol} style={{ alignItems: 'flex-start' }}>
          <div>
            <Input
              label="Site Labor, Leveling &amp; Earthwork Charges (₹)"
              type="number"
              min="0"
              step="100"
              value={laborCharges}
              onChange={(e) =>
                setLaborCharges(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </div>

          <div className={styles.summaryContainer}>
            {lawnAreaBaseCost > 0 && (
              <div className={styles.summaryRow}>
                <span>Lawn Development ({numericPlotArea.toLocaleString()} sq ft @ ₹{numericRatePerSqFt}):</span>
                <span className={styles.summaryValue}>₹{lawnAreaBaseCost.toFixed(2)}</span>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span>Botanical &amp; Material Subtotal:</span>
              <span className={styles.summaryValue}>₹{plantItemsSubtotal.toFixed(2)}</span>
            </div>

            {numericLabor > 0 && (
              <div className={styles.summaryRow}>
                <span>Site Labor Charges:</span>
                <span className={styles.summaryValue}>₹{numericLabor.toFixed(2)}</span>
              </div>
            )}

            <div className={styles.grandTotalRow}>
              <span className={styles.grandTotalLabel}>Grand Total Estimate:</span>
              <span className={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom Action Controls */}
      <div className={styles.formActions}>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(APP_ROUTES.CONTRACTS_ESTIMATES)}
          leftIcon={<ArrowLeft size={16} />}
        >
          Cancel &amp; Return
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isPending}
          disabled={isPending}
          leftIcon={<Save size={16} />}
        >
          Save &amp; Generate Estimate
        </Button>
      </div>
    </form>
  );
};
