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
 *    - Connected the Root Route (`/`) with smart dual-state rendering:
 *      * Authenticated staff: Renders the Live Nursery Command Center Dashboard (`<NurseryDashboard>`)
 *        with real-time Prisma metrics (sales, revenue, low-stock alerts, customer credit, and bestsellers).
 *      * Unauthenticated visitors / Google reviewers: Renders the public Nursery Homepage (`<AboutPage>`)
 *        introducing Bharti's Green World Nursery, facility capabilities, and links to `/privacy` and `/login`.
 *    - Ensures the root URL (`/`) works completely as a public homepage without forcing an unauthenticated redirect.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Also make sure the site root (/) or a public /about page works as a homepage
 *      without login. Keep the existing design."
 *    - Satisfies Google Cloud Verification requirements where root landing pages must be accessible without login.
 *    - Preserves frictionless Command Center experience for authenticated staff.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Component.
 *    - Next.js `cookies` from `next/headers`.
 *    - Centralized auth cookies (`AUTH_SESSION_COOKIE`, `AUTH_TOKEN_COOKIE`, `AUTH_USER_COOKIE`).
 *    - Server Action `getNurseryDashboardMetricsAction()` and `<NurseryDashboard>` component.
 *    - Public `<AboutPage>` component.
 * 
 * 4. HOW IT WORKS:
 *    - Resolves session tokens from request cookies.
 *    - If unauthenticated, streams the public nursery homepage.
 *    - If authenticated, queries PostgreSQL via Prisma and renders the live Nursery Command Center.
 * 
 * ----------------------------------------------------------------------------
 */

import { cookies } from 'next/headers';
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  AUTH_USER_COOKIE,
} from '@/lib/constants/auth';
import {
  getNurseryDashboardMetricsAction,
  NurseryDashboard,
  NurseryDashboardMetrics,
} from '@/modules/dashboard';
import AboutPage from './about/page';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(AUTH_SESSION_COOKIE)?.value ||
    cookieStore.get(AUTH_TOKEN_COOKIE)?.value ||
    cookieStore.get(AUTH_USER_COOKIE)?.value;

  const isAuthenticated = Boolean(sessionToken && sessionToken.trim() !== '');

  // If visitor is unauthenticated, render the public Nursery Homepage
  if (!isAuthenticated) {
    return <AboutPage />;
  }

  // Fetch live operational telemetry for authenticated staff
  const result = await getNurseryDashboardMetricsAction();

  const fallbackMetrics: NurseryDashboardMetrics = {
    generatedAt: new Date().toISOString(),
    todaySales: { revenue: 0, billCount: 0 },
    salesTrend7Days: [],
    paymentModeBreakdown: {
      cash: 0,
      upi: 0,
      udhar: 0,
      total: 0,
      cashPercent: 0,
      upiPercent: 0,
      udharPercent: 0,
    },
    udharOverview: {
      totalPendingUdhar: 0,
      overdueCustomersCount: 0,
      topOverdueCustomers: [],
    },
    inventoryOverview: {
      totalReadyPots: 0,
      totalPlantVarieties: 0,
      lowStockCount: 0,
      lowStockAlerts: [],
    },
    bestsellingPlants: [],
    contractsOverview: {
      activeProjectsCount: 0,
      totalProjectsCount: 0,
      pipelineEstimate: 0,
      totalAdvanceCollected: 0,
      pendingBalance: 0,
    },
    recentInvoices: [],
  };

  const metrics = result.success && result.data ? result.data : fallbackMetrics;

  return <NurseryDashboard initialData={metrics} />;
}
