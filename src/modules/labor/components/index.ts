/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/labor/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Employee Directory & Credentials UI components.
 *    - Exported `<LaborWorkerForm />`, `<LaborTableWrapper />`, and `<LaborListModule />`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Strict Modular Feature Organization".
 *    - Simplifies component imports across App Router routes under `app/(dashboard)/labor/`.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Consumer pages import `{ LaborListModule, LaborWorkerForm }` from `@/modules/labor/components`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './LaborWorkerForm';
export * from './LaborTableWrapper';
export * from './LaborListModule';
