/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/ui/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all core UI primitive components and contracts.
 *    - Exported `<Button>`, `<Input>`, `<SearchableSelect>`, and `<MetricCard>`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Enforces the strict rule: "NO RAW HTML CONTROLS" across all feature modules.
 *    - Guarantees 44px minimum touch targets and 16px minimum font size for mobile zoom prevention.
 *    - Provides a unified barrel for simple, clean imports (`@/components/ui`).
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export architecture.
 * 
 * 4. HOW IT WORKS:
 *    - Any feature module imports UI primitives from `@/components/ui` without reaching into individual folders.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './Button/Button';
export * from './Input/Input';
export * from './SearchableSelect/SearchableSelect';
export * from './MetricCard/MetricCard';
