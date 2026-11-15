/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/utils/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Created barrel export for Contracts & Landscaping utility helpers.
 *    - Exported `generateEstimatePdf`, `buildEstimatePdf`, `generateContractInvoicePdf`,
 *      `buildContractInvoicePdf`, and `BGW_LOGO_BASE64`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Strict Modular Feature Organization".
 *    - Streamlines vector PDF utility imports across estimate components, stage invoices, and action pages.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Re-exports utility functions for consumption via `@/modules/contracts/utils`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './generateEstimatePdf';
export * from './generateContractInvoicePdf';
export * from './bgwLogoBase64';
