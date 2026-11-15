/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/labor/actions/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all Employee Directory & Credentials Server Actions.
 *    - Exported `getEmployeesAction`, `getEmployeeByIdAction`, `createEmployeeAction`,
 *      `updateEmployeeAction`, and `deleteEmployeeAction`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Standardizes server action imports across labor forms and employee list modules.
 *    - Keeps transactional Prisma logic decoupled from client UI components.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Imported by `@/modules/labor/actions` across the application.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './laborActions';
