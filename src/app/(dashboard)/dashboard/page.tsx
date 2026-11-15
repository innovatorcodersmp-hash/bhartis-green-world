/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/dashboard/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Created dedicated `/dashboard` route page rendering the Live Nursery Command Center (`<NurseryDashboard>`).
 *    - Fetches real-time nursery telemetry via Server Action `getNurseryDashboardMetricsAction()`.
 *    - Provides resilient fallback telemetry metrics if database connection experiences transient drops.
 *    - Strictly avoids any redirect to `/pos`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: FIX DASHBOARD NAVIGATION & REMOVE LEGACY REDIRECT TO POS".
 *    - Guarantees that navigating to either `/` or `/dashboard` loads the Nursery Command Center.
 *    - Fulfills Specification 01: Clean card UI, compact spacing, botanical flower color palette, and mobile PWA standards.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Component.
 *    - Next.js `cookies` from `next/headers`.
 *    - Next.js `redirect` from `next/navigation`.
 *    - Centralized route constants (`APP_ROUTES`).
 *    - Server Action `getNurseryDashboardMetricsAction()` and `<NurseryDashboard>` component from `@/modules/dashboard`.
 * 
 * 4. HOW IT WORKS:
 *    - Checks session cookies; if unauthenticated, redirects to `/login`.
 *    - If authenticated, fetches aggregated nursery metrics and renders `<NurseryDashboard initialData={metrics} />`.
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
import {
  getNurseryDashboardMetricsAction,
  NurseryDashboard,
  NurseryDashboardMetrics,
} from '@/modules/dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardAliasPage() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(AUTH_SESSION_COOKIE)?.value ||
    cookieStore.get(AUTH_TOKEN_COOKIE)?.value ||
    cookieStore.get(AUTH_USER_COOKIE)?.value;

  const isAuthenticated = Boolean(sessionToken && sessionToken.trim() !== '');

  if (!isAuthenticated) {
    redirect(APP_ROUTES.LOGIN);
  }

  // Fetch live operational telemetry
  const result = await getNurseryDashboardMetricsAction();

  const fallbackMetrics: NurseryDashboardMetrics = {
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
    generatedAt: new Date().toISOString(),
  };

  const metrics = result.success && result.data ? result.data : fallbackMetrics;

  return <NurseryDashboard initialData={metrics} />;
}

