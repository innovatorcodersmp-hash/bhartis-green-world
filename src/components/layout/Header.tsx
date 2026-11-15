/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/layout/Header.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built the fixed 64px top Header component for Bharti's Green World ERP.
 *    - Integrated the official botanical brand logo (`/images/logo.png`) on an enlarged high-contrast rounded badge.
 *    - Provided generous 72px x 46px image proportions to ensure both the emblem and botanical text are clearly visible.
 *    - Shifted brand identity to the left edge with fluid edge-to-edge navbar container layout.
 *    - Rendered Kolhapur facility banner and accessible hamburger drawer trigger.
 *    - Enforced the 44px x 44px mobile touch target on the menu toggle button.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fixes small/unclear logo rendering by expanding dimensions and eliminating cramped circular boundary limits.
 *    - Provides persistent orientation, identity, and navigation access across all ERP pages.
 *    - Ensures nursery workers in bright outdoor sunlight have high contrast and large touch areas.
 *    - Eliminates hardcoded route URLs by navigating home via APP_ROUTES.DASHBOARD.
 * 
 * 3. WHAT WAS USED:
 *    - React client component ('use client').
 *    - Next.js `Link` primitive and `Image` component (`next/image`).
 *    - Lucide React icons (`Menu`, `X`).
 *    - SCSS Modules mapped to design tokens (`Header.module.scss`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Receives `onToggleDrawer` and `isDrawerOpen` callbacks from `<PageLayout>`.
 *    - Clicking the hamburger button opens or closes the mobile slide-out navigation drawer.
 *    - Renders brand badge with optimized priority image loading.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import styles from './Header.module.scss';

export interface HeaderProps {
  onToggleDrawer?: () => void;
  isDrawerOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleDrawer,
  isDrawerOpen = false,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Brand Identity / Home Navigation */}
        <Link href={APP_ROUTES.DASHBOARD} className={styles.brand} aria-label="Go to Dashboard">
          <div className={styles.logoBadge}>
            <Image
              src="/images/logo.png"
              alt="Bharti's Green World Logo"
              width={72}
              height={46}
              className={styles.headerLogoImage}
              priority
              unoptimized
            />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>BHARTI&apos;S GREEN WORLD</span>
            <span className={styles.brandSubtitle}>Nursery & Landscaping ERP • Kolhapur</span>
          </div>
        </Link>

        {/* Header Right Actions / Hamburger Trigger */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={onToggleDrawer}
            aria-label={isDrawerOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            aria-expanded={isDrawerOpen}
          >
            {isDrawerOpen ? (
              <X size={24} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Menu size={24} strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
