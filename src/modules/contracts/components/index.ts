/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Landscaping Projects, Garden Contracts, Stage Invoicing,
 *      Advance Ledger & Site Estimate UI components.
 *    - Exported:
 *      * `<ContractForm />`
 *      * `<ContractTableWrapper />`
 *      * `<GardenContractTableWrapper />`
 *      * `<ContractPaymentModal />`
 *      * `<ContractListModule />`
 *      * `<EstimateBuilderForm />`
 *      * `<EstimateTableWrapper />`
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Strict Modular Feature Organization".
 *    - Simplifies imports across App Router routes under `app/(dashboard)/contracts/`.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Consumer pages import components directly from `@/modules/contracts/components`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './ContractForm';
export * from './ContractTableWrapper';
export * from './GardenContractTableWrapper';
export * from './ContractPaymentModal';
export * from './ContractListModule';
export * from './EstimateBuilderForm';
export * from './EstimateTableWrapper';
