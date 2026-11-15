/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/settings/types/index.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Defined TypeScript interfaces and types for Google Drive Database Backups, System Settings,
 *      and OAuth2-based diagnostic telemetry for the "Test Connection" inspector.
 *    - Modeled `BackupTriggerType`, `BackupSubfolder`, `BackupLogRecord`, and telemetry data contracts.
 *    - Updated diagnostic types to support OAuth2 authentication with personal My Drive storage:
 *      * `DiagnosticEnvVars`: Names-only status of required environment variables.
 *      * `DiagnosticTokenRefresh`: Token refresh handshake status, flagging `invalid_grant`.
 *      * `DiagnosticGoogleIdentity`: Authenticated account identity from `drive.about.get`.
 *      * `DiagnosticFolderAccess`: Root backup folder verification.
 *      * `DiagnosticSubfolderStatus`: Status of Morning, Night, and Manual subfolders.
 *      * `DiagnosticTestUpload`: Verification of write/delete cycle via a tiny test file.
 *      * `DriveOAuthDiagnostics`: Unified diagnostic report delivered to client UI without exposing secrets.
 * 
 * 2. WHY IT WAS DONE:
 *    - Switches authentication from Service Account to OAuth2 refresh token for the owner's Google account
 *      (`bhartisgreenworld@gmail.com`) to utilize My Drive storage quota.
 *    - Fulfills user request: "Switch the Google Drive backup in this ERP from service-account auth to OAuth2...".
 *    - Enforces compile-time type safety across Server Actions, Google Drive APIs, and UI cards.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript types, unions, and interfaces.
 * 
 * 4. HOW IT WORKS:
 *    - Consumed by `googleDrive.ts`, `backupActions.ts`, `BackupSettingsCard.tsx`, and the settings page.
 * 
 * ----------------------------------------------------------------------------
 */

export type BackupTriggerType = 'MORNING' | 'NIGHT' | 'MANUAL';
export type BackupSubfolder = 'Morning' | 'Night' | 'Manual';

export interface BackupLogRecord {
  id: string;
  fileName: string;
  triggerType: string;
  targetFolder: string;
  status: string;
  fileSizeKb: number;
  driveFileId?: string | null;
  driveWebLink?: string | null;
  errorMessage?: string | null;
  createdAt: Date | string;
}

export interface DriveFolderInfo {
  name: BackupSubfolder;
  id?: string;
  status: 'ACTIVE' | 'PENDING';
}

export interface BackupSettingsTelemetry {
  driveConnected: boolean;
  rootFolderId?: string;
  rootFolderName: string;
  folders: DriveFolderInfo[];
  recentLogs: BackupLogRecord[];
  error?: string;
}

export type ConnectionTestStep =
  | 'env_vars'
  | 'token_refresh'
  | 'identity'
  | 'root_folder'
  | 'subfolders'
  | 'test_upload'
  | 'success';

export interface DiagnosticEnvVarItem {
  name: string;
  present: boolean;
}

export interface DiagnosticEnvVars {
  items: DiagnosticEnvVarItem[];
  allPresent: boolean;
}

export interface DiagnosticTokenRefresh {
  success: boolean;
  isInvalidGrant: boolean;
  message: string;
}

export interface DiagnosticGoogleIdentity {
  email?: string;
  displayName?: string;
  success: boolean;
  error?: string;
}

export interface DiagnosticFolderAccess {
  success: boolean;
  folderId: string;
  folderName?: string;
  statusCode?: number;
  reason?: string;
  message?: string;
}

export interface DiagnosticSubfolderStatus {
  name: BackupSubfolder;
  id?: string;
  accessible: boolean;
  status: 'ACTIVE' | 'PENDING';
  error?: string;
}

export interface DiagnosticTestUpload {
  success: boolean;
  fileId?: string;
  deleted: boolean;
  message: string;
}

export interface DriveOAuthDiagnostics {
  envVars: DiagnosticEnvVars;
  tokenRefresh: DiagnosticTokenRefresh;
  identity: DiagnosticGoogleIdentity;
  rootFolder: DiagnosticFolderAccess;
  subfolders: DiagnosticSubfolderStatus[];
  testUpload: DiagnosticTestUpload;
}

export interface ConnectionTestResult {
  success: boolean;
  step: ConnectionTestStep;
  message: string;
  rootFolderName?: string;
  authenticatedEmail?: string;
  diagnostics?: DriveOAuthDiagnostics;
}
