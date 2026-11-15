/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/config/routes.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Created alias configuration module re-exporting `APP_ROUTES` from `@/lib/constants/routes`.
 *    - Guarantees backward and modular compatibility for routes lookup across the codebase.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: FIX DASHBOARD NAVIGATION & REMOVE LEGACY REDIRECT TO POS".
 *    - Adheres to Specification 01: Centralized, type-safe route configuration without magic strings.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript re-export.
 * 
 * 4. HOW IT WORKS:
 *    - Re-exports `APP_ROUTES` and all routing constants from `@/lib/constants/routes`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from '@/lib/constants/routes';

