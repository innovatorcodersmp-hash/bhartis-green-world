/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/auth/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported the public API surface for Module 12: Authentication & Session Management.
 *    - Re-exported all types, server actions, and UI components.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Strict Modular Feature Organization".
 *    - Provides a single point of reference (`@/modules/auth`) for external application layers.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Other modules import auth functionality from `@/modules/auth`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './types';
export * from './actions';
export * from './components';
