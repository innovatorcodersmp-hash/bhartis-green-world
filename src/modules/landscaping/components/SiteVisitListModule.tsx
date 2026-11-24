/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/landscaping/components/SiteVisitListModule.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<SiteVisitListModule>` supervisor dashboard for routine garden maintenance visits.
 *    - Integrated 4 compact `<MetricCard>` counters:
 *      * Total Logged Visits
 *      * Healthy Sites (100% flourishing)
 *      * Minor Replacements Needed
 *      * Attention Required
 *    - Embedded `<SiteVisitTableWrapper>` with interactive search, status badges, and 1-click WhatsApp share buttons.
 *    - Rendered navigation toolbar linking between Site Visits, Contracts, and Estimates.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT SITE VISIT & MAINTENANCE WHATSAPP UPDATE".
 *    - Gives landscaping managers clear operational visibility over garden health and scheduled visits.
 * 
 * 3. WHAT WAS USED:
 *    - Lucide React icons (`Sprout`, `CheckCircle2`, `AlertTriangle`, `AlertCircle`, `Plus`, `FileText`).
 *    - Shared UI primitives (`<MetricCard>`, `<Button>`).
 *    - Header hook (`useSetPageHeader`).
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Sprout,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  FileText,
} from 'lucide-react';
import { MetricCard, Button } from '@/components/ui';
import { useSetPageHeader } from '@/components/layout';
import { APP_ROUTES } from '@/lib/constants/routes';
import { SiteVisitWithRelations, SiteVisitDirectoryMetrics } from '../types';
import { SiteVisitTableWrapper } from './SiteVisitTableWrapper';

export interface SiteVisitListModuleProps {
  visits: SiteVisitWithRelations[];
}

export const SiteVisitListModule: React.FC<SiteVisitListModuleProps> = ({ visits }) => {
  useSetPageHeader({
    title: 'Landscaping Site Visits & Maintenance Logs',
    subtitle: 'Track routine garden inspections, plant health status, and dispatch WhatsApp updates to clients.',
  });

  const metrics: SiteVisitDirectoryMetrics = useMemo(() => {
    let healthy = 0;
    let replacements = 0;
    let attention = 0;

    for (const v of visits) {
      if (v.siteStatus === 'Healthy') {
        healthy += 1;
      } else if (v.siteStatus === 'Minor Replacements Needed') {
        replacements += 1;
      } else if (v.siteStatus === 'Attention Required') {
        attention += 1;
      }
    }

    return {
      totalVisits: visits.length,
      healthyCount: healthy,
      replacementsCount: replacements,
      attentionCount: attention,
    };
  }, [visits]);

  const toolbarButtons = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Link href={APP_ROUTES.CONTRACTS} style={{ textDecoration: 'none' }}>
        <Button variant="outline" size="sm" leftIcon={<FileText size={14} />}>
          Contracts
        </Button>
      </Link>
      <Link href={APP_ROUTES.CONTRACTS_ESTIMATES} style={{ textDecoration: 'none' }}>
        <Button variant="outline" size="sm" leftIcon={<Sprout size={14} />}>
          Estimates
        </Button>
      </Link>
      <Link href={APP_ROUTES.CONTRACTS_SITE_VISITS_NEW} style={{ textDecoration: 'none' }}>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>
          Log Site Visit
        </Button>
      </Link>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* KPI Metric Summary Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.5rem',
        }}
      >
        <MetricCard
          label="Total Logged Visits"
          value={metrics.totalVisits}
          icon={<Sprout size={18} />}
          variant="default"
          description="All recorded inspections"
        />

        <MetricCard
          label="Healthy Sites"
          value={metrics.healthyCount}
          icon={<CheckCircle2 size={18} />}
          variant="success"
          description="100% thriving plants"
        />

        <MetricCard
          label="Replacements Needed"
          value={metrics.replacementsCount}
          icon={<AlertTriangle size={18} />}
          variant="warning"
          description="Sapling replacements queued"
        />

        <MetricCard
          label="Attention Required"
          value={metrics.attentionCount}
          icon={<AlertCircle size={18} />}
          variant="danger"
          description="Soil / pest treatment required"
        />
      </div>

      {/* Main Data Table */}
      <SiteVisitTableWrapper visits={visits} toolbarActions={toolbarButtons} />
    </div>
  );
};

