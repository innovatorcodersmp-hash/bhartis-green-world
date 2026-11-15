/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/plants/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Simplified the Plant Master Directory data contract into a streamlined 4-field catalogue model:
 *      Plant Code (SKU), Botanical Category, Plant Name (single unified identifier), and Selling Price.
 *    - Configured `name` as the primary plant title accommodating English and regional Marathi nomenclature
 *      (e.g., "Kashmiri Red Rose / काश्मिरी गुलाब").
 *    - Preserved `marathiName`, `costPrice`, `stockCount`, and `polyhouseNo` as optional fields for
 *      backward compatibility with database records and historical orders.
 *    - Maintained strict Prisma `PlantCategory` validation (FRUIT, FLOWER, ORNAMENTAL, MEDICINAL).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: SIMPLIFY PLANT FORM TO SINGLE NAME FIELD AND RESTRAIN UI CARD WIDTH".
 *    - Eliminates redundant dual-name inputs for cashier and nursery cataloging workflows in Kolhapur.
 *    - Enforces full TypeScript type safety between Server Actions and `<PlantForm>`.
 * 
 * 3. WHAT WAS USED:
 *    - `zod` for compile-time and runtime validation.
 *    - `@prisma/client` domain models (`PlantCategory`, `RecordStatus`, `Plant`).
 * 
 * 4. HOW IT WORKS:
 *    - Validates payload against `PlantInputSchema`, sanitizing inputs before Prisma ORM persistence.
 * 
 * ----------------------------------------------------------------------------
 */

import { z } from 'zod';
import type { Plant as PrismaPlant, PlantCategory, RecordStatus } from '@prisma/client';

export type { PlantCategory, RecordStatus };
export type Plant = PrismaPlant;

// ============================================================================
// 1. ZOD VALIDATION SCHEMA FOR PURE CATALOGUE PLANT CREATE & EDIT
// ============================================================================

export const PlantInputSchema = z.object({
  sku: z
    .string()
    .trim()
    .max(50, { message: 'SKU cannot exceed 50 characters.' })
    .transform((val) => val.toUpperCase())
    .optional()
    .or(z.literal('')),
  category: z.enum(['FRUIT', 'FLOWER', 'ORNAMENTAL', 'MEDICINAL'], {
    message: 'Please select a valid botanical category.',
  }),
  name: z
    .string()
    .trim()
    .min(2, { message: 'Plant name must be at least 2 characters.' })
    .max(150, { message: 'Plant name cannot exceed 150 characters.' }),
  marathiName: z
    .string()
    .trim()
    .max(120, { message: 'Marathi name cannot exceed 120 characters.' })
    .optional()
    .nullable()
    .or(z.literal('')),
  price: z.coerce
    .number()
    .min(0, { message: 'Selling price cannot be negative.' }),
  // Optional legacy fields for backward compatibility
  costPrice: z.coerce.number().min(0).optional(),
  stockCount: z.coerce.number().int().min(0).optional(),
  polyhouseNo: z.string().trim().optional().nullable(),
});

export type PlantInput = z.infer<typeof PlantInputSchema>;

// ============================================================================
// 2. SUMMARY METRICS INTERFACE FOR PLANT DIRECTORY
// ============================================================================

export interface PlantDirectoryMetrics {
  totalVarieties: number;
  totalStockUnits: number;
  totalAssetValue: number;
  lowStockCount: number;
}
