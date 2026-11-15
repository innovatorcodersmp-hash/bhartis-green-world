/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/(dashboard)/settings/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built the dedicated Settings & Google Drive Database Backup page (`/settings`).
 *    - Fetches real-time Google Drive hierarchy telemetry and recent backup history
 *      via Server Action `getBackupSettingsTelemetryAction()`.
 *    - Renders `<BackupSettingsCard>` inside a centered, clean PWA layout (`max-width: 44rem`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT AUTOMATED (MORNING & NIGHT) AND MANUAL DATABASE BACKUP TO GOOGLE DRIVE WITH 3 SUBFOLDERS".
 *    - Fulfills Specification 01: Clean compact card UI standards, centered layout, and mobile PWA touch targets.
 *    - Provides the nursery management team with autonomous disaster recovery control and audit trails.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Component.
 *    - Server Action `getBackupSettingsTelemetryAction` from `@/modules/settings`.
 *    - Component `<BackupSettingsCard>` from `@/modules/settings`.
 * 
 * 4. HOW IT WORKS:
 *    - Resolves session and runs concurrent telemetry fetches on server render.
 *    - Delivers pre-hydrated Google Drive hierarchy status and recent logs to the client card.
 * 
 * ----------------------------------------------------------------------------
 */

import { Metadata } from 'next';
import {
  getBackupSettingsTelemetryAction,
  BackupSettingsCard,
  BackupSettingsTelemetry,
} from '@/modules/settings';

export const dynamic = 'force-dynamic';

// export const metadata: Metadata = {
//   title: "System Settings & Cloud Backups | Bharti's Green World ERP",
//   description:
//     'Automated Morning and Night Google Drive database replication and disaster recovery management.',
// };

export default async function SettingsPage() {
  const result = await getBackupSettingsTelemetryAction();

  const fallbackTelemetry: BackupSettingsTelemetry = {
    driveConnected: false,
    rootFolderName: 'BGW-ERP-Backups',
    folders: [
      { name: 'Morning', status: 'PENDING' },
      { name: 'Night', status: 'PENDING' },
      { name: 'Manual', status: 'PENDING' },
    ],
    recentLogs: [],
  };

  const telemetry = result.success && result.data ? result.data : fallbackTelemetry;

  return <BackupSettingsCard initialTelemetry={telemetry} />;
}

