/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/plants/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Plant Directory Server Actions.
 *    - Exported `getPlantsAction`, `getPlantByIdAction`, `getNextPlantCodeAction`,
 *      `generateNextPlantCode`, `createPlantAction`, `updatePlantAction`, and `deletePlantAction`.
 * 
 * 2. WHY IT WAS DONE:
 *    - To establish a standardized barrel export for server mutations across the Plant module.
 *    - To encapsulate Prisma ORM transaction logic away from frontend UI components.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Route pages and form components import actions directly from `@/modules/plants/actions`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './plantActions';
