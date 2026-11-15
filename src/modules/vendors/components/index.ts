/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/vendors/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Vendor & Supplier Directory UI components.
 *    - Exported `<VendorForm>`, `<VendorListModule>`, and `<VendorTableWrapper>`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: Strict Modular Feature Organization.
 *    - Allows Next.js route pages inside `app/vendors/` to act as clean, lightweight routing shells.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Route pages import `{ VendorListModule, VendorForm }` directly from `@/modules/vendors/components`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './VendorForm';
export * from './VendorListModule';
export * from './VendorTableWrapper';
