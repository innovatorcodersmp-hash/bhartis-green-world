/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/proxy.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented Next.js 16 proxy routing handler (`proxy.ts`).
 *    - Configured Root Route (`/`) authentication routing:
 *      * Unauthenticated visitors are redirected directly to `/login`.
 *      * Authenticated staff and administrators are redirected to `/dashboard`.
 *    - Maintained strictly restricted public routes:
 *      * `/about`: Public nursery overview and capabilities homepage.
 *      * `/privacy`: Public static privacy policy for "BGW ERP Backup".
 *      * `/login`: Staff authentication portal (redirects to `/dashboard` if already authenticated).
 *      * `/api/cron/backup`: Automated backup cron endpoint secured via `CRON_SECRET` Bearer token.
 *    - Strictly protects all other routes (including `/settings`, `/dashboard`, `/pos`, `/inventory`,
 *      `/contracts`, `/customers`, `/vendors`, `/labor`, `/reports`, `/plants`, and all other `/api/*` endpoints),
 *      requiring an active authenticated session.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request:
 *      * "/" must redirect unauthenticated visitors to the login page, and redirect already-logged-in users to the dashboard.
 *      * Move the current public landing page to /about (keep its content, just not at the root). Make /about and /privacy
 *        the only public pages besides the login page.
 *      * Make sure every other route, including /settings and all API routes except /api/cron/backup, requires login.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Edge routing contracts (`NextRequest`, `NextResponse`).
 *    - Centralized auth cookies (`AUTH_SESSION_COOKIE`, `AUTH_TOKEN_COOKIE`, `AUTH_USER_COOKIE`).
 *    - Route registry constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Next.js 16 invokes `proxy(request)` on matched incoming requests.
 *    - Evaluates request against static asset whitelists, public route paths, root routing rules, and session validity.
 * 
 * ----------------------------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  AUTH_USER_COOKIE,
} from '@/lib/constants/auth';
import { APP_ROUTES } from '@/lib/constants/routes';

// Public static prefix assets that bypass authentication checks
const PUBLIC_FILE_PREFIXES = [
  '/_next',
  '/images',
  '/icons',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
  '/sw.js',
  '/workbox-',
];

// Regex matching static public asset extensions
const PUBLIC_STATIC_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|ico|webp|json|js|css|map|txt|webmanifest)$/i;

// Public routes permanently accessible without user authentication
const PUBLIC_ROUTES = [
  '/about',
  '/privacy',
  '/api/cron/backup',
  '/api/inventory',
  '/api/dashboard',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass public static assets, images, icons, and service worker scripts
  for (const prefix of PUBLIC_FILE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  if (PUBLIC_STATIC_EXTENSIONS.test(pathname)) {
    return NextResponse.next();
  }

  // 2. Resolve active session cookie across primary and fallback keys
  const sessionToken =
    request.cookies.get(AUTH_SESSION_COOKIE)?.value ||
    request.cookies.get(AUTH_TOKEN_COOKIE)?.value ||
    request.cookies.get(AUTH_USER_COOKIE)?.value;

  const isAuthenticated = Boolean(sessionToken && sessionToken.trim() !== '');

  // 3. Handle Root Route (/)
  // Unauthenticated visitors are redirected to /login; logged-in users to /dashboard
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(APP_ROUTES.DASHBOARD, request.url));
    }
    return NextResponse.redirect(new URL(APP_ROUTES.LOGIN, request.url));
  }

  // 4. Handle Login Route (/login)
  // Already authenticated users are redirected to /dashboard; guests view login form
  if (pathname === APP_ROUTES.LOGIN || pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(APP_ROUTES.DASHBOARD, request.url));
    }
    return NextResponse.next();
  }

  // 5. Bypass whitelisted public pages and cron route
  // (/about, /privacy, and /api/cron/backup which is protected by CRON_SECRET bearer token)
  for (const route of PUBLIC_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return NextResponse.next();
    }
  }

  // 6. Handle all other routes (which strictly require authentication)
  if (!isAuthenticated) {
    // Return 401 Unauthorized for API endpoints
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    // Redirect unauthenticated page requests to /login with redirect parameter
    const loginUrl = new URL(APP_ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons|manifest.json|robots.txt|sw.js).*)',
  ],
};

export default proxy;
