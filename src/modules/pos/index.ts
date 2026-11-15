/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established root barrel export for Module 5: POS Billing & Cashier Counter.
 *    - Re-exported all types, schemas, server actions, and client UI components.
 * 
 * 2. WHY IT WAS DONE:
 *    - Ensures standardized import paths across the enterprise ERP application.
 *    - Encapsulates POS internal structure behind a unified module interface.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Allows external modules and pages to import via `@/modules/pos`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './types';
export * from './actions';
export * from './components';
export * from './utils';
