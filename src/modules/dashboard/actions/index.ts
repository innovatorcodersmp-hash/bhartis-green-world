/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/dashboard/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Live Nursery Command Center Server Actions.
 *    - Exported `getNurseryDashboardMetricsAction()`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Strict Modular Feature Organization".
 *    - Standardizes server action imports across page shells and client dashboard components.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Consumers import `{ getNurseryDashboardMetricsAction }` from `@/modules/dashboard/actions`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './dashboardActions';

