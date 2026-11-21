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
 *    - Extended TypeScript interfaces and Zod schemas to support multi-plant shared batch consignments.
 *    - Declared `BatchPlantItemInputSchema` for repeatable plant line-items under a single consignment.
 *    - Declared `BatchConsignmentInputSchema` accepting shared header metadata (`batchNumber`, `purchaseDate`, `vendorId`)
 *      and an array of `items` (`BatchPlantItemInput[]`).
 *    - Retained `InventoryBatchInputSchema` for single-item batch edits (`/inventory/[id]/edit`).
 *    - Exported relational and metrics types (`InventoryBatchWithRelations`, `InventoryBatchMetrics`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills User Request: "Upgrade Log New Sapling Batch workflow so nursery staff can log multiple plant
 *      cultivars/varieties under a single shared Batch Code in one submission".
 * 
 * 3. WHAT WAS USED:
 *    - `zod` validation schemas.
 *    - `@prisma/client` domain models (`InventoryBatch`, `Plant`, `Vendor`, `RecordStatus`).
 * 
 * 4. HOW IT WORKS:
 *    - Form submits either multi-item consignment or single-item update;
 *    - Zod schemas parse and normalize values;
 *    - Server Actions persist atomically in Prisma transactions.
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
// 1. ZOD VALIDATION SCHEMA FOR SINGLE INVENTORY BATCH ROW (CREATE / EDIT)
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
    .nullable()
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
    .min(1, { message: 'Please specify the purchase or arrival date.' }),
});

export type InventoryBatchInput = z.infer<typeof InventoryBatchInputSchema>;

// ============================================================================
// 2. ZOD VALIDATION SCHEMA FOR MULTI-PLANT CONSIGNMENT REPEATER
// ============================================================================

export const BatchPlantItemInputSchema = z.object({
  plantId: z
    .string()
    .trim()
    .min(1, { message: 'Please select a plant cultivar.' }),
  initialQty: z.coerce
    .number()
    .int({ message: 'Received pots must be a whole number.' })
    .min(1, { message: 'Received pots must be at least 1.' }),
  currentQty: z.coerce
    .number()
    .int({ message: 'Ready stock must be a whole number.' })
    .min(0, { message: 'Ready stock cannot be negative.' }),
  mortalityQty: z.coerce
    .number()
    .int({ message: 'Damaged pots must be a whole number.' })
    .min(0, { message: 'Damaged pots cannot be negative.' })
    .default(0),
  unitCostPrice: z.coerce
    .number()
    .min(0, { message: 'Unit purchase cost cannot be negative.' })
    .optional()
    .nullable(),
});

export type BatchPlantItemInput = z.infer<typeof BatchPlantItemInputSchema>;

export const BatchConsignmentInputSchema = z.object({
  batchNumber: z
    .string()
    .trim()
    .min(2, { message: 'Batch code must be at least 2 characters.' })
    .max(60, { message: 'Batch code cannot exceed 60 characters.' })
    .transform((val) => val.toUpperCase()),
  purchaseDate: z
    .string()
    .trim()
    .min(1, { message: 'Please specify the purchase or arrival date.' }),
  vendorId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  items: z
    .array(BatchPlantItemInputSchema)
    .min(1, { message: 'Please add at least one plant cultivar to the batch.' }),
});

export type BatchConsignmentInput = z.infer<typeof BatchConsignmentInputSchema>;

// ============================================================================
// 3. SUMMARY METRICS INTERFACE FOR INVENTORY BATCHES
// ============================================================================

export interface InventoryBatchMetrics {
  totalBatches: number;
  activeStockUnits: number;
  totalMortality: number;
  mortalityRatePercent: number;
}
