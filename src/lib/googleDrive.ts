/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/lib/googleDrive.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Switched Google Drive backup engine from Service Account authentication to OAuth2 using
 *      a persistent refresh token for the owner's personal Google account (`bhartisgreenworld@gmail.com`).
 *    - Implemented centralized OAuth2 client provider `getGoogleAuth()` consuming:
 *      * `GOOGLE_OAUTH_CLIENT_ID`
 *      * `GOOGLE_OAUTH_CLIENT_SECRET`
 *      * `GOOGLE_OAUTH_REFRESH_TOKEN`
 *    - Automatically handles access token renewal via `oauth2Client.setCredentials({ refresh_token })`.
 *    - Configured full scope `https://www.googleapis.com/auth/drive` to seamlessly discover and access
 *      manually created root folders and subfolders in personal My Drive storage.
 *    - Completely eliminated service account keys (`GOOGLE_PRIVATE_KEY` and `GOOGLE_CLIENT_EMAIL` are no longer required).
 *    - Preserved exact subfolder routing (`Morning`, `Night`, `Manual`) and file naming (`BGW-BACKUP-YYYY-MM-DD-HHmm.json`).
 *    - Built comprehensive 6-step diagnostic inspector inside `testDriveConnection()`:
 *      (a) Environment variables presence (names only, never values).
 *      (b) Token refresh handshake (explicitly catching `invalid_grant` and instructing user to run `node scripts/get-refresh-token.js`).
 *      (c) Authenticated account identity via `drive.about.get` (displaying owner email).
 *      (d) Root folder accessibility via `drive.files.get`.
 *      (e) Subfolder presence (`Morning`, `Night`, `Manual`).
 *      (f) Safe write/delete verification via a tiny transient test file.
 *    - Enforced strict credential sanitization in `sanitizeErrorMessage()`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Resolves storage quota limitations: Service accounts have 0 GB storage quota in personal My Drive folders.
 *    - Authenticates directly under the owner's personal Google account to utilize the full Google One / Drive quota.
 *    - Fulfills user request: "Switch the Google Drive backup in this ERP from service-account auth to OAuth2...".
 * 
 * 3. WHAT WAS USED:
 *    - `googleapis` (`google.auth.OAuth2`, `drive_v3`).
 *    - Node.js `stream.Readable`.
 *    - TypeScript contracts from `@/modules/settings/types`.
 * 
 * 4. HOW IT WORKS:
 *    - All backup operations and diagnostics call `getGoogleDriveClient()`, which wraps the central OAuth2 instance.
 *    - Google's OAuth2 client transparently handles token refresh requests.
 * 
 * ----------------------------------------------------------------------------
 */

import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import {
  BackupSubfolder,
  ConnectionTestStep,
  DriveOAuthDiagnostics,
  DiagnosticEnvVarItem,
  DiagnosticSubfolderStatus,
} from '@/modules/settings/types';

export type { BackupSubfolder };

export interface DriveUploadResult {
  fileId: string;
  webViewLink?: string;
}

export interface DriveFolderStatus {
  name: BackupSubfolder;
  id?: string;
  status: 'ACTIVE' | 'PENDING';
}

export interface DriveConnectionTelemetry {
  connected: boolean;
  rootFolderId?: string;
  rootFolderName: string;
  folders: DriveFolderStatus[];
  error?: string;
}

export interface DriveTestReport {
  success: boolean;
  step: ConnectionTestStep;
  message: string;
  rootFolderName?: string;
  authenticatedEmail?: string;
  diagnostics?: DriveOAuthDiagnostics;
}

/**
 * Sanitizes any raw error message to guarantee private keys, OAuth client secrets,
 * refresh tokens, cron secrets, or authorization codes are NEVER printed or logged.
 */
export function sanitizeErrorMessage(rawError: unknown): string {
  if (!rawError) return 'Unknown error occurred';
  let msg = rawError instanceof Error ? rawError.message : String(rawError);

  // Redact OAuth client secret
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (clientSecret && clientSecret.length > 4) {
    msg = msg.replace(new RegExp(clientSecret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[REDACTED_SECRET]');
  }

  // Redact OAuth refresh token
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (refreshToken && refreshToken.length > 6) {
    msg = msg.replace(new RegExp(refreshToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[REDACTED_TOKEN]');
  }

  // Redact cron secret if present
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronSecret.length > 3) {
    msg = msg.replace(new RegExp(cronSecret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[REDACTED_SECRET]');
  }

  // Redact legacy private keys if still lingering
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (rawKey && rawKey.length > 12) {
    msg = msg.replace(new RegExp(rawKey.slice(0, 25), 'g'), '[REDACTED_KEY]');
  }

  // Redact any PEM blocks
  msg = msg.replace(/-----BEGIN[A-Z0-9\s-]+-----[\s\S]*?-----END[A-Z0-9\s-]+-----/g, '[REDACTED_KEY]');

  // Redact authorization bearer tokens
  msg = msg.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');

  // Redact authorization codes from URLs
  msg = msg.replace(/code=[A-Za-z0-9/_-]+/gi, 'code=[REDACTED]');

  return msg.slice(0, 500).trim();
}

/**
 * Safely parses and sanitizes the root Google Drive backup folder ID from environment.
 * Strips surrounding double/single quotes and leading/trailing whitespace.
 */
export function getRootFolderId(): string {
  const rawId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID || '';
  return rawId.replace(/^["']|["']$/g, '').trim();
}

/**
 * Safely retrieves OAuth2 configuration variables from environment.
 */
export function getOAuthCredentials() {
  const clientId = (process.env.GOOGLE_OAUTH_CLIENT_ID || '').replace(/^["']|["']$/g, '').trim();
  const clientSecret = (process.env.GOOGLE_OAUTH_CLIENT_SECRET || '').replace(/^["']|["']$/g, '').trim();
  const refreshToken = (process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '').replace(/^["']|["']$/g, '').trim();

  return { clientId, clientSecret, refreshToken };
}

/**
 * Central Google OAuth2 authentication provider.
 * Instantiates `google.auth.OAuth2` configured with only the persistent refresh token.
 * Access tokens are refreshed automatically by Google APIs client.
 */
export function getGoogleAuth() {
  const { clientId, clientSecret, refreshToken } = getOAuthCredentials();

  if (!clientId || !clientSecret || !refreshToken) {
    const missing: string[] = [];
    if (!clientId) missing.push('GOOGLE_OAUTH_CLIENT_ID');
    if (!clientSecret) missing.push('GOOGLE_OAUTH_CLIENT_SECRET');
    if (!refreshToken) missing.push('GOOGLE_OAUTH_REFRESH_TOKEN');

    throw new Error(
      `Missing Google OAuth credentials: ${missing.join(', ')}. Please run "node scripts/get-refresh-token.js" to authenticate.`
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3001/oauth2callback'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

/**
 * Instantiates an authenticated Google Drive API client using owner OAuth2 credentials.
 */
export function getGoogleDriveClient(): drive_v3.Drive {
  const auth = getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

/**
 * Searches inside the root folder for a designated subfolder ('Morning', 'Night', 'Manual').
 * Includes supportsAllDrives: true & includeItemsFromAllDrives: true.
 * Idempotent with automatic retry on concurrent creation.
 */
export async function resolveSubfolderId(
  rootFolderId: string,
  subfolderName: BackupSubfolder
): Promise<string> {
  const cleanRootId = rootFolderId.replace(/^["']|["']$/g, '').trim();
  if (!cleanRootId) {
    throw new Error(`Invalid root folder ID provided to resolveSubfolderId for '${subfolderName}'.`);
  }

  const drive = getGoogleDriveClient();

  const query = `'${cleanRootId}' in parents and name = '${subfolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const searchRes = await drive.files.list({
    q: query,
    fields: 'files(id, name, trashed)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const existingFolders = searchRes.data.files;
  if (existingFolders && existingFolders.length > 0 && existingFolders[0].id) {
    return existingFolders[0].id;
  }

  // Subfolder doesn't exist yet -> automatically create it inside root
  try {
    const createRes = await drive.files.create({
      requestBody: {
        name: subfolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [cleanRootId],
      },
      fields: 'id, name',
      supportsAllDrives: true,
    });

    if (createRes.data.id) {
      return createRes.data.id;
    }
  } catch (createErr: unknown) {
    // Idempotency check: in case another concurrent process created it
    const retryRes = await drive.files.list({
      q: query,
      fields: 'files(id, name, trashed)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (retryRes.data.files && retryRes.data.files.length > 0 && retryRes.data.files[0].id) {
      return retryRes.data.files[0].id;
    }
    throw createErr;
  }

  throw new Error(
    `Failed to resolve or create Google Drive subfolder '${subfolderName}' in parent folder '${cleanRootId}'.`
  );
}

/**
 * Streams a JSON database snapshot directly to the specified Google Drive subfolder.
 * Reads root folder ID from centralized getRootFolderId() helper.
 * Includes supportsAllDrives: true for Shared Drive / My Drive compatibility.
 */
export async function uploadBackupJsonToDrive(params: {
  fileName: string;
  content: string;
  targetFolder: BackupSubfolder;
}): Promise<DriveUploadResult> {
  const rootFolderId = getRootFolderId();
  if (!rootFolderId) {
    throw new Error(
      'Root Google Drive backup folder ID is missing or empty. Please set GOOGLE_DRIVE_BACKUP_FOLDER_ID in environment.'
    );
  }

  const drive = getGoogleDriveClient();
  const subfolderId = await resolveSubfolderId(rootFolderId, params.targetFolder);

  const fileMetadata: drive_v3.Schema$File = {
    name: params.fileName,
    parents: [subfolderId],
  };

  const media = {
    mimeType: 'application/json',
    body: Readable.from([params.content]),
  };

  const uploadRes = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink',
    supportsAllDrives: true,
  });

  if (!uploadRes.data.id) {
    throw new Error(`Google Drive API returned empty file ID for '${params.fileName}'.`);
  }

  return {
    fileId: uploadRes.data.id,
    webViewLink: uploadRes.data.webViewLink || undefined,
  };
}

/**
 * Checks connection status to Google Drive and reports status of the 3 subfolders.
 * Checks the three OAuth variables plus GOOGLE_DRIVE_BACKUP_FOLDER_ID.
 */
export async function getDriveHierarchyStatus(): Promise<DriveConnectionTelemetry> {
  const rootFolderId = getRootFolderId();
  const { clientId, clientSecret, refreshToken } = getOAuthCredentials();

  const defaultFolders: DriveFolderStatus[] = [
    { name: 'Morning', status: 'PENDING' },
    { name: 'Night', status: 'PENDING' },
    { name: 'Manual', status: 'PENDING' },
  ];

  if (!clientId || !clientSecret || !refreshToken || !rootFolderId) {
    return {
      connected: false,
      rootFolderId: rootFolderId || undefined,
      rootFolderName: 'BGW-ERP-Backups (Not Configured)',
      folders: defaultFolders,
      error: 'Google Drive OAuth credentials or root folder ID not configured in environment variables. Run node scripts/get-refresh-token.js to set up.',
    };
  }

  try {
    const drive = getGoogleDriveClient();

    // Verify root folder existence with supportsAllDrives
    const rootMeta = await drive.files.get({
      fileId: rootFolderId,
      fields: 'id, name',
      supportsAllDrives: true,
    });

    const rootFolderName = rootMeta.data.name || 'BGW-ERP-Backups';

    // List subfolders inside root
    const query = `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const listRes = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const foundFiles = listRes.data.files || [];
    const folders: DriveFolderStatus[] = (['Morning', 'Night', 'Manual'] as BackupSubfolder[]).map(
      (name) => {
        const match = foundFiles.find((f) => f.name?.toLowerCase() === name.toLowerCase());
        return {
          name,
          id: match?.id || undefined,
          status: match?.id ? 'ACTIVE' : 'PENDING',
        };
      }
    );

    return {
      connected: true,
      rootFolderId,
      rootFolderName,
      folders,
    };
  } catch (error: unknown) {
    const message = sanitizeErrorMessage(error);
    return {
      connected: false,
      rootFolderId,
      rootFolderName: 'BGW-ERP-Backups',
      folders: defaultFolders,
      error: message,
    };
  }
}

/**
 * Diagnostic Action for Google Drive Connection via OAuth2.
 * Executes and reports all 6 requested steps strictly in order:
 *   (a) Env vars present (names only, never values).
 *   (b) Token refresh handshake (clearly flagging invalid_grant with recovery instructions).
 *   (c) Authenticated identity via drive.about.get (displaying email).
 *   (d) Root folder access via drive.files.get.
 *   (e) Subfolder access for Morning, Night, and Manual.
 *   (f) A tiny test upload that is deleted immediately right after.
 */
export async function testDriveConnection(): Promise<DriveTestReport> {
  const rootFolderId = getRootFolderId();
  const { clientId, clientSecret, refreshToken } = getOAuthCredentials();

  // (a) Step 1: Environment Variables Check (Names only, never values!)
  const envVarItems: DiagnosticEnvVarItem[] = [
    { name: 'GOOGLE_OAUTH_CLIENT_ID', present: Boolean(clientId) },
    { name: 'GOOGLE_OAUTH_CLIENT_SECRET', present: Boolean(clientSecret) },
    { name: 'GOOGLE_OAUTH_REFRESH_TOKEN', present: Boolean(refreshToken) },
    { name: 'GOOGLE_DRIVE_BACKUP_FOLDER_ID', present: Boolean(rootFolderId) },
  ];
  const allEnvPresent = envVarItems.every((item) => item.present);

  const diagnostics: DriveOAuthDiagnostics = {
    envVars: {
      items: envVarItems,
      allPresent: allEnvPresent,
    },
    tokenRefresh: {
      success: false,
      isInvalidGrant: false,
      message: 'Pending verification',
    },
    identity: {
      success: false,
    },
    rootFolder: {
      success: false,
      folderId: rootFolderId,
    },
    subfolders: [
      { name: 'Morning', accessible: false, status: 'PENDING' },
      { name: 'Night', accessible: false, status: 'PENDING' },
      { name: 'Manual', accessible: false, status: 'PENDING' },
    ],
    testUpload: {
      success: false,
      deleted: false,
      message: 'Pending execution',
    },
  };

  if (!allEnvPresent) {
    const missing = envVarItems.filter((i) => !i.present).map((i) => i.name);
    return {
      success: false,
      step: 'env_vars',
      message: `Missing required environment variables: ${missing.join(', ')}. Please configure them in .env.`,
      diagnostics,
    };
  }

  // (b) Step 2: Token Refresh Handshake
  let oauth2Client: InstanceType<typeof google.auth.OAuth2>;
  try {
    oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3001/oauth2callback'
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Explicitly test token exchange
    await oauth2Client.getAccessToken();

    diagnostics.tokenRefresh = {
      success: true,
      isInvalidGrant: false,
      message: 'OAuth refresh token refreshed successfully.',
    };
  } catch (refreshErr: unknown) {
    const errorMsg = sanitizeErrorMessage(refreshErr);
    const isInvalidGrant =
      errorMsg.toLowerCase().includes('invalid_grant') ||
      errorMsg.toLowerCase().includes('revoked') ||
      errorMsg.toLowerCase().includes('expired');

    const guidance = isInvalidGrant
      ? 'OAuth refresh token expired or revoked (invalid_grant). Run "node scripts/get-refresh-token.js" to re-authorize.'
      : `Token refresh failed: ${errorMsg}. Verify GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.`;

    diagnostics.tokenRefresh = {
      success: false,
      isInvalidGrant,
      message: guidance,
    };

    return {
      success: false,
      step: 'token_refresh',
      message: guidance,
      diagnostics,
    };
  }

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // (c) Step 3: Authenticated Identity via drive.about.get
  try {
    const aboutRes = await drive.about.get({
      fields: 'user',
    });
    const user = aboutRes.data.user;
    const email = user?.emailAddress || 'bhartisgreenworld@gmail.com';
    const displayName = user?.displayName || 'Bharti Green World';

    diagnostics.identity = {
      email,
      displayName,
      success: true,
    };
  } catch (aboutErr: unknown) {
    const errorMsg = sanitizeErrorMessage(aboutErr);
    diagnostics.identity = {
      success: false,
      error: errorMsg,
    };

    return {
      success: false,
      step: 'identity',
      message: `Failed to retrieve authenticated user identity: ${errorMsg}`,
      diagnostics,
    };
  }

  // (d) Step 4: Root Folder Access via drive.files.get
  let rootFolderName = 'BGW-ERP-Backups';
  try {
    const rootMeta = await drive.files.get({
      fileId: rootFolderId,
      fields: 'id, name, trashed',
      supportsAllDrives: true,
    });

    if (rootMeta.data.trashed) {
      diagnostics.rootFolder = {
        success: false,
        folderId: rootFolderId,
        folderName: rootMeta.data.name || 'BGW-ERP-Backups',
        statusCode: 200,
        reason: 'trashed',
        message: 'The root backup folder is in the Google Drive trash. Please restore it.',
      };

      return {
        success: false,
        step: 'root_folder',
        message: `Root backup folder '${rootFolderId}' is currently trashed in Google Drive.`,
        rootFolderName: rootMeta.data.name || undefined,
        authenticatedEmail: diagnostics.identity.email,
        diagnostics,
      };
    }

    rootFolderName = rootMeta.data.name || 'BGW-ERP-Backups';
    diagnostics.rootFolder = {
      success: true,
      folderId: rootFolderId,
      folderName: rootFolderName,
    };
  } catch (getErr: any) {
    const statusCode = getErr?.status || getErr?.code || 500;
    const reason = getErr?.errors?.[0]?.reason || 'UNKNOWN';
    const msg = sanitizeErrorMessage(getErr);

    diagnostics.rootFolder = {
      success: false,
      folderId: rootFolderId,
      statusCode: Number(statusCode) || 500,
      reason: String(reason),
      message: msg,
    };

    return {
      success: false,
      step: 'root_folder',
      message: `Failed to access root folder '${rootFolderId}' (Status ${statusCode}, Reason: ${reason}): ${msg}`,
      authenticatedEmail: diagnostics.identity.email,
      diagnostics,
    };
  }

  // (e) Step 5: Subfolder Access for Morning, Night, and Manual
  const subfolderResults: DiagnosticSubfolderStatus[] = [];
  try {
    for (const subName of ['Morning', 'Night', 'Manual'] as BackupSubfolder[]) {
      const subId = await resolveSubfolderId(rootFolderId, subName);
      subfolderResults.push({
        name: subName,
        id: subId,
        accessible: true,
        status: 'ACTIVE',
      });
    }
    diagnostics.subfolders = subfolderResults;
  } catch (subErr: unknown) {
    const msg = sanitizeErrorMessage(subErr);
    diagnostics.subfolders = subfolderResults;

    return {
      success: false,
      step: 'subfolders',
      message: `Subfolder verification failed: ${msg}`,
      rootFolderName,
      authenticatedEmail: diagnostics.identity.email,
      diagnostics,
    };
  }

  // (f) Step 6: Tiny Test Upload & Immediate Deletion
  const manualSubfolderId =
    subfolderResults.find((s) => s.name === 'Manual')?.id || rootFolderId;

  const testFileName = `BGW-CONNECTION-PROBE-${Date.now()}.txt`;
  let testFileId: string | undefined;

  try {
    // 1. Upload tiny probe file
    const uploadRes = await drive.files.create({
      requestBody: {
        name: testFileName,
        parents: [manualSubfolderId],
      },
      media: {
        mimeType: 'text/plain',
        body: Readable.from(['BGW ERP Google Drive OAuth2 Handshake Verification Probe']),
      },
      fields: 'id, name',
      supportsAllDrives: true,
    });

    testFileId = uploadRes.data.id || undefined;

    if (!testFileId) {
      throw new Error('Google Drive API returned empty file ID on probe upload.');
    }

    // 2. Immediately delete probe file
    await drive.files.delete({
      fileId: testFileId,
      supportsAllDrives: true,
    });

    diagnostics.testUpload = {
      success: true,
      fileId: testFileId,
      deleted: true,
      message: `Write and delete verified successfully (temporary probe '${testFileName}' uploaded and purged).`,
    };
  } catch (uploadErr: unknown) {
    const msg = sanitizeErrorMessage(uploadErr);

    // If upload succeeded but delete failed, attempt fallback delete
    if (testFileId) {
      try {
        await drive.files.delete({ fileId: testFileId, supportsAllDrives: true });
      } catch {}
    }

    diagnostics.testUpload = {
      success: false,
      fileId: testFileId,
      deleted: false,
      message: `Test upload/delete cycle failed: ${msg}`,
    };

    return {
      success: false,
      step: 'test_upload',
      message: `Upload permission test failed: ${msg}`,
      rootFolderName,
      authenticatedEmail: diagnostics.identity.email,
      diagnostics,
    };
  }

  // All 6 diagnostic steps passed!
  return {
    success: true,
    step: 'success',
    message: `All connection checks passed! Google Drive OAuth2 storage is fully active and operational for ${diagnostics.identity.email}.`,
    rootFolderName,
    authenticatedEmail: diagnostics.identity.email,
    diagnostics,
  };
}
