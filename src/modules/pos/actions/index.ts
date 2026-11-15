/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Point of Sale (POS) & Retail Billing Server Actions.
 *    - Exported `getNextInvoiceNumberAction`, `generateNextInvoiceNumber`, `getPosBillsAction`, `getPosBillByIdAction`, and `createPosBillAction`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Standardizes server action imports across cashier checkout workflows (`@/modules/pos/actions`).
 *    - Keeps transactional Prisma logic decoupled from client UI components.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Components throughout the ERP consume POS actions directly from this barrel.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './posActions';
