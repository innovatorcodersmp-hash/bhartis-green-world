/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/reports/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established root barrel export for Module 8: Reports & Audits Analytics.
 *    - Re-exported all report types, data contracts, server actions, and UI components.
 * 
 * 2. WHY IT WAS DONE:
 *    - Enforces standardized, clean import paths across the ERP application.
 *    - Encapsulates module internals behind a unified module API.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - External modules and App Router pages import via `@/modules/reports`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './types';
export * from './actions';
export * from './components';

