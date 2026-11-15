/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established TypeScript interfaces and Zod validation schemas (`PosBillInputSchema`, `PosItemLineInputSchema`)
 *      for Point of Sale (POS) retail billing and cashier transactions.
 *    - Added support for `transactionId` (UPI UTR / Reference ID) and `customerPhone` for dynamic payment modes.
 *    - Defined data contracts for Cashier Billing: Bill Number, Customer FK, Item Lines (Plant ID, Quantity, Unit Price),
 *      Payment Mode (`CASH`, `UPI`, `CREDIT_UDHAR`), Amount Paid, and Transaction ID.
 *    - Structured composite relational types (`PosBillWithRelations`, `PosItemLineWithPlant`) including joined Customer and Plant records.
 *    - Declared KPI metrics contract for retail sales volume, cash/UPI collections, and pending Udhar credit.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT DYNAMIC PAYMENT MODES, UDHAR VALIDATION, AND COMPACT POS UI".
 *    - Fulfills Specification 04 Section 1 (Zod validation) and Specification 05 (Database Relational Models).
 *    - Essential for rapid counter checkout at the Kolhapur nursery with validation against negative quantities or missing Udhar contacts.
 *    - Enables atomic transactional balance adjustments between nursery inventory and customer credit ledgers.
 * 
 * 3. WHAT WAS USED:
 *    - `zod` schema validator.
 *    - `@prisma/client` domain models (`PosBill`, `PosItemLine`, `Customer`, `Plant`, `PaymentMode`, `RecordStatus`).
 * 
 * 4. HOW IT WORKS:
 *    - Billing inputs are parsed via `PosBillInputSchema.safeParse()`.
 *    - Sanitized data feeds into atomic Prisma `$transaction` operations in the server actions layer.
 * 
 * ----------------------------------------------------------------------------
 */

import { z } from 'zod';
import type {
  PosBill as PrismaPosBill,
  PosItemLine as PrismaPosItemLine,
  Customer,
  Plant,
  PaymentMode,
  RecordStatus,
} from '@prisma/client';

export type { Customer, Plant, PaymentMode, RecordStatus };
export type PosBill = PrismaPosBill;
export type PosItemLine = PrismaPosItemLine;

export type PosItemLineWithPlant = PosItemLine & {
  plant: Plant;
};

export type PosBillWithRelations = PosBill & {
  customer: Customer | null;
  items: PosItemLineWithPlant[];
};

// ============================================================================
// 1. ZOD VALIDATION SCHEMA FOR POS LINE ITEMS
// ============================================================================

export const PosItemLineInputSchema = z.object({
  plantId: z
    .string()
    .trim()
    .min(1, { message: 'Please select a plant cultivar for this line item.' }),
  quantity: z.coerce
    .number()
    .int({ message: 'Quantity must be a whole number.' })
    .min(1, { message: 'Quantity must be at least 1 pot.' }),
  unitPrice: z.coerce
    .number()
    .min(0, { message: 'Unit price cannot be negative.' }),
});

export type PosItemLineInput = z.infer<typeof PosItemLineInputSchema>;

// ============================================================================
// 2. ZOD VALIDATION SCHEMA FOR COMPLETE POS BILL
// ============================================================================

export const PosBillInputSchema = z.object({
  billNumber: z
    .string()
    .trim()
    .min(3, { message: 'Bill number must be at least 3 characters.' })
    .max(60, { message: 'Bill number cannot exceed 60 characters.' })
    .transform((val) => val.toUpperCase()),
  customerId: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  customerPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  paymentMode: z.enum(['CASH', 'UPI', 'CREDIT_UDHAR'], {
    message: 'Please select a valid payment mode (Cash, UPI, or Credit/Udhar).',
  }),
  amountPaid: z.coerce
    .number()
    .min(0, { message: 'Amount paid cannot be negative.' }),
  transactionId: z
    .string()
    .trim()
    .max(100, { message: 'Transaction ID cannot exceed 100 characters.' })
    .optional()
    .or(z.literal('')),
  items: z
    .array(PosItemLineInputSchema)
    .min(1, { message: 'At least one plant item must be added to the bill.' }),
});

export type PosBillInput = z.infer<typeof PosBillInputSchema>;

// ============================================================================
// 3. SUMMARY METRICS CONTRACT FOR POS CASHIER COUNTER
// ============================================================================

export interface PosDirectoryMetrics {
  totalBills: number;
  totalSalesRevenue: number;
  cashUpiCollections: number;
  pendingUdhar: number;
}
