/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(auth)/login/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built the Next.js server routing shell for the `/login` route.
 *    - Wrapped `<LoginForm />` inside `<Suspense>` boundary for safe `useSearchParams` hydration during static page prerendering.
 *    - Set SEO metadata and viewport title for the cashier and staff authentication screen.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01 Section 1.2: "Pages inside Next.js app/ are lightweight routing shells (under 50-80 lines)".
 *    - Provides a dedicated full-screen login destination complying with zero-popup mandates.
 *    - Ensures Next.js build prerender passes without dynamic client-hook bailouts.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 `<Suspense>` boundary.
 *    - Next.js App Router server component and `Metadata`.
 *    - Feature module component `<LoginForm>`.
 * 
 * 4. HOW IT WORKS:
 *    - When users navigate to `/login`, this server component prepares the page shell and mounts `<LoginForm>` inside Suspense.
 * 
 * ----------------------------------------------------------------------------
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/modules/auth/components';

export const metadata: Metadata = {
  title: "Staff & Counter Login | Bharti's Green World ERP",
  description:
    "Secure authentication screen for counter cashiers, nursery hands, and administrators of Bharti's Green World, Kolhapur.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
