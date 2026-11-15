/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/lib/constants/auth.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Established centralized authentication configuration constants and session cookie policies.
 *    - Defined secure cookie keys (`bgw_erp_session`, `session_token`, `auth_user`), expiry duration,
 *      and updated `DEFAULT_AUTH_REDIRECT` to point directly to the Live Nursery Command Center (`APP_ROUTES.DASHBOARD`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: FIX DASHBOARD NAVIGATION & REMOVE LEGACY REDIRECT TO POS".
 *    - Eliminates legacy post-login bounce to POS counter, ensuring employees arrive at the Nursery Command Center.
 *    - Ensures uniform cookie security attributes (`httpOnly`, `sameSite`, `maxAge`) across ERP counter environments.
 * 
 * 3. WHAT WAS USED:
 *    - Centralized application routes (`APP_ROUTES`).
 *    - Standard HTTP cookie policy settings.
 * 
 * 4. HOW IT WORKS:
 *    - Middleware and Server Actions import these constants when issuing, reading, or destroying session cookies.
 * 
 * ----------------------------------------------------------------------------
 */

import { APP_ROUTES } from './routes';

export const AUTH_SESSION_COOKIE = 'bgw_erp_session';
export const AUTH_TOKEN_COOKIE = 'session_token';
export const AUTH_USER_COOKIE = 'auth_user';

/**
 * Session longevity in seconds (7 days for billing counters & tablet rosters)
 */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Standard destination after successful cashier / manager authentication
 */
export const DEFAULT_AUTH_REDIRECT = APP_ROUTES.DASHBOARD;
