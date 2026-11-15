/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/datatable/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported the shared TanStack Table v8 DataTable wrapper and contracts.
 *    - Exported `<DataTable>` and its TypeScript props interface `DataTableProps`.
 * 
 * 2. WHY IT WAS DONE:
 *    - To fulfill Specification 03 Section 2.3: Responsive TanStack Data Table Wrapper.
 *    - To standardize data grid presentation and swipe usability across all feature modules.
 *    - To provide a clean, centralized import path (`@/components/datatable`).
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Feature tables across Plants, Customers, POS, and Inventory import `{ DataTable }` from this barrel.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './DataTable';
