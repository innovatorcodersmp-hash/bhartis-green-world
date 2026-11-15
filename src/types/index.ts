/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Defined universal TypeScript types and interfaces for the ERP ecosystem.
 *    - Specified standard audit lifecycle statuses ('ACTIVE', 'INACTIVE', 'ARCHIVED') and timestamps.
 *    - Declared universal Server Action response signature `ActionResult<T>`.
 *    - Created pagination and filter interfaces for TanStack DataTables.
 * 
 * 2. WHY IT WAS DONE:
 *    - To enforce strict database and API consistency across all modules.
 *    - To fulfill the mandatory try-catch Server Action standard returning uniform `{ success, data, error }`.
 *    - To provide compile-time type safety across frontend UI components and backend ORM transactions.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript generic types, union types, and interface contracts.
 * 
 * 4. HOW IT WORKS:
 *    - All Server Actions and module types import from `@/types` to ensure uniform contract compliance.
 * 
 * ----------------------------------------------------------------------------
 */

// ============================================================================
// 1. DATABASE & AUDIT LIFECYCLE TYPES
// ============================================================================
export type RecordStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface AuditFields {
  status: RecordStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 2. SERVER ACTION & API RETURN CONTRACT
// ============================================================================
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// ============================================================================
// 3. PAGINATION & DATATABLE QUERY PARAMS
// ============================================================================
export interface PaginationParams {
  pageIndex: number;
  pageSize: number;
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  statusFilter?: RecordStatus;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}
