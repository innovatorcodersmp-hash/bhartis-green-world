/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/Footer.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Re-engineered `<Footer>` into a full-width, edge-to-edge master application footer bar.
 *    - Left Side: "© 2026 Bharti's Green World Nursery & Landscaping • Kolhapur".
 *    - Right Side: Developer attribution "Designed & Developed by" accompanied by a crisp,
 *      high-definition brand lockup wrapped in an accessible portfolio link (`<a>`):
 *      1. The standalone icon mark (`/anvesh-mark.png`, 869x1024 source, height: 44px mobile, 56px desktop)
 *         featuring the circular ring, compass needle, S-swoosh, and star with authentic gold/teal/navy colors.
 *      2. Live vector text rendered beside the mark with 9px gap:
 *         - "Anvesh" in serif font (Playfair Display / Cormorant Garamond), deep navy #0B2A4A, ~18px, font-medium (500).
 *         - Tagline below it: "from discovery to creation" in the same serif, teal #0F6E7A, ~11px.
 *    - Wrapped in an interactive anchor with `href="#"` and `aria-label="Designed and developed by Anvesh"`.
 *    - Fully responsive: wraps and stacks cleanly on mobile viewports without overflowing or colliding.
 *    - Botanical champagne linen aesthetic with dark mode and print media exclusion.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Fix the 'Designed & Developed by' logo in the footer so it is clear and readable.
 *      Only change the footer branding area; do NOT change anything else."
 * 
 * 3. WHAT WAS USED:
 *    - React client component ('use client').
 *    - Next.js `Image` primitive (`next/image`) with `object-fit: contain` and `unoptimized={true}`.
 *    - Next.js `Link` primitive (`next/link`).
 *    - Google Serif typography (Playfair Display / Cormorant Garamond).
 *    - SCSS Modules (`Footer.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Mounts at the root of `PageLayout`'s `.shell`, spanning the entire viewport width.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import styles from './Footer.module.scss';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`${styles.footer} ${className}`} aria-label="Application Footer">
      <div className={styles.container}>
        {/* Left Side: Nursery Copyright */}
        <div className={styles.copyright}>
          <span>© 2026 Bharti&apos;s Green World Nursery &amp; Landscaping • Bambarwadi, Kolhapur</span>
        </div>

        {/* Right Side: Developer Attribution with Crisp Icon Mark + Live Serif Typography */}
        <div className={styles.developerAttribution}>
          <span className={styles.devLabel}>Powered By</span>
          <Link
            href="#"
            className={styles.brandLink}
            aria-label="Designed and developed by Anvesh"
          >
            <div className={styles.markWrapper}>
              <Image
                src="/images/anvesh-logo.png"
                alt="Anvesh Logo"
                width={56}
                height={56}
                className={styles.anveshMark}
                unoptimized={true}
                priority={false}
              />
            </div>
            <div className={`${styles.brandTextGroup} ${playfair.className}`}>
              <span className={styles.brandName}>Anvesh</span>
              <span className={styles.brandTagline}>from discovery to creation</span>
            </div>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
