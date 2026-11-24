/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established root barrel export for Module 6: Landscaping Projects & Garden Contracts.
 *    - Re-exported all contracts types, schemas, server actions, and UI components.
 * 
 * 2. WHY IT WAS DONE:
 *    - Enforces standardized, clean import paths across the ERP application.
 *    - Encapsulates module internals behind a unified module API.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - External modules and pages import via `@/modules/contracts`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './types';
export * from './actions';
export * from './components';
export * from './utils';
export * from '@/modules/landscaping';
