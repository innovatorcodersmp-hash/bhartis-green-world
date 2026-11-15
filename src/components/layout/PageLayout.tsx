/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/layout/PageLayout.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built the standard master `<PageLayout>` shell for Bharti's Green World ERP.
 *    - Integrated the fixed top `<Header>` (58px), slide-out `<HamburgerDrawer>`, and main content viewport.
 *    - Enforced mandatory bottom scroll clearance ($bottom-nav-clearance: 9rem / pb-36) to safeguard mobile ergonomics.
 *    - Supported props `title`, `subtitle`, and `primaryAction`, with automatic fallback to `LayoutContext`.
 * 
 * 2. WHY IT WAS DONE:
 *    - To fulfill Specification 03 (Shared UI Components) Section 2.1 Standard Page Shell.
 *    - To provide consistent visual hierarchy, navigation states, and zoom-safe container margins across every route.
 *    - To eliminate boilerplate repetition across individual page views while supporting dynamic page header actions.
 * 
 * 3. WHAT WAS USED:
 *    - React client component ('use client') with `useState`.
 *    - LayoutContext hook (`useLayoutContext`).
 *    - Modular components `<Header>` and `<HamburgerDrawer>`.
 *    - SCSS Modules mapped to design tokens (`PageLayout.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Manages drawer open/closed state locally.
 *    - Renders the header with the hamburger toggle callback.
 *    - Renders page header with title, subtitle, and primary action bar if provided via props or context.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Header } from './Header';
import { HamburgerDrawer } from './HamburgerDrawer';
import { useLayoutContext } from './LayoutContext';
import { Footer } from '@/components/Footer';
import styles from './PageLayout.module.scss';

export interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  primaryAction?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title: propTitle,
  subtitle: propSubtitle,
  primaryAction: propPrimaryAction,
}) => {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const context = useLayoutContext();

  const isAuthRoute = pathname === APP_ROUTES.LOGIN || pathname === '/login';

  if (isAuthRoute) {
    return <main className={styles.authShell}>{children}</main>;
  }

  const title = propTitle !== undefined ? propTitle : context.title;
  const subtitle = propSubtitle !== undefined ? propSubtitle : context.subtitle;
  const primaryAction =
    propPrimaryAction !== undefined ? propPrimaryAction : context.primaryAction;

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className={styles.shell}>
      {/* Fixed Top 58px Brand Header */}
      <Header onToggleDrawer={toggleDrawer} isDrawerOpen={isDrawerOpen} />

      {/* Slide-out Mobile/Desktop Navigation Drawer */}
      <HamburgerDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />

      {/* Main Content Container with Fixed Top Offset & pb-36 Clearance */}
      <div className={styles.contentWrapper}>
        {(title || primaryAction) && (
          <header className={styles.pageHeader}>
            <div className={styles.headerTitleGroup}>
              {title && <h1 className={styles.pageTitle}>{title}</h1>}
              {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
            </div>
            {primaryAction && (
              <div className={styles.primaryActionContainer}>
                {primaryAction}
              </div>
            )}
          </header>
        )}

        <main className={styles.mainBody}>{children}</main>
      </div>

      {/* Full-width Edge-to-Edge Master Application Footer */}
      <Footer />
    </div>
  );
};
