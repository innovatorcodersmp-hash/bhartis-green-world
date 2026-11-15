/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/settings/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Master barrel export for the Settings & Backup module.
 *    - Re-exports settings types, server actions, and UI components.
 * 
 * 2. WHY IT WAS DONE:
 *    - Provides clean, unified import boundaries across the application.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript re-exports.
 * 
 * 4. HOW IT WORKS:
 *    - Consumers import actions, types, or components directly from `@/modules/settings`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './types';
export * from './actions';
export * from './components';

