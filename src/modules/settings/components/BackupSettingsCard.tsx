/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/settings/components/BackupSettingsCard.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built high-clarity Google Drive Backup Settings & Hierarchy Telemetry card (`<BackupSettingsCard>`).
 *    - Streamlined Drive Hierarchy Status: removed developer testing controls & diagnostic panels
 *      for a clean, production-grade business interface.
 *    - Structured 4 operational telemetry sections:
 *      1) Drive Folder Hierarchy Status with live status badge and 3 dedicated subfolder cards (Morning, Night, Manual).
 *      2) Automated Daily Schedules: 10:00 AM IST (Morning slot) & 9:30 PM IST (Night slot) with slot badges.
 *      3) On-Demand Manual Trigger: "Backup Now to Manual Folder" button with reactive state and status feedback.
 *      4) Recent Cloud Backup History: Table with timestamps, folder badges, file sizes, error explanations, and Drive links.
 *    - Enforced `max-width: 44rem` centered layout and >= 44px mobile touch ergonomics.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "from this remove tested part".
 * 
 * 3. WHAT WAS USED:
 *    - React 19 Client Component (`'use client'`).
 *    - Lucide React icons (`HardDrive`, `Folder`, `CalendarClock`, `Sun`, `Moon`, `Play`, `CheckCircle`, `AlertCircle`, `ExternalLink`, `ShieldCheck`, `Check`).
 *    - Reusable `<Button>` component from `@/components/ui`.
 *    - Server Action `runDatabaseBackupAction`.
 *    - Scoped SCSS module (`BackupSettingsCard.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Displays live cloud backup telemetry, automatic backup schedule cards, and provides instant one-click manual backup.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition } from 'react';
import {
  HardDrive,
  Folder,
  CalendarClock,
  Sun,
  Moon,
  Play,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
  runDatabaseBackupAction,
} from '../actions';
import {
  BackupSettingsTelemetry,
  BackupLogRecord,
} from '../types';
import styles from './BackupSettingsCard.module.scss';

export interface BackupSettingsCardProps {
  initialTelemetry: BackupSettingsTelemetry;
}

export const BackupSettingsCard: React.FC<BackupSettingsCardProps> = ({
  initialTelemetry,
}) => {
  const [telemetry, setTelemetry] = useState<BackupSettingsTelemetry>(initialTelemetry);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    link?: string;
  } | null>(null);

  const handleManualBackup = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await runDatabaseBackupAction('MANUAL');
      if (result.success && result.data) {
        setFeedback({
          type: 'success',
          message: `Manual backup '${result.data.fileName}' (${result.data.fileSizeKb} KB) completed successfully!`,
          link: result.data.driveWebLink || undefined,
        });

        // Prepend new log to recent history
        setTelemetry((prev) => ({
          ...prev,
          recentLogs: [result.data as BackupLogRecord, ...prev.recentLogs.slice(0, 14)],
        }));
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to complete database backup. Check Google Drive credentials.',
        });

        // If a failed log was recorded, prepend it
        if (result.data) {
          setTelemetry((prev) => ({
            ...prev,
            recentLogs: [result.data as BackupLogRecord, ...prev.recentLogs.slice(0, 14)],
          }));
        }
      }
    });
  };

  return (
    <div className={styles.settingsContainer}>
      {/* ---------------------------------------------------------------------
          1. HEADER CARD
          --------------------------------------------------------------------- */}
      <section className={styles.headerCard} aria-label="Settings Header">
        <h1 className={styles.headerTitle}>
          <ShieldCheck size={20} />
          System Settings &amp; Cloud Database Backups
        </h1>
        <span className={styles.headerSubtitle}>
          Automated Morning &amp; Night Google Drive database replication • Owner Account (My Drive)
        </span>
      </section>

      {/* ---------------------------------------------------------------------
          2. DRIVE HIERARCHY STATUS & DIAGNOSTICS
          --------------------------------------------------------------------- */}
      <section className={styles.sectionCard} aria-label="Drive Hierarchy Status">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <HardDrive size={16} />
            Google Drive Hierarchy Status (OAuth2)
          </h2>
          <span
            className={`${styles.connectionStatus} ${
              telemetry.driveConnected ? styles.statusOnline : styles.statusOffline
            }`}
          >
            <span
              className={`${styles.statusDot} ${
                telemetry.driveConnected ? styles.dotGreen : styles.dotAmber
              }`}
            />
            {telemetry.driveConnected ? 'Drive Connected' : 'Credentials Incomplete'}
          </span>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>
          <strong>Root Directory:</strong>{' '}
          <span style={{ fontFamily: 'monospace', color: '#1B4D3E', fontWeight: 600 }}>
            {telemetry.rootFolderName}
          </span>
          {telemetry.rootFolderId && (
            <span style={{ fontSize: '0.6875rem', color: '#6B7280', marginLeft: '0.35rem' }}>
              ({telemetry.rootFolderId})
            </span>
          )}
        </div>

        {telemetry.error && (
          <div className={`${styles.feedbackAlert} ${styles.feedbackError}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={15} />
              <span>{telemetry.error}</span>
            </div>
          </div>
        )}

        {/* 3 Dedicated Subfolders Grid */}
        <div className={styles.folderGrid}>
          {/* Morning Subfolder */}
          <div className={`${styles.folderBox} ${styles.folderBoxMorning}`}>
            <div className={styles.folderHeader}>
              <span className={styles.folderName} style={{ color: '#B45309' }}>
                <Folder size={14} />
                Morning
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: '#B45309',
                  textTransform: 'uppercase',
                }}
              >
                10:00 AM IST
              </span>
            </div>
            <span className={styles.folderPath}>BGW-ERP-Backups / Morning</span>
          </div>

          {/* Night Subfolder */}
          <div className={`${styles.folderBox} ${styles.folderBoxNight}`}>
            <div className={styles.folderHeader}>
              <span className={styles.folderName} style={{ color: '#6D28D9' }}>
                <Folder size={14} />
                Night
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: '#6D28D9',
                  textTransform: 'uppercase',
                }}
              >
                9:30 PM IST
              </span>
            </div>
            <span className={styles.folderPath}>BGW-ERP-Backups / Night</span>
          </div>

          {/* Manual Subfolder */}
          <div className={`${styles.folderBox} ${styles.folderBoxManual}`}>
            <div className={styles.folderHeader}>
              <span className={styles.folderName} style={{ color: '#047857' }}>
                <Folder size={14} />
                Manual
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: '#047857',
                  textTransform: 'uppercase',
                }}
              >
                On-Demand
              </span>
            </div>
            <span className={styles.folderPath}>BGW-ERP-Backups / Manual</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          3. AUTOMATED SCHEDULES CARD
          --------------------------------------------------------------------- */}
      <section className={styles.sectionCard} aria-label="Automated Backup Schedules">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <CalendarClock size={16} />
            Automated Daily Backup Schedules
          </h2>
          <span style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Vercel Cron Active</span>
        </div>

        <div className={styles.schedulesList}>
          {/* Morning Slot */}
          <div className={styles.scheduleRow}>
            <div className={styles.scheduleInfo}>
              <span className={styles.scheduleTitle}>
                <Sun size={14} color="#D97706" />
                Morning Slot (10:00 AM IST / 04:30 UTC)
              </span>
              <span className={styles.scheduleMeta}>
                Uploads full snapshot to <span style={{ fontFamily: 'monospace' }}>BGW-ERP-Backups / Morning</span>
              </span>
            </div>
            <span className={styles.badgeMorning}>Morning Sync</span>
          </div>

          {/* Night Slot */}
          <div className={styles.scheduleRow}>
            <div className={styles.scheduleInfo}>
              <span className={styles.scheduleTitle}>
                <Moon size={14} color="#7C3AED" />
                Night Slot (9:30 PM IST / 16:00 UTC)
              </span>
              <span className={styles.scheduleMeta}>
                Uploads end-of-day register to <span style={{ fontFamily: 'monospace' }}>BGW-ERP-Backups / Night</span>
              </span>
            </div>
            <span className={styles.badgeNight}>Night Sync</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          4. MANUAL BACKUP TRIGGER CARD
          --------------------------------------------------------------------- */}
      <section className={styles.manualCard} aria-label="Manual Backup Trigger">
        <div className={styles.manualRow}>
          <div className={styles.manualDesc}>
            <strong style={{ display: 'block', color: '#1F2937', marginBottom: '0.2rem' }}>
              On-Demand Cloud Database Snapshot
            </strong>
            Trigger an immediate real-time JSON export of all 8 system entities directly into the{' '}
            <span style={{ fontFamily: 'monospace', color: '#1B4D3E' }}>Manual</span> subfolder.
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleManualBackup}
            isLoading={isPending}
            leftIcon={<Play size={14} />}
          >
            {isPending ? 'Backing Up...' : 'Backup Now to Manual Folder'}
          </Button>
        </div>

        {feedback && (
          <div
            className={`${styles.feedbackAlert} ${
              feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
            }`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {feedback.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span>{feedback.message}</span>
            </div>
            {feedback.link && (
              <a
                href={feedback.link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.driveLinkBtn}
              >
                View on Drive
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------------
          5. RECENT CLOUD BACKUP HISTORY TABLE
          --------------------------------------------------------------------- */}
      <section className={styles.sectionCard} aria-label="Recent Backup History">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <HardDrive size={16} />
            Recent Cloud Backup History
          </h2>
          <span style={{ fontSize: '0.6875rem', color: '#6B7280' }}>
            Last {telemetry.recentLogs.length} attempts
          </span>
        </div>

        {telemetry.recentLogs.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              color: '#6B7280',
              fontSize: '0.75rem',
            }}
          >
            No database backups have been recorded yet. Click &quot;Backup Now to Manual Folder&quot; above to trigger your first cloud snapshot.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Folder</th>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Action / Details</th>
                </tr>
              </thead>
              <tbody>
                {telemetry.recentLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <tr key={log.id}>
                      <td style={{ color: '#4B5563' }}>{dateStr}</td>
                      <td>
                        {log.targetFolder === 'Morning' && (
                          <span className={styles.badgeMorning}>Morning</span>
                        )}
                        {log.targetFolder === 'Night' && (
                          <span className={styles.badgeNight}>Night</span>
                        )}
                        {log.targetFolder === 'Manual' && (
                          <span className={styles.badgeManual}>Manual</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{log.fileName}</td>
                      <td>{log.fileSizeKb > 0 ? `${log.fileSizeKb} KB` : '—'}</td>
                      <td>
                        {log.status === 'SUCCESS' ? (
                          <span className={styles.badgeSuccess}>
                            <CheckCircle size={11} />
                            Success
                          </span>
                        ) : (
                          <span className={styles.badgeDanger}>
                            <AlertCircle size={11} />
                            Failed
                          </span>
                        )}
                      </td>
                      <td>
                        {log.status === 'SUCCESS' && log.driveWebLink ? (
                          <a
                            href={log.driveWebLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.driveLinkBtn}
                          >
                            Open Drive
                            <ExternalLink size={11} />
                          </a>
                        ) : log.status === 'FAILED' && log.errorMessage ? (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              color: '#B91C1C',
                              fontFamily: 'monospace',
                              display: 'inline-block',
                              maxWidth: '280px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={log.errorMessage}
                          >
                            {log.errorMessage}
                          </span>
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
