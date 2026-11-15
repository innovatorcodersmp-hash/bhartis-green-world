/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/reports/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Reports & Audits Analytics UI components.
 *    - Exported:
 *      * `<ReportsDashboard />`: Redesigned 5-category tabbed dashboard with date range filters & A4 PDF export.
 *      * `<ReportOverviewModule />`: Backward-compatible executive overview wrapper.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Strict Modular Feature Organization".
 *    - Simplifies component imports for Next.js App Router server pages under `app/(dashboard)/reports/`.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Consumers import `{ ReportsDashboard, ReportOverviewModule }` directly from `@/modules/reports/components`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './ReportsDashboard';
export * from './ReportOverviewModule';
