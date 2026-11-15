/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/settings/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Created barrel export for settings Server Actions.
 * 
 * 2. WHY IT WAS DONE:
 *    - To maintain clean modular encapsulation and clean import paths.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript re-export.
 * 
 * 4. HOW IT WORKS:
 *    - Re-exports backup actions from `backupActions.ts`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './backupActions';

