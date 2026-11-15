/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/settings/actions/backupActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented Next.js Server Actions for automated (Morning & Night) and on-demand manual database backups to Google Drive.
 *    - Switched authentication to owner OAuth2 with refresh token, preserving user quota in personal My Drive.
 *    - Integrated `sanitizeErrorMessage()` to guarantee client secrets, refresh tokens, and cron secrets are never leaked.
 *    - Built diagnostic action `testGoogleDriveConnectionAction()` testing environment variables, token refresh,
 *      identity, root folder, subfolders, and probe upload.
 *    - Added dedicated recovery guidance for `invalid_grant` token errors pointing to `node scripts/get-refresh-token.js`.
 *    - Preserved exact file naming convention: `BGW-BACKUP-YYYY-MM-DD-HHmm.json`.
 *    - Saved sanitized error message into `BackupLog` table on failures.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Fix the Google Drive backup failure in the BGW ERP".
 *    - Fulfills Specification 04: "Next.js Server Actions First", "Zero Raw SQL", "Mandatory Try-Catch".
 *    - Protects sensitive credentials while providing crystal-clear diagnostic error visibility for nursery supervisors.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma client (`prisma`).
 *    - Google Drive helpers (`uploadBackupJsonToDrive`, `getDriveHierarchyStatus`, `testDriveConnection`, `sanitizeErrorMessage`).
 *    - TypeScript contracts from `@/modules/settings/types`.
 * 
 * 4. HOW IT WORKS:
 *    - Extracts 8 core entities from Prisma in parallel.
 *    - Streams JSON snapshot into `Morning`, `Night`, or `Manual` subfolders with `supportsAllDrives: true`.
 *    - Logs success or records real sanitized error in `BackupLog`.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import {
  uploadBackupJsonToDrive,
  getDriveHierarchyStatus,
  testDriveConnection,
  sanitizeErrorMessage,
  BackupSubfolder,
} from '@/lib/googleDrive';
import {
  BackupTriggerType,
  BackupLogRecord,
  BackupSettingsTelemetry,
  ConnectionTestResult,
} from '../types';

/**
 * Resolves trigger type to corresponding Google Drive subfolder name.
 */
function mapTriggerToSubfolder(triggerType: BackupTriggerType): BackupSubfolder {
  switch (triggerType) {
    case 'MORNING':
      return 'Morning';
    case 'NIGHT':
      return 'Night';
    case 'MANUAL':
    default:
      return 'Manual';
  }
}

/**
 * Executes a full database backup and uploads the JSON snapshot into Google Drive.
 */
export async function runDatabaseBackupAction(
  triggerType: BackupTriggerType = 'MANUAL'
): Promise<ActionResult<BackupLogRecord>> {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());

  const fileName = `BGW-BACKUP-${year}-${month}-${day}-${hours}${minutes}.json`;
  const targetFolder = mapTriggerToSubfolder(triggerType);
  let contentJson = '';
  let fileSizeKb = 0;

  try {
    // 1. Concurrently fetch all core business entities
    const [
      plants,
      vendors,
      inventoryBatches,
      customers,
      posBills,
      gardenContracts,
      estimates,
      employees,
    ] = await Promise.all([
      prisma.plant.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.inventoryBatch.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.customer.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.posBill.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.gardenContract.findMany({
        include: { payments: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.landscapingEstimate.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.employee.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          phone: true,
          joiningDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 2. Compile structured backup payload
    const backupPayload = {
      system: "Bharti's Green World ERP",
      facility: 'Kolhapur, Maharashtra',
      version: '1.0',
      exportedAt: now.toISOString(),
      triggerType,
      targetFolder,
      summary: {
        totalPlants: plants.length,
        totalVendors: vendors.length,
        totalInventoryBatches: inventoryBatches.length,
        totalCustomers: customers.length,
        totalPosBills: posBills.length,
        totalGardenContracts: gardenContracts.length,
        totalEstimates: estimates.length,
        totalEmployees: employees.length,
      },
      data: {
        plants,
        vendors,
        inventoryBatches,
        customers,
        posBills,
        gardenContracts,
        estimates,
        employees,
      },
    };

    contentJson = JSON.stringify(backupPayload, null, 2);
    fileSizeKb = Math.max(1, Math.round(Buffer.byteLength(contentJson, 'utf-8') / 1024));

    // 3. Upload to Google Drive
    const uploadRes = await uploadBackupJsonToDrive({
      fileName,
      content: contentJson,
      targetFolder,
    });

    // 4. Save successful audit record in database
    const backupLog = await prisma.backupLog.create({
      data: {
        fileName,
        triggerType,
        targetFolder,
        status: 'SUCCESS',
        fileSizeKb,
        driveFileId: uploadRes.fileId,
        driveWebLink: uploadRes.webViewLink,
      },
    });

    revalidatePath('/settings');

    return {
      success: true,
      data: backupLog,
    };
  } catch (error: unknown) {
    let errorMsg = sanitizeErrorMessage(error);
    if (
      errorMsg.toLowerCase().includes('invalid_grant') ||
      errorMsg.toLowerCase().includes('revoked') ||
      errorMsg.toLowerCase().includes('expired')
    ) {
      errorMsg = 'OAuth refresh token expired or invalid (invalid_grant). Run "node scripts/get-refresh-token.js" to re-authorize.';
    }
    console.error('Database backup failure:', errorMsg);

    // Record failure with real error message in audit log
    try {
      const failedLog = await prisma.backupLog.create({
        data: {
          fileName,
          triggerType,
          targetFolder,
          status: 'FAILED',
          fileSizeKb,
          errorMessage: errorMsg,
        },
      });

      revalidatePath('/settings');
      return {
        success: false,
        error: errorMsg,
        data: failedLog,
      };
    } catch (logErr) {
      console.error('Failed to write failure log to database:', sanitizeErrorMessage(logErr));
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}

/**
 * Fetches recent backup history logs.
 */
export async function getBackupHistoryAction(
  limit: number = 20
): Promise<ActionResult<BackupLogRecord[]>> {
  try {
    const logs = await prisma.backupLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    console.error('Failed to fetch backup history logs:', sanitizeErrorMessage(error));
    return {
      success: false,
      error: 'Unable to retrieve backup logs from database.',
    };
  }
}

/**
 * Fetches full telemetry for Settings page: Google Drive status and recent backup logs.
 */
export async function getBackupSettingsTelemetryAction(): Promise<
  ActionResult<BackupSettingsTelemetry>
> {
  try {
    const [driveStatus, recentLogs] = await Promise.all([
      getDriveHierarchyStatus(),
      prisma.backupLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    return {
      success: true,
      data: {
        driveConnected: driveStatus.connected,
        rootFolderId: driveStatus.rootFolderId,
        rootFolderName: driveStatus.rootFolderName,
        folders: driveStatus.folders,
        recentLogs,
        error: driveStatus.error,
      },
    };
  } catch (error) {
    console.error('Failed to compile backup settings telemetry:', sanitizeErrorMessage(error));
    return {
      success: false,
      error: 'Unable to compile settings telemetry.',
    };
  }
}

/**
 * Runs step-by-step diagnostic test of Google Drive authentication, root folder, and permissions.
 */
export async function testGoogleDriveConnectionAction(): Promise<
  ActionResult<ConnectionTestResult>
> {
  try {
    const testResult = await testDriveConnection();
    return {
      success: testResult.success,
      data: testResult,
      error: testResult.success ? undefined : testResult.message,
    };
  } catch (error: unknown) {
    let errorMsg = sanitizeErrorMessage(error);
    if (
      errorMsg.toLowerCase().includes('invalid_grant') ||
      errorMsg.toLowerCase().includes('revoked') ||
      errorMsg.toLowerCase().includes('expired')
    ) {
      errorMsg = 'OAuth refresh token expired or invalid (invalid_grant). Run "node scripts/get-refresh-token.js" to re-authorize.';
    }
    return {
      success: false,
      error: errorMsg,
      data: {
        success: false,
        step: 'token_refresh',
        message: errorMsg,
      },
    };
  }
}
