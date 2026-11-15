/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established the barrel export for Point of Sale (POS) & Quick Billing components.
 *    - Exported `<PosBillingForm />`, `<PosTableWrapper />`, `<PosListModule />`,
 *      `<PosBarcodeScanner />`, and `<PosCheckoutSuccessModal />`.
 * 
 * 2. WHY IT WAS DONE:
 *    - To support ultra-fast retail checkouts at the nursery counter on tablets and mobile devices.
 *    - Centralizes component imports for cleaner page consumption in App Router routes.
 * 
 * 3. WHAT WAS USED:
 *    - Modular TypeScript barrel export pattern.
 * 
 * 4. HOW IT WORKS:
 *    - Consumed by `app/(dashboard)/pos/page.tsx` and `app/(dashboard)/pos/new/page.tsx` routes.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './PosBillingForm';
export * from './PosTableWrapper';
export * from './PosListModule';
export * from './PosBarcodeScanner';
export * from './PosCheckoutSuccessModal';
