/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Transformed the Root Route (`/`) into an authentication entry router:
 *      * Unauthenticated visitors are automatically redirected to the login page (`/login`).
 *      * Authenticated staff and administrators are redirected to the live Nursery Command Center (`/dashboard`).
 *    - The public nursery marketing and facility overview landing page is hosted at `/about`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request:
 *      * "/" must redirect unauthenticated visitors to the login page, and redirect already-logged-in users to the dashboard.
 *      * Move the current public landing page to /about.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Component with `cookies` from `next/headers` and `redirect` from `next/navigation`.
 *    - Centralized auth cookies (`AUTH_SESSION_COOKIE`, `AUTH_TOKEN_COOKIE`, `AUTH_USER_COOKIE`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Resolves active session token from HTTP-only cookies.
 *    - Issues immediate server-side HTTP 307 redirect to `/dashboard` or `/login`.
 * 
 * ----------------------------------------------------------------------------
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  AUTH_USER_COOKIE,
} from '@/lib/constants/auth';
import { APP_ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(AUTH_SESSION_COOKIE)?.value ||
    cookieStore.get(AUTH_TOKEN_COOKIE)?.value ||
    cookieStore.get(AUTH_USER_COOKIE)?.value;

  const isAuthenticated = Boolean(sessionToken && sessionToken.trim() !== '');

  if (isAuthenticated) {
    redirect(APP_ROUTES.DASHBOARD);
  }

  redirect(APP_ROUTES.LOGIN);
}
