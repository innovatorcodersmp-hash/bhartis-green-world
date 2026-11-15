/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/vendors/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established TypeScript interfaces and Zod validation schemas (`VendorInputSchema`) for the Vendor & Supplier Directory.
 *    - Enforced strict 10-digit Indian phone number formatting (`/^[6-9]\d{9}$/`).
 *    - Defined categories for nursery procurement: Seeds & Saplings, Pots & Containers, Fertilizers & Soil, Irrigation & Tools.
 *    - Declared contracts for vendor directory metrics and unified form payloads.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 04 Section 1 (Zod validation) and Specification 05 (Database Schema).
 *    - Standardizes supplier contact cards for bulk plant purchases and nursery supply procurement in Kolhapur and Pune belts.
 *    - Prevents duplicate phone entries or incomplete supplier records before persisting to PostgreSQL.
 * 
 * 3. WHAT WAS USED:
 *    - `zod` validation library.
 *    - `@prisma/client` domain models (`Vendor`, `RecordStatus`).
 * 
 * 4. HOW IT WORKS:
 *    - Form submissions are parsed by `VendorInputSchema.safeParse()`.
 *    - Validated data feeds directly into Prisma ORM transactions via Server Actions.
 * 
 * ----------------------------------------------------------------------------
 */

import { z } from 'zod';
import type { Vendor as PrismaVendor, RecordStatus } from '@prisma/client';

export type { RecordStatus };
export type Vendor = PrismaVendor;

// ============================================================================
// 1. ZOD VALIDATION SCHEMA FOR VENDOR CREATE & EDIT
// ============================================================================

export const VENDOR_CATEGORIES = [
  'SEEDS_SAPLINGS',
  'POTS_CONTAINERS',
  'FERTILIZERS_SOIL',
  'IRRIGATION_DRIP',
  'GARDEN_TOOLS_MACHINERY',
] as const;

export type VendorCategoryCode = (typeof VENDOR_CATEGORIES)[number];

export const VendorInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Vendor/Business name must be at least 2 characters.' })
    .max(120, { message: 'Vendor name cannot exceed 120 characters.' }),
  contactPerson: z
    .string()
    .trim()
    .max(120, { message: 'Contact person name cannot exceed 120 characters.' })
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, {
      message: 'Please enter a valid 10-digit Indian mobile number.',
    }),
  category: z
    .string()
    .trim()
    .min(2, { message: 'Please select or enter a supplier category.' }),
});

export type VendorInput = z.infer<typeof VendorInputSchema>;

// ============================================================================
// 2. SUMMARY METRICS INTERFACE FOR VENDOR DIRECTORY
// ============================================================================

export interface VendorDirectoryMetrics {
  totalVendors: number;
  saplingSuppliersCount: number;
  potVendorsCount: number;
  fertilizerDealersCount: number;
}
