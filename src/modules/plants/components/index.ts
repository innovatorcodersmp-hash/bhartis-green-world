/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/plants/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Plant Directory UI components.
 *    - Exported `<PlantForm>`, `<PlantListModule>`, `<PlantTableWrapper>`, and `<PlantQrModal>`.
 * 
 * 2. WHY IT WAS DONE:
 *    - To fulfill Specification 01 Section 1.2: Strict Modular Feature Organization.
 *    - Allows Next.js route pages inside `app/plants/` to act as lightweight shells under 50 lines.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Route pages and modules import `{ PlantListModule, PlantForm, PlantTableWrapper, PlantQrModal }` directly.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './PlantForm';
export * from './PlantListModule';
export * from './PlantTableWrapper';
export * from './PlantQrModal';
export * from './BulkPlantQrModal';
