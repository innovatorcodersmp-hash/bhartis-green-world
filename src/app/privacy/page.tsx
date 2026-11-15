/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/privacy/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built the public, static Privacy Policy page at `/privacy` for "BGW ERP Backup".
 *    - Structured comprehensive privacy disclosures:
 *      * Dedicated purpose: The app exclusively uses the owner's Google Drive storage to upload
 *        the nursery's own internal database backup snapshots.
 *      * Zero data sharing: Does not collect, sell, monetize, or share personal data with any third parties.
 *      * Google API Limited Use compliance statement.
 *      * Official contact channel: `bhartisgreenworld@gmail.com`.
 *    - Fully public and unauthenticated: Whitelisted in `proxy.ts` and `middleware.ts` without requiring login.
 *    - Formatted within the standard botanical design system: max-width 44rem centered, clean card UI, touch >= 44px.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Add a public, static page at /privacy in the ERP (no login required;
 *      make sure proxy.ts and any auth middleware allow this path) with a short privacy policy for
 *      'BGW ERP Backup': the app only uses the owner's Google Drive account to upload the nursery's own
 *      database backup files; it does not collect, sell or share personal data with third parties;
 *      contact email bhartisgreenworld@gmail.com."
 *    - Required for Google Cloud OAuth verification and Google Drive API integration compliance.
 *    - Adheres to Specification 01: Clean card UI, compact spacing, botanical flower color palette.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router Server Component.
 *    - Lucide React icons (`ShieldCheck`, `HardDrive`, `Lock`, `Mail`, `ArrowLeft`, `Sprout`, `CheckCircle2`, `ExternalLink`).
 *    - Scoped SCSS module (`PrivacyPolicy.module.scss`).
 *    - Centralized route registry (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Renders statically at `/privacy` for public visitors, administrators, and Google security reviewers.
 *    - Provides navigation paths back to the public nursery homepage (`/` / `/about`) and staff login (`/login`).
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  HardDrive,
  Lock,
  Mail,
  ArrowLeft,
  Sprout,
  CheckCircle2,
  FileText,
  Building,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import styles from './PrivacyPolicy.module.scss';

export const metadata: Metadata = {
  title: "Privacy Policy | BGW ERP Backup • Bharti's Green World",
  description:
    "Official Privacy Policy for BGW ERP Backup: how Bharti's Green World Nursery (Kolhapur) utilizes Google Drive for secure database disaster recovery.",
};

export default function PrivacyPolicyPage() {
  const effectiveDate = 'November 15, 2026';

  return (
    <div className={styles.container}>
      {/* ---------------------------------------------------------------------
          1. HEADER CARD
          --------------------------------------------------------------------- */}
      <header className={styles.headerCard}>
        <div className={styles.brandBadge}>
          <Sprout size={13} />
          <span>Bharti&apos;s Green World • Kolhapur</span>
        </div>
        <h1 className={styles.title}>
          <ShieldCheck size={22} color="#1B4D3E" />
          Privacy Policy for BGW ERP Backup
        </h1>
        <p className={styles.subtitle}>
          This Privacy Policy outlines the operational and data management standards for{' '}
          <strong>BGW ERP Backup</strong>, the dedicated cloud disaster recovery utility developed for{' '}
          <strong>Bharti&apos;s Green World Nursery &amp; Landscaping</strong>.
        </p>
        <div className={styles.metaRow}>
          <span>
            <strong>Effective Date:</strong> {effectiveDate}
          </span>
          <span>•</span>
          <span>
            <strong>Application:</strong> BGW ERP Backup v1.0
          </span>
          <span>•</span>
          <span>
            <strong>Status:</strong> Public Document
          </span>
        </div>
      </header>

      {/* ---------------------------------------------------------------------
          2. CORE PURPOSE CARD
          --------------------------------------------------------------------- */}
      <section className={styles.card} aria-label="Application Purpose & Scope">
        <h2 className={styles.sectionHeader}>
          <HardDrive size={16} color="#1B4D3E" />
          1. Purpose &amp; Scope of BGW ERP Backup
        </h2>
        <p className={styles.paragraph}>
          <strong>BGW ERP Backup</strong> is an internal disaster recovery and data redundancy application created
          specifically for Bharti&apos;s Green World Nursery &amp; Landscaping in Kolhapur, Maharashtra.
        </p>
        <div className={styles.highlightBox}>
          <div className={styles.highlightTitle}>
            <CheckCircle2 size={14} />
            <span>Single-Purpose Operation</span>
          </div>
          <p className={styles.highlightText}>
            The application exclusively uses the nursery owner&apos;s Google Drive account to upload
            the nursery&apos;s own automated and on-demand database backup snapshot files. It does not
            access, browse, alter, or interact with any non-nursery files stored in Google Drive.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          3. DATA COLLECTION & SHARING DISCLOSURE
          --------------------------------------------------------------------- */}
      <section className={styles.card} aria-label="Data Privacy and Sharing">
        <h2 className={styles.sectionHeader}>
          <Lock size={16} color="#1B4D3E" />
          2. Data Collection, Use, and Third-Party Sharing
        </h2>
        <p className={styles.paragraph}>
          We hold data privacy to the highest standard. The application operates under strict no-sharing guarantees:
        </p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <CheckCircle2 size={15} className={styles.bulletIcon} />
            <div>
              <strong>No Personal Data Collection:</strong> BGW ERP Backup does not collect, record, track,
              or profile personal identifying information from visitors or public users.
            </div>
          </li>
          <li className={styles.bulletItem}>
            <CheckCircle2 size={15} className={styles.bulletIcon} />
            <div>
              <strong>No Sale or Distribution:</strong> We do not sell, rent, commercialize, or share any nursery
              business data, customer lists, or transaction logs with third parties, brokers, or marketing networks.
            </div>
          </li>
          <li className={styles.bulletItem}>
            <CheckCircle2 size={15} className={styles.bulletIcon} />
            <div>
              <strong>Direct Cloud Transmission:</strong> All database snapshots are encrypted in transit and
              streamed directly from our secure hosting infrastructure to the owner&apos;s designated Google Drive
              subfolders (<code>Morning</code>, <code>Night</code>, and <code>Manual</code>).
            </div>
          </li>
          <li className={styles.bulletItem}>
            <CheckCircle2 size={15} className={styles.bulletIcon} />
            <div>
              <strong>No Third-Party Analytics:</strong> No third-party trackers, behavioral cookies, or advertising
              scripts are embedded inside the backup service.
            </div>
          </li>
        </ul>
      </section>

      {/* ---------------------------------------------------------------------
          4. GOOGLE API USER DATA POLICY COMPLIANCE
          --------------------------------------------------------------------- */}
      <section className={styles.card} aria-label="Google API Compliance">
        <h2 className={styles.sectionHeader}>
          <FileText size={16} color="#1B4D3E" />
          3. Google API Services User Data Policy Compliance
        </h2>
        <p className={styles.paragraph}>
          BGW ERP Backup adheres strictly to the{' '}
          <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements:
        </p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <CheckCircle2 size={15} className={styles.bulletIcon} />
            <div>
              Access to Google Drive scopes (such as <code>https://www.googleapis.com/auth/drive.file</code>) is
              requested solely to create and store the nursery&apos;s own JSON database archives.
            </div>
          </li>
          <li className={styles.bulletItem}>
            <CheckCircle2 size={15} className={styles.bulletIcon} />
            <div>
              Data received from Google APIs is never utilized for artificial intelligence model training, advertising,
              or cross-service user tracking.
            </div>
          </li>
        </ul>
      </section>

      {/* ---------------------------------------------------------------------
          5. CONTACT & FACILITY INFORMATION
          --------------------------------------------------------------------- */}
      <section className={styles.card} aria-label="Contact Information">
        <h2 className={styles.sectionHeader}>
          <Building size={16} color="#1B4D3E" />
          4. Contact Information &amp; Nursery Headquarters
        </h2>
        <p className={styles.paragraph}>
          If you have any questions, inquiries, or security verification requests regarding this Privacy Policy
          or the BGW ERP Backup utility, please contact our administrative team directly:
        </p>

        <div className={styles.contactBox}>
          <div className={styles.contactRow}>
            <Mail size={16} />
            <span>
              <strong>Official Contact Email:</strong>{' '}
              <a href="mailto:bhartisgreenworld@gmail.com" className={styles.emailLink}>
                bhartisgreenworld@gmail.com
              </a>
            </span>
          </div>
          <div className={styles.contactRow}>
            <Building size={16} />
            <span>
              <strong>Facility:</strong> Bharti&apos;s Green World Nursery &amp; Landscaping, Kolhapur, Maharashtra, India
            </span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          6. NAVIGATION ACTIONS
          --------------------------------------------------------------------- */}
      <div className={styles.actionsRow}>
        <Link href={APP_ROUTES.ABOUT} className={styles.navLink}>
          <ArrowLeft size={14} />
          About Nursery / Overview
        </Link>
        <Link href={APP_ROUTES.LOGIN} className={`${styles.navLink} ${styles.primaryNavLink}`}>
          Staff ERP Login
        </Link>
      </div>
    </div>
  );
}

