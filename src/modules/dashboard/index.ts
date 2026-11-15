/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/dashboard/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Master barrel export for the Nursery Dashboard module.
 *    - Re-exports dashboard types, server actions, and UI components.
 * 
 * 2. WHY IT WAS DONE:
 *    - Provides clean, unified import boundaries across the application.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript re-exports.
 * 
 * 4. HOW IT WORKS:
 *    - Consumers can import actions, types, or components directly from `@/modules/dashboard`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './types';
export * from './actions';
export * from './components';

