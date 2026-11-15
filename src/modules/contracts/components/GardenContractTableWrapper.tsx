/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/components/GardenContractTableWrapper.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Created alias export for `<GardenContractTableWrapper>` pointing to `<ContractTableWrapper>`.
 *    - Exposes row-level stage payment modal triggers, vector invoice generator, and contract editor.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Update ContractTableWrapper.tsx (and provide GardenContractTableWrapper.tsx alias)".
 *    - Guarantees component naming parity across all dashboard views and documentation references.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript re-export syntax.
 * 
 * 4. HOW IT WORKS:
 *    - Re-exports `ContractTableWrapper` as `GardenContractTableWrapper` and exports related props.
 * 
 * ----------------------------------------------------------------------------
 */

export { ContractTableWrapper as GardenContractTableWrapper } from './ContractTableWrapper';
export type { ContractTableWrapperProps as GardenContractTableWrapperProps } from './ContractTableWrapper';

