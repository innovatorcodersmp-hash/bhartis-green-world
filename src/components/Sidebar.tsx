/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/Sidebar.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Created `<Sidebar>` navigation wrapper component pointing directly to the upgraded
 *      botanical glassmorphism `<HamburgerDrawer>` navigation system.
 *    - Exports both `<Sidebar>` and `<HamburgerDrawer>` for unified import flexibility.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Upgrade the sidebar / navigation menu items across the ERP layout with a high-end glassmorphism hover and active state using a rich, botanical-complementary color scheme (src/components/Sidebar.tsx or navigation component)".
 *    - Ensures modular aliasing and standard ERP sidebar interface compatibility.
 * 
 * 3. WHAT WAS USED:
 *    - Re-export of `@/components/layout/HamburgerDrawer`.
 * 
 * 4. HOW IT WORKS:
 *    - Acts as a canonical direct import path for the ERP navigation menu component.
 * 
 * ----------------------------------------------------------------------------
 */

import { HamburgerDrawer, HamburgerDrawerProps } from './layout/HamburgerDrawer';

export { HamburgerDrawer as Sidebar, HamburgerDrawer };
export type { HamburgerDrawerProps as SidebarProps };
export default HamburgerDrawer;

