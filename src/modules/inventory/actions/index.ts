/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/inventory/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Sapling Inventory Batches Server Actions.
 *    - Exported `getInventoryBatchesAction`, `getInventoryBatchByIdAction`, `createInventoryBatchAction`,
 *      `updateInventoryBatchAction`, and `deleteInventoryBatchAction`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Standardizes server action imports across inventory stock views and replenishment modules (`@/modules/inventory/actions`).
 *    - Keeps Prisma transactions decoupled from client views.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Components throughout the ERP consume inventory actions directly from this barrel.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './inventoryActions';
