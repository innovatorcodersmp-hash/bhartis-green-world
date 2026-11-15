/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/reports/utils/generateReportPdf.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented client-side A4 vector PDF report generator using `jspdf`.
 *    - Formats executive audit reports for all 5 business domains:
 *      * Sales & Revenue
 *      * Purchases & Batches
 *      * Stock Valuation & Damage Loss
 *      * Customer Udhar & Dues Ledger
 *      * Landscaping Contracts Analytics
 *    - Renders official organization header:
 *      "BHARTI'S GREEN WORLD NURSERY & LANDSCAPING — KOLHAPUR"
 *    - Renders active date range, generated timestamp, summary KPIs banner,
 *      clean bordered table with right-aligned financials, and grand total footer.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REDESIGN REPORTS DASHBOARD WITH PRACTICAL NURSERY CATEGORIES, DATE FILTERS, AND CLEAN PDF EXPORT".
 *    - Fulfills Specification 01 & 04: Clean, compact executive documentation for tax, accounting, and partner review.
 *    - Ensures zero layout distortion on mobile and desktop without depending on external print servers.
 * 
 * 3. WHAT WAS USED:
 *    - `jspdf` vector document builder.
 *    - SASS Forest Green branding tokens (`#1B4D3E`).
 * 
 * 4. HOW IT WORKS:
 *    - Instantiates `new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })`.
 *    - Draws header, KPI summary grid, paginated data rows, and totals, then triggers `.save(filename)`.
 * 
 * ----------------------------------------------------------------------------
 */

import { jsPDF } from 'jspdf';

export interface ReportPdfColumn {
  header: string;
  dataKey: string;
  width: number; // width in mm
  align?: 'left' | 'right' | 'center';
}

export interface ReportPdfKpi {
  label: string;
  value: string;
}

export interface GenerateReportPdfOptions {
  reportTitle: string;
  dateRangeLabel: string;
  kpis: ReportPdfKpi[];
  columns: ReportPdfColumn[];
  rows: Array<Record<string, any>>;
  footerTotals?: Record<string, string>;
  fileName?: string;
}

export function generateReportPdf({
  reportTitle,
  dateRangeLabel,
  kpis,
  columns,
  rows,
  footerTotals,
  fileName,
}: GenerateReportPdfOptions): void {
  // A4 Landscape: 297mm width x 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginLeft = 12;
  const marginRight = 285;
  const usableWidth = marginRight - marginLeft; // 273mm

  let currentY = 14;

  // ==========================================================================
  // 1. HEADER: BHARTI'S GREEN WORLD BRANDING
  // ==========================================================================
  doc.setFillColor(27, 77, 62); // Forest Green #1B4D3E
  doc.rect(marginLeft, currentY, usableWidth, 1.5, 'F');
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(27, 77, 62);
  doc.text("BHARTI'S GREEN WORLD NURSERY & LANDSCAPING", marginLeft, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  doc.text(`Generated: ${dateStr}, ${timeStr}`, marginRight, currentY, { align: 'right' });

  currentY += 5;
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('Kolhapur, Maharashtra | Plant Taxonomy, Propagation & Landscape Projects', marginLeft, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(`${reportTitle.toUpperCase()} — ${dateRangeLabel.toUpperCase()}`, marginLeft, currentY);

  currentY += 3;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, currentY, marginRight, currentY);

  currentY += 5;

  // ==========================================================================
  // 2. SUMMARY KPI ROW
  // ==========================================================================
  if (kpis && kpis.length > 0) {
    const kpiBoxHeight = 12;
    const kpiCount = kpis.length;
    const kpiWidth = usableWidth / kpiCount;

    doc.setFillColor(248, 250, 252); // Slate-50 background
    doc.roundedRect(marginLeft, currentY, usableWidth, kpiBoxHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginLeft, currentY, usableWidth, kpiBoxHeight, 1.5, 1.5, 'S');

    kpis.forEach((kpi, idx) => {
      const boxX = marginLeft + idx * kpiWidth;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label.toUpperCase(), boxX + 4, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(27, 77, 62);
      doc.text(kpi.value, boxX + 4, currentY + 9.5);

      if (idx > 0) {
        doc.setDrawColor(226, 232, 240);
        doc.line(boxX, currentY, boxX, currentY + kpiBoxHeight);
      }
    });

    currentY += kpiBoxHeight + 5;
  }

  // ==========================================================================
  // 3. TABLE RENDERING
  // ==========================================================================
  const rowHeight = 6.2;
  const headerHeight = 7;

  // Scale column widths to fit usableWidth exactly if needed
  const totalColWidth = columns.reduce((acc, c) => acc + c.width, 0);
  const scale = usableWidth / totalColWidth;
  const scaledCols = columns.map((c) => ({
    ...c,
    width: c.width * scale,
  }));

  const drawTableHeader = () => {
    doc.setFillColor(27, 77, 62); // Forest Green Header
    doc.rect(marginLeft, currentY, usableWidth, headerHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let colX = marginLeft;
    scaledCols.forEach((col) => {
      let textX = colX + 2;
      if (col.align === 'right') {
        textX = colX + col.width - 2;
      } else if (col.align === 'center') {
        textX = colX + col.width / 2;
      }

      doc.text(col.header, textX, currentY + 4.6, { align: col.align || 'left' });
      colX += col.width;
    });

    currentY += headerHeight;
  };

  drawTableHeader();

  // Render Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  rows.forEach((row, rowIndex) => {
    // Check page overflow
    if (currentY + rowHeight + 15 > pageHeight) {
      doc.addPage();
      currentY = 14;
      drawTableHeader();
    }

    // Zebra striping
    if (rowIndex % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(marginLeft, currentY, usableWidth, rowHeight, 'F');
    }

    doc.setDrawColor(243, 244, 246);
    doc.line(marginLeft, currentY + rowHeight, marginRight, currentY + rowHeight);

    let colX = marginLeft;
    scaledCols.forEach((col) => {
      const val = row[col.dataKey] !== undefined && row[col.dataKey] !== null
        ? String(row[col.dataKey])
        : '-';

      let textX = colX + 2;
      if (col.align === 'right') {
        textX = colX + col.width - 2;
      } else if (col.align === 'center') {
        textX = colX + col.width / 2;
      }

      doc.setTextColor(31, 41, 55);
      // Truncate if string is too long for column
      const maxChars = Math.floor(col.width / 1.7);
      const displayText = val.length > maxChars ? `${val.slice(0, maxChars - 2)}..` : val;

      doc.text(displayText, textX, currentY + 4.2, { align: col.align || 'left' });
      colX += col.width;
    });

    currentY += rowHeight;
  });

  // ==========================================================================
  // 4. FOOTER GRAND TOTALS ROW
  // ==========================================================================
  if (footerTotals) {
    if (currentY + rowHeight + 15 > pageHeight) {
      doc.addPage();
      currentY = 14;
      drawTableHeader();
    }

    doc.setFillColor(243, 244, 246);
    doc.rect(marginLeft, currentY, usableWidth, rowHeight + 1, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.4);
    doc.rect(marginLeft, currentY, usableWidth, rowHeight + 1, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);

    let colX = marginLeft;
    scaledCols.forEach((col, idx) => {
      const totalVal = footerTotals[col.dataKey] || (idx === 0 ? 'GRAND TOTAL' : '');
      if (totalVal) {
        let textX = colX + 2;
        if (col.align === 'right') {
          textX = colX + col.width - 2;
        } else if (col.align === 'center') {
          textX = colX + col.width / 2;
        }
        doc.text(totalVal, textX, currentY + 4.8, { align: col.align || 'left' });
      }
      colX += col.width;
    });

    currentY += rowHeight + 5;
  }

  // ==========================================================================
  // 5. FOOTER NOTICE & PAGE NUMBERS
  // ==========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(156, 163, 175);
    doc.text(
      "Bharti's Green World ERP — Confidential Nursery & Landscaping Audit Dossier",
      marginLeft,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, marginRight, pageHeight - 6, {
      align: 'right',
    });
  }

  // Save the generated document
  const sanitizedFileName =
    fileName ||
    `Bharti_Nursery_${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${dateRangeLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  doc.save(sanitizedFileName);
}

