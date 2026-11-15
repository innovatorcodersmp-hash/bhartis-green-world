/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/inventory/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established TypeScript interfaces and Zod validation schemas (`InventoryBatchInputSchema`) for Sapling Batches and Inventory.
 *    - Added optional `unitCostPrice` (Procurement Cost per Pot in ₹) to track consignment investment and mortality financial loss.
 *    - Defined data structures for tracking batch provenance: Batch Number, Plant FK, Vendor FK,
 *      Initial Quantity, Current Stock, Mortality Count, Unit Cost Price, and Procurement Date.
 *    - Structured composite relational types (`InventoryBatchWithRelations`) including joined Plant and Vendor models.
 *    - Declared directory metrics contract for live nursery stock mortality and batch tracking.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: ADD UNIT PURCHASE COST AND AUTO-CALCULATE BATCH TOTALS IN INVENTORY FORM".
 *    - Fulfills Specification 04 Section 1 (Zod validation) and Specification 05 (Database Schema).
 *    - Enables nursery management in Kolhapur to monitor total invested capital and damaged stock losses in real time.
 * 
 * 3. WHAT WAS USED:
 *    - `zod` validation schema builder.
 *    - `@prisma/client` domain models (`InventoryBatch`, `Plant`, `Vendor`, `RecordStatus`).
 * 
 * 4. HOW IT WORKS:
 *    - Raw input feeds through `InventoryBatchInputSchema.safeParse()`.
 *    - Parsed payload guarantees type-safe database persistence with relational joins via Prisma ORM.
 * 
 * ----------------------------------------------------------------------------
 */

import { z } from 'zod';
import type {
  InventoryBatch as PrismaInventoryBatch,
  Plant,
  Vendor,
  RecordStatus,
} from '@prisma/client';

export type { RecordStatus, Plant, Vendor };
export type InventoryBatch = PrismaInventoryBatch;

export type InventoryBatchWithRelations = InventoryBatch & {
  plant: Plant;
  vendor: Vendor | null;
};

// ============================================================================
// 1. ZOD VALIDATION SCHEMA FOR INVENTORY BATCH CREATE & EDIT
// ============================================================================

export const InventoryBatchInputSchema = z.object({
  batchNumber: z
    .string()
    .trim()
    .min(2, { message: 'Batch number must be at least 2 characters.' })
    .max(60, { message: 'Batch number cannot exceed 60 characters.' })
    .transform((val) => val.toUpperCase()),
  plantId: z
    .string()
    .trim()
    .min(1, { message: 'Please select a botanical plant cultivar.' }),
  vendorId: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  initialQty: z.coerce
    .number()
    .int({ message: 'Initial quantity must be a whole number.' })
    .min(1, { message: 'Initial quantity must be at least 1 pot/sapling.' }),
  currentQty: z.coerce
    .number()
    .int({ message: 'Current quantity must be a whole number.' })
    .min(0, { message: 'Current quantity cannot be negative.' }),
  mortalityQty: z.coerce
    .number()
    .int({ message: 'Mortality quantity must be a whole number.' })
    .min(0, { message: 'Mortality count cannot be negative.' })
    .default(0),
  unitCostPrice: z.coerce
    .number()
    .min(0, { message: 'Unit cost price cannot be negative.' })
    .optional()
    .nullable(),
  purchaseDate: z
    .string()
    .trim()
    .min(1, { message: 'Please specify the purchase or propagation date.' }),
});

export type InventoryBatchInput = z.infer<typeof InventoryBatchInputSchema>;

// ============================================================================
// 2. SUMMARY METRICS INTERFACE FOR INVENTORY BATCHES
// ============================================================================

export interface InventoryBatchMetrics {
  totalBatches: number;
  activeStockUnits: number;
  totalMortality: number;
  mortalityRatePercent: number;
}
