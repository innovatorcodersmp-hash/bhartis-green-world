/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/auth/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Defined TypeScript interfaces and Zod schema (`LoginInputSchema`) for employee authentication.
 *    - Declared contracts for login inputs, session payloads, and authenticated user credentials.
 *    - Structured composite session state types (`AuthSessionUser`, `AuthSessionState`) for counter operators.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 04 Section 1 (Zod validation contracts).
 *    - Protects the ERP from malformed or injection-prone credentials before hitting database queries.
 *    - Provides a unified contract for active cashier and staff session verification.
 * 
 * 3. WHAT WAS USED:
 *    - `zod` library for runtime validation and static type inference.
 *    - TypeScript interfaces.
 * 
 * 4. HOW IT WORKS:
 *    - Login forms validate user inputs against `LoginInputSchema.safeParse()`.
 *    - Upon successful authentication, user session records are serialized matching `AuthSessionUser`.
 * 
 * ----------------------------------------------------------------------------
 */

import { z } from 'zod';

// ============================================================================
// 1. ZOD VALIDATION SCHEMA FOR CREDENTIAL LOGIN
// ============================================================================

export const LoginInputSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, { message: 'Username is required.' })
    .max(50, { message: 'Username cannot exceed 50 characters.' })
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(1, { message: 'Password / PIN is required.' })
    .max(100, { message: 'Password cannot exceed 100 characters.' }),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

// ============================================================================
// 2. AUTHENTICATED USER & ACTIVE SESSION CONTRACTS
// ============================================================================

export interface AuthSessionUser {
  id: string;
  name: string;
  username: string;
  phone: string;
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  user: AuthSessionUser | null;
}
