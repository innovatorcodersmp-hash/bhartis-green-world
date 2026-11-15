/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/layout.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Configured the master root layout shell for Bharti's Green World ERP.
 *    - Transitioned viewport theme color (`#f9f6f0`) and document root styling to a warm botanical ivory
 *      and champagne linen palette with rich forest charcoal typography (`#1b3a2b`).
 *    - Mounted the redesigned luxury ivory/champagne `<SplashScreen />` launch overlay.
 *    - Encapsulated page routes inside `<LayoutProvider>` and the master `<PageLayout>` shell.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Redesign the PWA splash screen and global app background to use
 *      a luxurious warm ivory and champagne linen flower palette (#f9f6f0) instead of green,
 *      making the bgw.png logo stand out with high-end contrast."
 *    - Delivers an elite botanical apothecary feel, maximizing circular logo visibility and contrast.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router root layout contracts (`Metadata`, `Viewport`).
 *    - Centralized SASS styling (`@/styles/globals.scss`) and CSS resets (`./globals.css`).
 *    - Brand launch overlay (`<SplashScreen />`) and layout components (`PageLayout`, `LayoutProvider`).
 * 
 * 4. HOW IT WORKS:
 *    - Delivers initial HTML with `#f9f6f0` pre-styled directly on `<html>` and `<body>`.
 *    - Seamlessly transitions from the warm linen splash screen into the Live Nursery Command Center.
 * 
 * ----------------------------------------------------------------------------
 */

import type { Metadata, Viewport } from 'next';
import React from 'react';
import './globals.css';
import '@/styles/globals.scss';
import { PageLayout, LayoutProvider } from '@/components/layout';
import { SplashScreen } from '@/components/SplashScreen';

export const viewport: Viewport = {
  themeColor: '#f9f6f0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "Bharti's Green World ERP",
    template: "%s | Bharti's Green World ERP",
  },
  description: "Bharti's Green World ERP — Nursery, Inventory & Landscaping Management System (Kolhapur)",
  manifest: "/manifest.json",
  icons: {
    icon: "/bgw.png",
    shortcut: "/bgw.png",
    apple: "/bgw.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Bharti's Green World ERP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      style={{ backgroundColor: '#f9f6f0', color: '#1b3a2b' }}
    >
      <body style={{ backgroundColor: '#f9f6f0', color: '#1b3a2b', margin: 0, padding: 0 }}>
        <LayoutProvider>
          <SplashScreen />
          <PageLayout>{children}</PageLayout>
        </LayoutProvider>
      </body>
    </html>
  );
}
