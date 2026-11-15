/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established TypeScript interfaces and Zod validation schemas (`ContractInputSchema`,
 *      `EstimateInputSchema`, `RecordPaymentInputSchema`) for Landscaping Projects, Garden Contracts,
 *      Milestone Stage Payments, and Quotation Estimates.
 *    - Automated contract number formatting to sequential BGW prefix standard (`BGW-CNT-YYYY-XXXX`):
 *      accommodates optional/pre-filled contract numbers that auto-generate safely on submission.
 *    - Enhanced `ContractInputSchema` to support auto-registration of walk-in/new clients:
 *      accommodates either existing `customerId` or new `clientName` + `clientPhone`.
 *    - Declared data contracts for contract numbers, client FKs, site addresses, project types
 *      (`LAWN`, `ORCHARD`, `RESIDENTIAL`, `DRIP_IRRIGATION`), plot sizes, financial estimates,
 *      advances, progress percentages, milestone stages, and site supervisor notes.
 *    - Integrated `GardenContractPayment` domain models and `PaymentMode` (`CASH`, `UPI`, `CREDIT_UDHAR`)
 *      to track milestone stage disbursements and advance payment ledgers.
 *    - Defined `MilestoneInvoicePayload` contract for generating executive A4 stage invoice PDFs.
 *    - Added comprehensive types for `LandscapingEstimate`: estimate numbers, client profile, plot dimensions,
 *      itemized lines (`EstimateLineItem`), labor breakdown, material totals, and lifecycle statuses (`EstimateStatus`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: AUTOMATE CONTRACT NUMBER GENERATION WITH BGW PREFIX IN LANDSCAPING MODULE".
 *    - Standardizes contract tracking codes across Kolhapur nursery landscape operations.
 *    - Guarantees referential integrity between customer ledgers and landscaping contract records.
 *    - Eliminates duplicate customer entry and ensures automatic registration of walk-in site owners in Kolhapur.
 * 
 * 3. WHAT WAS USED:
 *    - `zod` runtime schema validator.
 *    - `@prisma/client` domain models (`GardenContract`, `GardenContractPayment`, `PaymentMode`, `Customer`,
 *      `ProjectType`, `ContractStage`, `RecordStatus`, `LandscapingEstimate`, `EstimateStatus`).
 * 
 * 4. HOW IT WORKS:
 *    - Client forms and Server Actions validate input payloads against schemas.
 *    - Sanitized data commits directly to PostgreSQL via Prisma ORM transactions.
 * 
 * ----------------------------------------------------------------------------
 */

import { z } from 'zod';
import type {
  GardenContract as PrismaGardenContract,
  GardenContractPayment as PrismaGardenContractPayment,
  PaymentMode,
  Customer,
  ProjectType,
  ContractStage,
  RecordStatus,
  LandscapingEstimate as PrismaLandscapingEstimate,
  EstimateStatus,
} from '@prisma/client';

export type { Customer, ProjectType, ContractStage, RecordStatus, EstimateStatus, PaymentMode };
export type GardenContract = PrismaGardenContract;
export type GardenContractPayment = PrismaGardenContractPayment;
export type LandscapingEstimate = PrismaLandscapingEstimate;

export type GardenContractWithRelations = GardenContract & {
  customer: Customer;
  payments?: GardenContractPayment[];
};

// ============================================================================
// 1. ZOD VALIDATION SCHEMA FOR GARDEN CONTRACTS
// ============================================================================

export const ContractInputSchema = z
  .object({
    contractNo: z
      .string()
      .trim()
      .max(60, { message: 'Contract number cannot exceed 60 characters.' })
      .transform((val) => val.toUpperCase())
      .optional()
      .or(z.literal('')),
    customerId: z
      .string()
      .trim()
      .optional()
      .nullable(),
    clientName: z
      .string()
      .trim()
      .optional()
      .nullable(),
    clientPhone: z
      .string()
      .trim()
      .optional()
      .nullable(),
    siteAddress: z
      .string()
      .trim()
      .min(3, { message: 'Site location address must be at least 3 characters.' })
      .max(255, { message: 'Site address cannot exceed 255 characters.' }),
    projectType: z.enum(['LAWN', 'ORCHARD', 'RESIDENTIAL', 'DRIP_IRRIGATION'], {
      message: 'Please select a valid project classification (Lawn, Orchard, Residential, or Drip Irrigation).',
    }),
    plotSize: z
      .string()
      .trim()
      .min(1, { message: 'Please specify the plot or lawn dimension.' })
      .max(80, { message: 'Plot size description cannot exceed 80 characters.' }),
    totalEstimate: z.coerce
      .number()
      .min(0, { message: 'Total estimate cannot be negative.' }),
    advanceReceived: z.coerce
      .number()
      .min(0, { message: 'Advance amount cannot be negative.' })
      .default(0),
    currentStage: z
      .enum(['SITE_PREP', 'PLANTING', 'IRRIGATION_SETUP', 'MAINTENANCE_HANDOVER'], {
        message: 'Please select a valid execution stage.',
      })
      .default('SITE_PREP'),
    progressPercent: z.coerce
      .number()
      .int({ message: 'Progress must be an integer percentage.' })
      .min(0, { message: 'Progress percentage cannot be less than 0%.' })
      .max(100, { message: 'Progress percentage cannot exceed 100%.' })
      .default(0),
    supervisorNotes: z
      .string()
      .trim()
      .max(1000, { message: 'Supervisor notes cannot exceed 1000 characters.' })
      .optional()
      .nullable()
      .transform((val) => val || null),
  })
  .refine(
    (data) => {
      // Either a valid registered customerId is provided, or clientName and clientPhone for walk-in
      if (data.customerId && data.customerId !== 'WALK_IN_NEW') {
        return true;
      }
      return Boolean(data.clientName && data.clientPhone);
    },
    {
      message: 'Please select a registered client or provide client name and mobile number.',
      path: ['customerId'],
    }
  );

export type ContractInput = z.infer<typeof ContractInputSchema>;

// ============================================================================
// 2. TYPES & SCHEMA FOR CONTRACT STAGE PAYMENTS & ADVANCES
// ============================================================================

export const RecordPaymentInputSchema = z.object({
  contractId: z.string().trim().min(1, { message: 'Contract ID is required.' }),
  amount: z.coerce
    .number()
    .positive({ message: 'Payment amount must be greater than zero.' }),
  paymentMode: z
    .enum(['CASH', 'UPI', 'CREDIT_UDHAR'], {
      message: 'Please select a valid payment mode (Cash, UPI, or Credit/Udhar).',
    })
    .default('UPI'),
  stageName: z
    .string()
    .trim()
    .min(1, { message: 'Milestone stage is required.' })
    .max(100, { message: 'Stage name cannot exceed 100 characters.' }),
  notes: z
    .string()
    .trim()
    .max(500, { message: 'Notes cannot exceed 500 characters.' })
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type RecordPaymentInput = z.infer<typeof RecordPaymentInputSchema>;

export interface MilestoneInvoicePayload {
  contract: GardenContractWithRelations;
  stageName: string;
  invoiceAmount: number;
  invoiceDate: string;
  receiptNo?: string;
  previousPaid: number;
  totalPaid: number;
  balanceDue: number;
  notes?: string | null;
}

// ============================================================================
// 3. TYPES & SCHEMA FOR LANDSCAPING ESTIMATES & QUOTATIONS
// ============================================================================

export interface EstimateLineItem {
  id?: string;
  description: string;
  category?: string; // 'LAWN' | 'PLANTS' | 'SOIL' | 'IRRIGATION' | 'LABOR' | 'HARDSCAPE'
  qty: number;
  unitRate: number;
  total: number;
}

export const EstimateLineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().trim().min(1, 'Item description is required.'),
  category: z.string().trim().optional(),
  qty: z.coerce.number().min(0.01, 'Quantity must be greater than zero.'),
  unitRate: z.coerce.number().min(0, 'Unit rate cannot be negative.'),
  total: z.coerce.number().min(0, 'Total cannot be negative.'),
});

export const EstimateInputSchema = z.object({
  estimateNo: z.string().trim().optional(),
  customerId: z.string().trim().optional().nullable(),
  clientName: z.string().trim().min(2, 'Client name must be at least 2 characters.'),
  clientPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit Indian mobile number.' }),
  siteLocation: z.string().trim().min(3, 'Site location address is required.'),
  plotArea: z.string().trim().min(1, 'Plot area dimension is required.'),
  scopeOfWork: z.string().trim().optional().nullable(),
  lineItems: z.array(EstimateLineItemSchema).default([]),
  laborCharges: z.coerce.number().min(0).default(0),
  materialTotal: z.coerce.number().min(0).default(0),
  grandTotal: z.coerce.number().min(0).default(0),
  status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'CONVERTED']).default('DRAFT'),
});

export type EstimateInput = z.infer<typeof EstimateInputSchema>;

// Parsed estimate with strongly typed line items
export type LandscapingEstimateWithParsedItems = Omit<LandscapingEstimate, 'lineItems'> & {
  lineItems: EstimateLineItem[];
};

// ============================================================================
// 4. SUMMARY METRICS CONTRACTS FOR DIRECTORY
// ============================================================================

export interface ContractDirectoryMetrics {
  totalContracts: number;
  lawnOrchardCount: number;
  totalEstimatedValue: number;
  pendingDues: number;
}

export interface EstimateDirectoryMetrics {
  totalEstimates: number;
  draftCount: number;
  sentApprovedCount: number;
  convertedCount: number;
  totalPipelineValue: number;
}
