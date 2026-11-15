/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/customers/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established TypeScript interfaces and Zod validation schemas (`CustomerInputSchema`) for Customer CRM & Udhar Ledger.
 *    - Enforced strict 10-digit Indian mobile number validation (`/^[6-9]\d{9}$/`).
 *    - Defined data structures for tracking outstanding credit balances (`totalUdharDue`).
 *    - Declared directory metrics contract for live Udhar summary cards.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 04 Section 1 (Zod schema validation) and Specification 05 (Database Schema).
 *    - Prevents invalid phone numbers or negative credit balances from corrupting the customer ledger.
 *    - Enables reliable SMS / WhatsApp billing notifications and payment follow-ups.
 * 
 * 3. WHAT WAS USED:
 *    - `zod` schema declaration library.
 *    - `@prisma/client` domain types (`Customer`, `RecordStatus`).
 * 
 * 4. HOW IT WORKS:
 *    - Form input payloads pass through `CustomerInputSchema.safeParse()`.
 *    - Once validated, payloads feed safely into Prisma ORM transactions via Server Actions.
 * 
 * ----------------------------------------------------------------------------
 */

import { z } from 'zod';
import type { Customer as PrismaCustomer, RecordStatus } from '@prisma/client';

export type { RecordStatus };
export type Customer = PrismaCustomer;

// ============================================================================
// 1. ZOD VALIDATION SCHEMA FOR CUSTOMER CREATE & EDIT
// ============================================================================

export const CustomerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Customer name must be at least 2 characters.' })
    .max(120, { message: 'Customer name cannot exceed 120 characters.' }),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, {
      message: 'Please enter a valid 10-digit Indian mobile number.',
    }),
  address: z
    .string()
    .trim()
    .max(255, { message: 'Address cannot exceed 255 characters.' })
    .optional()
    .or(z.literal('')),
  totalUdharDue: z.coerce
    .number()
    .min(0, { message: 'Outstanding Udhar balance cannot be negative.' })
    .default(0.0),
});

export type CustomerInput = z.infer<typeof CustomerInputSchema>;

// ============================================================================
// 2. SUMMARY METRICS INTERFACE FOR CUSTOMER DIRECTORY & UDHAR LEDGER
// ============================================================================

export interface CustomerDirectoryMetrics {
  totalCustomers: number;
  totalActiveUdhar: number;
  customersWithDue: number;
  settledAccountsCount: number;
}
