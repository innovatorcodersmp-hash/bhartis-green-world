/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/layout/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Consolidated and exported all layout architecture components, contexts, and contracts.
 *    - Exported `<Header>`, `<HamburgerDrawer>`, `<PageLayout>`, `<LayoutProvider>`, and `useSetPageHeader`.
 * 
 * 2. WHY IT WAS DONE:
 *    - To establish clean, standardized module imports (`@/components/layout`).
 *    - To encapsulate layout implementation details away from consuming feature routes.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript barrel export convention.
 * 
 * 4. HOW IT WORKS:
 *    - Pages throughout the ERP import `{ PageLayout, LayoutProvider, useSetPageHeader }` directly from `@/components/layout`.
 * 
 * ----------------------------------------------------------------------------
 */

export * from './Header';
export * from './HamburgerDrawer';
export * from './PageLayout';
export * from './LayoutContext';
export * from '@/components/Footer';
