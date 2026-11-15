/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/about/page.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built the public, static Nursery Overview & Homepage at `/about` (and reusable for `/`).
 *    - Highlights Bharti's Green World Nursery & Landscaping facility in Kolhapur, Maharashtra.
 *    - Details core botanical pillars:
 *      * Ornamental & Fruit Cultivar Stock (50,000+ pots ready-to-sell).
 *      * Commercial & Residential Landscaping Architecture Contracts.
 *      * Point-of-Sale (POS) Retail Billing & Customer Udhar Ledger.
 *      * Enterprise Cloud Backup via Google Drive disaster recovery.
 *    - Whitelisted in `proxy.ts` and `middleware.ts` for unauthenticated visitors and external reviewers.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Also make sure the site root (/) or a public /about page works as a homepage
 *      without login. Keep the existing design."
 *    - Provides a warm, professional, brand-aligned public landing for customers, Google reviewers, and guests.
 *    - Adheres to Specification 01: Clean card UI, compact spacing, botanical flower color palette.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js App Router Server Component.
 *    - Lucide React icons (`Sprout`, `Trees`, `ShieldCheck`, `HardDrive`, `Mail`, `Building`, `Receipt`, `Lock`).
 *    - Scoped SCSS module (`AboutPage.module.scss`).
 *    - Centralized route registry (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Renders statically at `/about` for public visitors, administrators, and Google security reviewers.
 *    - Provides navigation paths back to the public Privacy Policy (`/privacy`) and staff login (`/login`).
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sprout,
  Trees,
  ShieldCheck,
  HardDrive,
  Mail,
  Building,
  Receipt,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/constants/routes';
import styles from './AboutPage.module.scss';

export const metadata: Metadata = {
  title: "About Us | Bharti's Green World Nursery & Landscaping • Kolhapur",
  description:
    "Learn about Bharti's Green World Nursery & Landscaping in Kolhapur: premier plant cultivars, garden landscape architecture, and enterprise nursery management.",
};

export default function AboutPage() {
  return (
    <div className={styles.container}>
      {/* ---------------------------------------------------------------------
          1. HERO HEADER CARD
          --------------------------------------------------------------------- */}
      <header className={styles.heroCard}>
        <div className={styles.brandBadge}>
          <Sprout size={13} />
          <span>Kolhapur, Maharashtra</span>
        </div>
        <h1 className={styles.heroTitle}>
          Bharti&apos;s Green World Nursery &amp; Landscaping
        </h1>
        <p className={styles.heroSubtitle}>
          Kolhapur&apos;s trusted botanical nursery and landscape contractor. Cultivating ornamental foliage,
          flowering shrubs, exotic fruit trees, and delivering turn-key garden architecture.
        </p>
      </header>

      {/* ---------------------------------------------------------------------
          2. NURSERY PILLARS & CAPABILITIES
          --------------------------------------------------------------------- */}
      <section className={styles.card} aria-label="Nursery Capabilities">
        <h2 className={styles.sectionHeader}>
          <Trees size={16} color="#1B4D3E" />
          Our Botanical Operations &amp; Facility
        </h2>
        <p className={styles.paragraph}>
          Located in Kolhapur, Bharti&apos;s Green World operates an extensive greenhouse and nursery facility
          supplying retail homeowners, landscape architects, institutions, and agro-farms across Western Maharashtra:
        </p>

        <div className={styles.grid}>
          <div className={`${styles.featureBox} ${styles.featureBoxGreen}`}>
            <div className={styles.featureHeader}>
              <Sprout size={15} color="#047857" />
              <span>Botanical Plant Master</span>
            </div>
            <p className={styles.featureDesc}>
              Over 50,000 ready pots spanning indoor houseplants, outdoor perennials, flowering roses,
              native fruit saplings, and ceramic planters.
            </p>
          </div>

          <div className={`${styles.featureBox} ${styles.featureBoxAmber}`}>
            <div className={styles.featureHeader}>
              <Sparkles size={15} color="#D97706" />
              <span>Landscape Architecture</span>
            </div>
            <p className={styles.featureDesc}>
              End-to-end design, natural lawn turfing, drip irrigation, vertical green walls,
              and corporate garden maintenance contracts.
            </p>
          </div>

          <div className={styles.featureBox}>
            <div className={styles.featureHeader}>
              <Receipt size={15} color="#1B4D3E" />
              <span>Digital Counter Billing (POS)</span>
            </div>
            <p className={styles.featureDesc}>
              Instant thermal slip generation, GST calculation, customer credit (udhar) tracking,
              and UPI/cash multi-mode payment reconciliation.
            </p>
          </div>

          <div className={`${styles.featureBox} ${styles.featureBoxPurple}`}>
            <div className={styles.featureHeader}>
              <HardDrive size={15} color="#7C3AED" />
              <span>Automated Cloud Backups</span>
            </div>
            <p className={styles.featureDesc}>
              Resilient disaster recovery utilizing owner Google Drive storage for automated morning (10:00 AM)
              and night (9:30 PM) database replication.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          3. DATA SAFETY & PRIVACY DISCLOSURE
          --------------------------------------------------------------------- */}
      <section className={styles.card} aria-label="Data Protection & Privacy">
        <h2 className={styles.sectionHeader}>
          <Lock size={16} color="#1B4D3E" />
          Enterprise Data Safety &amp; Google Drive Integration
        </h2>
        <p className={styles.paragraph}>
          The nursery runs on a purpose-built Enterprise Resource Planning (ERP) platform. All business transactions,
          supplier ledgers, and plant stocks are safeguarded through redundant Google Drive database snapshots:
        </p>
        <p className={styles.paragraph} style={{ fontSize: '0.75rem', color: '#4B5563' }}>
          • Google Drive API access is strictly limited to uploading internal database snapshots into the owner&apos;s
          secure <code>BGW-ERP-Backups</code> folder.
          <br />
          • No customer or visitor personal data is collected, sold, or shared with third parties.
        </p>
        <div>
          <Link href={APP_ROUTES.PRIVACY} className={styles.navLink}>
            <ShieldCheck size={14} color="#047857" />
            Read Full Privacy Policy
            <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          4. CONTACT INFORMATION
          --------------------------------------------------------------------- */}
      <section className={styles.card} aria-label="Contact Information">
        <h2 className={styles.sectionHeader}>
          <Building size={16} color="#1B4D3E" />
          Nursery Contact &amp; Location
        </h2>

        <div className={styles.contactBox}>
          <div className={styles.contactRow}>
            <Mail size={16} />
            <span>
              <strong>General Inquiries &amp; Support:</strong>{' '}
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
          5. NAVIGATION ACTIONS
          --------------------------------------------------------------------- */}
      <div className={styles.actionsRow}>
        <Link href={APP_ROUTES.PRIVACY} className={styles.navLink}>
          <ShieldCheck size={14} />
          Privacy Policy
        </Link>
        <Link href={APP_ROUTES.DASHBOARD} className={styles.navLink}>
          Nursery Homepage
        </Link>
        <Link href={APP_ROUTES.LOGIN} className={`${styles.navLink} ${styles.primaryNavLink}`}>
          Staff ERP Login
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

