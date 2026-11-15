/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/inventory/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established the barrel export for Inventory & Sapling Batches UI components.
 *    - Exported `InventoryForm`, `InventoryTableWrapper`, and `InventoryListModule`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Provides clean, organized component imports for App Router pages and related modules.
 *    - Keeps module architecture clean, maintainable, and aligned with Specification 01.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export pattern.
 * 
 * 4. HOW IT WORKS:
 *    - Exported components are rendered by `app/(dashboard)/inventory/` full-screen routes.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './InventoryForm';
export * from './InventoryTableWrapper';
export * from './InventoryListModule';
