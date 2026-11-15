# 04. Backend API & Data Mutation Rules
**Project:** Bharti's Green World ERP (Kolhapur)  
**Author / Lead Architect:** Saniya Patil  
**Architecture:** Next.js App Router (Server Actions + API Routes)  

---

## 1. Core Backend Architecture & Strict CRUD Consistency

### 1.1 Next.js Server Actions First
- For all record mutations, **Next.js Server Actions (`'use server'`)** are the primary pattern.
- Store Server Actions inside module-specific action files: `@/modules/<feature-name>/actions/`.

### 1.2 Absolute Zero Hardcoding Rule (STRICT)
- **NO HARDCODED VALUES:** API endpoint URLs, database strings, or configuration constants MUST NEVER be hardcoded inside Server Actions or API routes.
- Import constants from `@/lib/constants/` or environment variables (`process.env`).

### 1.3 Standard ORM Usage (NO RAW SQL)
- Raw SQL queries are strictly forbidden. All queries must use standard ORM methods (`findMany`, `create`, `update`, `delete`, `transaction`).

---

## 2. Universal Try-Catch & Error Handling

- Every Server Action must be wrapped in a structured `try-catch` block returning `{ success: boolean; data?: T; error?: string }`.
