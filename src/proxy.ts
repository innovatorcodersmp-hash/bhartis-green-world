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
 *    - Implemented Next.js 16 proxy convention routing handler (`proxy.ts`).
 *    - Whitelists public static assets, images, icons, and PWA manifest assets.
 *    - Explicitly whitelists public unauthenticated routes:
 *      * `/privacy`: Public static privacy policy for "BGW ERP Backup".
 *      * `/about`: Public botanical nursery information and overview.
 *      * `/`: Root landing homepage (renders public nursery overview when unauthenticated,
 *        and live Nursery Command Center when authenticated).
 *      * `/api/cron/backup`: Cron API route secured via `CRON_SECRET` Bearer token.
 *    - Strictly protects all internal nursery operational routes (`/pos`, `/reports`,
 *      `/customers`, `/inventory`, `/vendors`, `/contracts`, `/labor`, `/plants`, `/settings`).
 *    - Ensures dual compatibility across Next.js 16 proxy and legacy middleware specifications.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Add a public, static page at /privacy in the ERP (no login required;
 *      make sure proxy.ts and any auth middleware allow this path)... Also make sure the site root (/)
 *      or a public /about page works as a homepage without login."
 *    - Eliminates Next.js 16 deprecation warning regarding the `middleware.ts` naming convention.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Edge routing contracts (`NextRequest`, `NextResponse`).
 *    - Centralized auth cookies (`AUTH_SESSION_COOKIE`, `AUTH_TOKEN_COOKIE`, `AUTH_USER_COOKIE`).
 *    - Route registry constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Next.js 16 invokes `proxy(request)` on matched routes.
 *    - Evaluates the route against public whitelist rules before enforcing session token checks.
 * 
 * ----------------------------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  AUTH_USER_COOKIE,
  DEFAULT_AUTH_REDIRECT,
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

// Public routes that are permanently accessible without authentication
const PUBLIC_ROUTES = [
  '/privacy',
  '/about',
  '/api/cron/backup',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass public static assets and service worker scripts
  for (const prefix of PUBLIC_FILE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  // 2. Bypass public routes (Privacy Policy, About page, Cron API)
  for (const route of PUBLIC_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return NextResponse.next();
    }
  }

  // 3. Resolve active session cookie across primary and fallback keys
  const sessionToken =
    request.cookies.get(AUTH_SESSION_COOKIE)?.value ||
    request.cookies.get(AUTH_TOKEN_COOKIE)?.value ||
    request.cookies.get(AUTH_USER_COOKIE)?.value;

  const isAuthenticated = Boolean(sessionToken && sessionToken.trim() !== '');

  // 4. Handle Login Route (/login)
  if (pathname === APP_ROUTES.LOGIN || pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
    }
    return NextResponse.next();
  }

  // 5. Handle Root Landing Route (/)
  // Allows both authenticated (Command Center) and unauthenticated (Public Nursery Homepage)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // 6. Handle Explicit Dashboard Route (/dashboard)
  if (pathname === '/dashboard') {
    if (isAuthenticated) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(APP_ROUTES.LOGIN, request.url));
  }

  // 7. Handle Protected Dashboard & Operational Routes
  // (/pos, /reports, /customers, /inventory, /vendors, /contracts, /labor, /staff, /plants, /settings)
  if (!isAuthenticated) {
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

