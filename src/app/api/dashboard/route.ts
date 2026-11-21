/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/api/dashboard/route.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented REST API route handler (`GET`) for Nursery Command Center telemetry.
 *    - Serves live operational metrics (Ready Stock, Low-Stock Restock Alerts, Counter Sales,
 *      Payment Distributions, Pending Udhar) via `getNurseryDashboardMetricsAction()`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills User Request: "Dashboard & Low-Stock Query Alignment (src/app/dashboard/page.tsx & /api/dashboard)".
 *    - Enables automated clients, external dashboards, and mobile sync jobs to fetch current live metrics.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Route Handler (`NextResponse`).
 *    - Server Action `getNurseryDashboardMetricsAction()`.
 * 
 * 4. HOW IT WORKS:
 *    - Calls `getNurseryDashboardMetricsAction()` to aggregate operational telemetry from Prisma ORM,
 *      returning formatted JSON payload with status codes.
 * 
 * ----------------------------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import { getNurseryDashboardMetricsAction } from '@/modules/dashboard/actions/dashboardActions';

export async function GET() {
  try {
    const result = await getNurseryDashboardMetricsAction();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to aggregate dashboard telemetry.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error('[API /api/dashboard GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load dashboard metrics.' },
      { status: 500 }
    );
  }
}

