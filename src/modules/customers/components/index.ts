/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/customers/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Customer Directory & Udhar Ledger UI components.
 *    - Exported `<CustomerForm>`, `<CustomerListModule>`, and `<CustomerTableWrapper>`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: Strict Modular Feature Organization.
 *    - Allows Next.js route pages inside `app/customers/` to act as clean, lightweight routing shells.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Route pages import `{ CustomerListModule, CustomerForm }` directly from `@/modules/customers/components`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './CustomerForm';
export * from './CustomerListModule';
export * from './CustomerTableWrapper';
