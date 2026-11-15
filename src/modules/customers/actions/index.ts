/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/customers/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Customer Directory & Udhar Ledger Server Actions.
 *    - Exported `getCustomersAction`, `getCustomerByIdAction`, `createCustomerAction`, `updateCustomerAction`, and `deleteCustomerAction`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Standardizes server action imports across CRM views and POS billing modules (`@/modules/customers/actions`).
 *    - Keeps Prisma transactions decoupled from client views.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Components throughout the ERP consume customer actions directly from this barrel.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './customerActions';
