/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/labor/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established TypeScript interfaces and Zod validation schemas (`EmployeeInputSchema`)
 *      for Employee Directory, Staff Management, and POS Login Credentials Provisioning.
 *    - Declared contracts for full names, unique usernames, passwords, and mobile phone numbers.
 *    - Removed operational role & wage compensation fields per management workflow requirements.
 *    - Structured KPI metrics interface for total workforce, active roster, POS credentials,
 *      and mobile verified staff.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 04 Section 1 (Zod validation) and streamlined Staff Directory.
 *    - Enforces secure data sanitization (lowercase usernames, password length checks, 10-digit mobile phone).
 * 
 * 3. WHAT WAS USED:
 *    - `zod` schema validator.
 *    - `@prisma/client` domain models (`RecordStatus`).
 * 
 * 4. HOW IT WORKS:
 *    - User forms validate inputs via `EmployeeInputSchema.safeParse()`.
 *    - Sanitized records are stored in PostgreSQL through Prisma ORM methods in server actions.
 * 
 * ----------------------------------------------------------------------------
 */

import { z } from 'zod';
import type { RecordStatus } from '@prisma/client';

export type { RecordStatus };

export interface Employee {
  id: string;
  name: string;
  username: string | null;
  password?: string | null;
  phone: string;
  joiningDate?: Date;
  status: RecordStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 1. ZOD VALIDATION SCHEMA FOR EMPLOYEES & STAFF CREDENTIALS
// ============================================================================

export const EmployeeInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters.' })
    .max(100, { message: 'Full name cannot exceed 100 characters.' }),
  username: z
    .string()
    .trim()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(50, { message: 'Username cannot exceed 50 characters.' })
    .regex(/^[a-zA-Z0-9_.-]+$/, {
      message: 'Username can only contain letters, numbers, underscores, and dashes.',
    })
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(4, { message: 'Password must be at least 4 characters long.' })
    .max(100, { message: 'Password cannot exceed 100 characters.' }),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit Indian mobile number.' }),
});

export type EmployeeInput = z.infer<typeof EmployeeInputSchema>;

// ============================================================================
// 2. SUMMARY METRICS CONTRACT FOR LABOR & STAFF DIRECTORY
// ============================================================================

export interface LaborDirectoryMetrics {
  totalEmployees: number;
  activeStaff: number;
  posCredentialsCount: number;
  phoneVerifiedCount: number;
}
