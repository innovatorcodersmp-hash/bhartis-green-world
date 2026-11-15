/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/dashboard/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Created barrel export for `<NurseryDashboard>` component.
 * 
 * 2. WHY IT WAS DONE:
 *    - To maintain clean modular encapsulation and clean import paths.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript re-export.
 * 
 * 4. HOW IT WORKS:
 *    - Consumers import `{ NurseryDashboard }` from `@/modules/dashboard/components`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './NurseryDashboard';

