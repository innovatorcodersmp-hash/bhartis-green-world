/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/api/cron/backup/route.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built secure Next.js API Route Handler for automated Morning & Night database backups.
 *    - Parses `?slot=morning` (mapped to `MORNING` trigger -> `BGW-ERP-Backups/Morning`)
 *      and `?slot=night` (mapped to `NIGHT` trigger -> `BGW-ERP-Backups/Night`).
 *    - Guards invocation using `CRON_SECRET` via `Authorization: Bearer ${CRON_SECRET}` header.
 *    - Executes `runDatabaseBackupAction()` and returns structured execution JSON response.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT AUTOMATED (MORNING & NIGHT) AND MANUAL DATABASE BACKUP TO GOOGLE DRIVE WITH 3 SUBFOLDERS".
 *    - Integrates with Vercel Cron Jobs (10:00 AM IST & 9:30 PM IST) for automated cloud database snapshots.
 *    - Adheres to Specification 04: Edge/API authentication security and zero-trust verification.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router Route Handler (`NextRequest`, `NextResponse`).
 *    - `runDatabaseBackupAction` from `@/modules/settings/actions`.
 *    - `CRON_SECRET` environment variable.
 * 
 * 4. HOW IT WORKS:
 *    - Vercel Cron triggers `GET /api/cron/backup?slot=morning` or `night`.
 *    - Compares authorization header against `process.env.CRON_SECRET`.
 *    - Runs full Prisma database extraction and Google Drive upload into the target subfolder.
 * 
 * ----------------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDatabaseBackupAction } from '@/modules/settings/actions';
import { BackupTriggerType } from '@/modules/settings/types';
import { sanitizeErrorMessage } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Authorize cron request with strict Bearer token validation
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET authorization token.' },
      { status: 401 }
    );
  }

  // 2. Parse slot parameter
  const searchParams = request.nextUrl.searchParams;
  const slotParam = searchParams.get('slot')?.toLowerCase();

  let triggerType: BackupTriggerType = 'MANUAL';
  if (slotParam === 'morning') {
    triggerType = 'MORNING';
  } else if (slotParam === 'night') {
    triggerType = 'NIGHT';
  }

  try {
    // 3. Execute backup and Google Drive subfolder upload
    const result = await runDatabaseBackupAction(triggerType);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          triggerType,
          slot: slotParam || 'manual',
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Database backup completed successfully for slot '${triggerType}'`,
      triggerType,
      slot: slotParam || 'manual',
      backup: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMsg = sanitizeErrorMessage(error);
    console.error('Cron backup failure:', errorMsg);
    return NextResponse.json(
      {
        success: false,
        triggerType,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

