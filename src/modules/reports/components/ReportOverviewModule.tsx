/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/reports/components/ReportOverviewModule.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Structured `<ReportOverviewModule>` to render the redesigned `<ReportsDashboard>`.
 *    - Maintained backwards compatibility for existing routing shells while powering
 *      the 5 practical category tabs:
 *      * Sales Report
 *      * Purchase & Batches
 *      * Stock & Damage Loss
 *      * Customer Udhar & Dues
 *      * Landscaping Projects
 *    - Supported Date Range filtering (Today, This Week, This Month, All Time) and clean A4 vector PDF export.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REDESIGN REPORTS DASHBOARD WITH PRACTICAL NURSERY CATEGORIES, DATE FILTERS, AND CLEAN PDF EXPORT".
 *    - Fulfills Specification 01: "Mobile-First PWA Layout Efficiency" & Clean UI standards.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 functional component.
 *    - Modular `<ReportsDashboard>` component.
 * 
 * 4. HOW IT WORKS:
 *    - Delegates rendering directly to `<ReportsDashboard initialData={initialData} />`.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React from 'react';
import { ExecutiveReportSummary } from '../types';
import { ReportsDashboard } from './ReportsDashboard';

export interface ReportOverviewModuleProps {
  initialData: ExecutiveReportSummary;
}

export const ReportOverviewModule: React.FC<ReportOverviewModuleProps> = ({ initialData }) => {
  return <ReportsDashboard initialData={initialData} />;
};
