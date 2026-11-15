/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/layout/HamburgerDrawer.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Refined navigation menu styling with high-contrast, botanical flower accents:
 *      * Text Color: Warm off-white (#F5F0E6) for active, muted cream-gray (rgba(245,240,230,0.65)) for inactive.
 *      * Section/Footer Text: Muted cream-gray, completely eliminating monochrome green fatigue.
 *      * Drawer Background: Darker, neutral deep green-charcoal (#0F1A14) with subtle radial gradient.
 *      * Inactive Item Hover: Clean translucent glass (rgba(255,255,255,0.05)), not green.
 *      * Icon Tiles: Wrapped each icon in a 36px rounded-xl tile with 15% opacity accent background and full accent icon.
 *      * Active Item: Removed bright green gradient pill. Uses item's own accent at 12% opacity, 1px border at 30% opacity,
 *        a 3px left indicator bar in full accent color, and matching accent right dot.
 *      * Brand green strictly preserved for Header logo, Sprout header icon, and primary buttons.
 *    - Maintained ergonomic 48px touch targets for nursery field staff and billing counter operators.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Refine the navigation menu (sidebar/mobile drawer) styling only. Do NOT change functionality,
 *      routes or layout structure."
 *    - Eliminates excessive monochrome green saturation while ensuring WCAG AA contrast and mobile/PWA ergonomics.
 * 
 * 3. WHAT WAS USED:
 *    - React client hooks (`useState`, `useEffect`, `useCallback`, `useTransition`).
 *    - Next.js `Link` and `usePathname` navigation primitives.
 *    - Lucide React icons.
 *    - SCSS Modules mapped to CSS variables and design tokens (`HamburgerDrawer.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Maps each route to its designated botanical flower accent.
 *    - Inactive items render with muted cream-gray labels and 36px accent tiles.
 *    - Active items dynamically display accent indicator bars, accent borders, accent-tinted backgrounds, and accent dots.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Sprout,
  Users,
  Truck,
  Package,
  Receipt,
  FileText,
  UserCheck,
  BarChart3,
  Settings,
  X,
  LogOut,
  Calendar,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import { logoutEmployeeAction, getCurrentUserAction } from '@/modules/auth/actions';
import styles from './HamburgerDrawer.module.scss';

export interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export type NavAccent =
  | 'green'
  | 'hibiscus'
  | 'sky'
  | 'marigold'
  | 'sunflower'
  | 'lavender'
  | 'coral'
  | 'neutral';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  exactMatch?: boolean;
  accent: NavAccent;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: APP_ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    exactMatch: true,
    accent: 'green',
  },
  {
    label: 'Plants',
    href: APP_ROUTES.PLANTS,
    icon: Sprout,
    accent: 'green',
  },
  {
    label: 'Customers',
    href: APP_ROUTES.CUSTOMERS,
    icon: Users,
    accent: 'hibiscus',
  },
  {
    label: 'Suppliers',
    href: APP_ROUTES.VENDORS,
    icon: Truck,
    accent: 'sky',
  },
  {
    label: 'Plant Stock',
    href: APP_ROUTES.INVENTORY,
    icon: Package,
    accent: 'marigold',
  },
  {
    label: 'Billing Counter',
    href: APP_ROUTES.POS,
    icon: Receipt,
    accent: 'sunflower',
  },
  {
    label: 'Landscaping Contracts',
    href: APP_ROUTES.CONTRACTS,
    icon: FileText,
    accent: 'lavender',
  },
  {
    label: 'Employee',
    href: APP_ROUTES.LABOR,
    icon: UserCheck,
    accent: 'coral',
  },
  {
    label: 'Reports & Audits',
    href: APP_ROUTES.REPORTS,
    icon: BarChart3,
    accent: 'lavender',
  },
  {
    label: 'Settings',
    href: APP_ROUTES.SETTINGS,
    icon: Settings,
    accent: 'neutral',
  },
];

export const HamburgerDrawer: React.FC<HamburgerDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  // User session state and client-mounted date state
  const [currentUser, setCurrentUser] = useState<{ name: string; username?: string } | null>(null);
  const [currentDateString, setCurrentDateString] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    // Retrieve active session user
    getCurrentUserAction().then((res) => {
      if (isMounted && res?.success && res.data) {
        setCurrentUser(res.data);
      }
    });

    // Format current date on client in Asia/Kolkata timezone to avoid hydration mismatch
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      setCurrentDateString(formatter.format(now));
    } catch {
      const now = new Date();
      setCurrentDateString(now.toDateString());
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const userName = currentUser?.name || 'Admin';
  // const userRole = currentUser?.username === 'admin' ? 'Admin' : 'Owner account';
  const initial = (userName.trim()[0] || 'A').toUpperCase();

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutEmployeeAction();
      onClose();
      router.push(APP_ROUTES.LOGIN);
      router.refresh();
    });
  };

  // Close drawer on Escape key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isItemActive = (item: NavItem): boolean => {
    if (item.href === APP_ROUTES.DASHBOARD) {
      return pathname === '/' || pathname === '/dashboard';
    }
    if (item.exactMatch) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Dimmed Overlay Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Navigation Drawer */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.open : ''}`}
        aria-label="Main Navigation Menu"
        aria-hidden={!isOpen}
      >
        {/* Drawer Header with User Card, Date Line, and Tricolor Divider */}
        <header className={styles.drawerHeader} aria-label="User Account and Drawer Controls">
          <div className={styles.headerTopRow}>
            {/* User Profile Card */}
            <div className={styles.userCard}>
              <div className={styles.avatarWrapper} aria-hidden="true">
                <div className={styles.avatar}>{initial}</div>
                <span className={styles.onlineDot} title="Online" />
              </div>

              <div className={styles.userInfo}>
                <span className={styles.userName}>{userName}</span>
                {/* <span className={styles.userRole}>{userRole}</span> */}
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              <X size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          {/* Date Line directly below user card */}
          <div className={styles.dateLine}>
            <Calendar size={16} className={styles.calendarIcon} aria-hidden="true" />
            <span>{currentDateString || 'Today'}</span>
          </div>

          {/* 2px Tricolor Segmented Divider */}
          <div className={styles.tricolorDivider} aria-hidden="true" />
        </header>

        {/* Navigation Link Items */}
        <nav className={styles.navContainer}>
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const active = isItemActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${styles[item.accent]} ${active ? styles.active : ''}`}
                onClick={onClose}
              >
                <span className={styles.iconTile}>
                  <IconComponent size={19} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className={styles.label}>{item.label}</span>
                {active && <span className={styles.activeDot} aria-hidden="true" />}
              </Link>
            );
          })}

          {/* Logout Action Button */}
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Logout from ERP counter"
          >
            <span className={styles.iconTile}>
              <LogOut size={19} strokeWidth={2} />
            </span>
            <span className={styles.label}>
              {isLoggingOut ? 'Logging out...' : 'Logout from ERP'}
            </span>
          </button>
        </nav>

        {/* Drawer Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLinks}>
            <Link href={APP_ROUTES.ABOUT} onClick={onClose}>
              About
            </Link>
            <span>•</span>
            <Link href={APP_ROUTES.PRIVACY} onClick={onClose}>
              Privacy Policy
            </Link>
          </div>
          <span className={styles.facilityInfo}>Bharti&apos;s Green World • Kolhapur</span>
          <span className={styles.appVersion}>ERP System</span>
        </div>
      </aside>
    </>
  );
};
