/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/SplashScreen.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Redesigned the launch overlay into a luxurious warm ivory and champagne linen flower palette (#f9f6f0).
 *    - Replaced the dark overlay with a soft radial linen-to-champagne backdrop (#fcfbfa to #f4efe6).
 *    - Nested `bgw.png` inside a frosted white-glass card (bg-white/80, backdrop-blur-2xl, border-emerald-900/10)
 *      with a delicate soft gold rim light, delivering high contrast for the circular brand emblem.
 *    - Styled typography in bold deep forest green (#11382c) and refined muted green (#3f624f).
 *    - Retained fast 600ms auto-fade transition on initial client hydration and session persistence checks.
 *    - Ensured unoptimized, direct static image resolution with automatic fallback chain.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Redesign the PWA splash screen and global app background to use a luxurious
 *      warm ivory and champagne linen flower palette (#f9f6f0) instead of green, making the bgw.png logo
 *      stand out with high-end contrast."
 *    - Eliminates dark background harshness and produces an elite botanical apothecary aesthetic.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 Client Component (`'use client'`, `useState`, `useEffect`, `useCallback`).
 *    - Next.js `<Image unoptimized />` with dynamic `onError` fallback.
 *    - Lucide React `Sprout` icon and scoped SCSS module (`SplashScreen.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Mounts on initial render with champagne ivory radial styling.
 *    - Progress fill completes across 550ms, followed by graceful opacity fade-out at 600ms,
 *      revealing the Live Nursery Command Center.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Sprout } from 'lucide-react';
import styles from './SplashScreen.module.scss';

export const SplashScreen: React.FC = () => {
  const [isMounted, setIsMounted] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [logoSrc, setLogoSrc] = useState<string>('/images/logo.png');

  const handleDismiss = useCallback(() => {
    setIsFading(true);
    const dismissTimer = setTimeout(() => {
      setIsMounted(false);
    }, 200);
    return () => clearTimeout(dismissTimer);
  }, []);

  const handleImageError = useCallback(() => {
    setLogoSrc((prev) => {
      if (prev === '/images/logo.png') return '/bgw.png';
      if (prev === '/bgw.png') return '/images/BGW.png';
      return prev;
    });
  }, []);

  useEffect(() => {
    // Check navigation type to detect reload vs internal routing
    let isReload = false;
    try {
      if (typeof performance !== 'undefined' && performance.getEntriesByType) {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          isReload = (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
        }
      }
    } catch {
      // Fallback
    }

    const hasShown = typeof window !== 'undefined' ? sessionStorage.getItem('bgw_splash_shown') : null;

    // If already shown in current tab session and NOT a hard reload, unmount immediately
    if (hasShown && !isReload) {
      setIsMounted(false);
      return;
    }

    try {
      sessionStorage.setItem('bgw_splash_shown', 'true');
    } catch {
      // Graceful fallback for privacy-restricted browser environments
    }

    // Gracefully fade out after 600ms on initial load / first client hydration
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 600);

    const unmountTimer = setTimeout(() => {
      setIsMounted(false);
    }, 900);

    const handleBeforeUnload = () => {
      try {
        sessionStorage.removeItem('bgw_splash_shown');
      } catch {
        // Safe no-op
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`${styles.splashOverlay} ${isFading ? styles.fadingOut : ''}`}
      onClick={handleDismiss}
      role="status"
      aria-label="Bharti's Green World ERP Launching"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(circle at 50% 42%, #fcfbfa 0%, #f4efe6 70%, #ebe3d5 100%)',
      }}
    >
      <div className={styles.splashContent}>
        {/* Logo Card Container with Soft Gold Rim Light */}
        <div className={styles.ambientGlowWrapper}>
          <div className={styles.ambientGlow} />
          <div className={styles.rimLightWrapper}>
            <div
              className={`${styles.frostedCard} bg-white/80 backdrop-blur-2xl border border-emerald-900/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(27,58,43,0.1)]`}
            >
              <Image
                src={logoSrc}
                alt="Bharti's Green World Logo"
                width={104}
                height={104}
                priority
                unoptimized
                loading="eager"
                onError={handleImageError}
                className={styles.logoImage}
              />
            </div>
          </div>
        </div>

        {/* Clean, Tracked-Wider Typography */}
        <h1 className={`${styles.title} text-[#11382c] tracking-widest font-extrabold uppercase`}>
          BHARTI&apos;S GREEN WORLD
        </h1>
        <p className={`${styles.subtitle} text-[#3f624f]`}>
          Nursery &amp; Landscaping ERP • Kolhapur
        </p>

        {/* Sleek Animated Gradient Progress Bar with Pulsing Leaf */}
        <div className={styles.loadingContainer}>
          <div className={styles.indicatorRow}>
            <Sprout className={styles.leafIcon} />
            <span>Cultivating Botanical Operations...</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={`${styles.progressBarFill} bg-gradient-to-r from-emerald-600 to-amber-500`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
