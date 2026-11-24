/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/landscaping/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established TypeScript interfaces and Zod validation schemas (`SiteVisitInputSchema`)
 *      for routine Landscaping Site Visits and Maintenance Logs.
 *    - Structured domain model contracts for client name, 10-digit mobile, site name,
 *      visit date, areas/plants checked, work done tags, site status, replacement notes,
 *      and next visit scheduling.
 *    - Defined `SiteVisitWithRelations` and `SiteVisitDirectoryMetrics` for supervisor tracking.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT SITE VISIT & MAINTENANCE WHATSAPP UPDATE".
 *    - Standardizes site inspection records and ensures data integrity before dispatching
 *      manual WhatsApp updates to nursery landscape clients.
 * 
 * 3. WHAT WAS USED:
 *    - `zod` runtime schema validator.
 *    - `@prisma/client` domain models (`SiteVisit`, `GardenContract`, `RecordStatus`).
 * 
 * ----------------------------------------------------------------------------
 */

import { z } from 'zod';
import type {
  SiteVisit as PrismaSiteVisit,
  GardenContract,
  RecordStatus,
} from '@prisma/client';

export type { RecordStatus };
export type SiteVisit = PrismaSiteVisit;

export type SiteVisitWithRelations = SiteVisit & {
  contract?: GardenContract | null;
};

// ============================================================================
// 1. CONSTANTS FOR SITE VISITS & MAINTENANCE
// ============================================================================

export const WORK_DONE_TAGS = [
  'Pruning',
  'Organic Pest Spray',
  'Irrigation Check',
  'Fertilizing',
  'Soil Conditioning',
  'Lawn Mowing',
  'Weeding & Cleaning',
] as const;

export type WorkDoneTag = (typeof WORK_DONE_TAGS)[number];

export const SITE_STATUSES = [
  'Healthy',
  'Minor Replacements Needed',
  'Attention Required',
] as const;

export type SiteStatusType = (typeof SITE_STATUSES)[number];

// ============================================================================
// 2. ZOD VALIDATION SCHEMA FOR SITE VISIT LOG
// ============================================================================

export const SiteVisitInputSchema = z.object({
  contractId: z.string().trim().optional().nullable(),
  siteName: z
    .string()
    .trim()
    .min(2, { message: 'Site / project name must be at least 2 characters.' })
    .max(120, { message: 'Site name cannot exceed 120 characters.' }),
  customerName: z
    .string()
    .trim()
    .min(2, { message: 'Customer name must be at least 2 characters.' })
    .max(100, { message: 'Customer name cannot exceed 100 characters.' }),
  customerMobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit Indian mobile number.' }),
  visitDate: z
    .string()
    .trim()
    .min(1, { message: 'Visit date is required.' }),
  areasChecked: z
    .string()
    .trim()
    .min(2, { message: 'Please specify the area or plants checked.' })
    .max(255, { message: 'Area description cannot exceed 255 characters.' }),
  workDone: z
    .string()
    .trim()
    .min(2, { message: 'Work done summary cannot be empty.' })
    .max(1000, { message: 'Work done cannot exceed 1000 characters.' }),
  siteStatus: z
    .enum(SITE_STATUSES, { message: 'Please select a valid site status.' })
    .default('Healthy'),
  replacementCount: z.coerce
    .number()
    .int({ message: 'Replacement count must be a whole number.' })
    .min(0, { message: 'Replacement count cannot be negative.' })
    .default(0),
  replacementNotes: z
    .string()
    .trim()
    .max(500, { message: 'Replacement notes cannot exceed 500 characters.' })
    .optional()
    .nullable(),
  nextVisitDate: z
    .string()
    .trim()
    .optional()
    .nullable(),
  supervisorNotes: z
    .string()
    .trim()
    .max(1000, { message: 'Supervisor notes cannot exceed 1000 characters.' })
    .optional()
    .nullable(),
});

export type SiteVisitInput = z.infer<typeof SiteVisitInputSchema>;

// ============================================================================
// 3. SUMMARY METRICS CONTRACT FOR SITE VISITS DIRECTORY
// ============================================================================

export interface SiteVisitDirectoryMetrics {
  totalVisits: number;
  healthyCount: number;
  replacementsCount: number;
  attentionCount: number;
}

