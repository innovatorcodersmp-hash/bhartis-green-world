/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/lib/prisma.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established the global PrismaClient singleton instance for Bharti's Green World ERP.
 *    - Implemented globalThis caching to prevent connection pool exhaustion during Next.js Hot Module Replacement (HMR).
 * 
 * 2. WHY IT WAS DONE:
 *    - Complies with Engineering Guideline 04 (Backend API & Data Mutation Rules) Section 1.3: Standard ORM Usage.
 *    - Ensures reliable database query execution for Next.js Server Actions with zero raw SQL.
 * 
 * 3. WHAT WAS USED:
 *    - `@prisma/client` library.
 *    - Node.js global singleton pattern.
 * 
 * 4. HOW IT WORKS:
 *    - Server Actions import `prisma` from `@/lib/prisma`.
 *    - Reuses the active client in development across server reloads and instantiates a clean instance in production.
 * 
 * ----------------------------------------------------------------------------
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
