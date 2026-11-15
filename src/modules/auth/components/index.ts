/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/auth/components/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all authentication UI components.
 *    - Exported `<LoginForm />`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Strict Modular Feature Organization".
 *    - Provides a unified barrel export for routing shells (`app/(auth)/login/page.tsx`).
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Routing pages import `{ LoginForm }` directly from `@/modules/auth/components`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './LoginForm';
