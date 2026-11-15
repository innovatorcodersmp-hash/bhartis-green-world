/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/vendors/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Vendor & Supplier Directory Server Actions.
 *    - Exported `getVendorsAction`, `getVendorByIdAction`, `createVendorAction`, `updateVendorAction`, and `deleteVendorAction`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Standardizes server action imports across procurement workflows and inventory batch logging (`@/modules/vendors/actions`).
 *    - Keeps Prisma transactions decoupled from client views.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Components throughout the ERP consume vendor actions directly from this barrel.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './vendorActions';
