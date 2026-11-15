/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Landscaping Projects, Garden Contracts, Stage Invoicing,
 *      Advance Ledger & Site Estimate Server Actions.
 *    - Exported:
 *      * `generateNextContractNumber`, `getNextContractNumberAction`: Concurrency-safe sequential `BGW-CNT-YYYY-XXXX` generation.
 *      * `getContractsAction`, `getContractByIdAction`, `createContractAction`,
 *        `updateContractAction`, `deleteContractAction`.
 *      * `recordContractPaymentAction`: Logs stage installments and syncs customer Udhar balance.
 *      * `generateContractMilestoneInvoiceAction`: Prepares milestone invoice payloads for PDF dispatch.
 *      * `createLandscapingEstimateAction`, `getLandscapingEstimatesAction`, `convertEstimateToContractAction`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Standardizes server action imports across contract forms, payment modals, and list modules.
 *    - Decouples server database queries from client-side interface components.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Imported by `@/modules/contracts/actions` across the application.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './contractActions';
export * from './estimateActions';
