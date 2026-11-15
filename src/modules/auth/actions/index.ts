/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/auth/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all authentication and session Server Actions.
 *    - Exported `loginEmployeeAction`, `loginAction`, `logoutEmployeeAction`, `logoutAction`, and `getCurrentUserAction`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Strict Modular Feature Organization".
 *    - Simplifies imports across client views and server-rendered routing shells.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Consumers import `{ loginEmployeeAction, logoutEmployeeAction }` directly from `@/modules/auth/actions`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './authActions';
