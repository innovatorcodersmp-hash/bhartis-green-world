/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/utils/generateEstimatePdf.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built client-side vector PDF generator (`buildEstimatePdf`, `generateEstimatePdf`)
 *      for Landscaping Quotations & Site Estimates.
 *    - Structured executive A4 Portrait layout:
 *      * Brand Header: Forest green banner (#1B4D3E), official nursery logo (`BGW_LOGO_BASE64`),
 *        landscape architecture metadata, and quotation badge.
 *      * Site & Client Profile Card: Two-column grid detailing Estimate No, Date, Client Name,
 *        Phone, Site Location, and Plot/Lawn Dimensions.
 *      * Scope of Work: Formatted project specifications and botanical prep details.
 *      * Itemized Table: Clear categorization of plants, lawn sods, red soil, piping, and materials
 *        with unit rates, quantities, and line totals.
 *      * Financial Settlement: Material subtotal, professional labor charges, and highlighted Grand Total.
 *      * Milestone Payment Schedule: Standard 40%-40%-20% landscape project stage breakdown.
 *      * Dual Signature Block: Client acceptance and authorized landscape architect.
 *    - Enabled both auto-save download and Blob/File conversion for instant WhatsApp Web Share.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: CREATE ESTIMATE BUILDER UI & PDF GENERATOR".
 *    - Empowers nursery landscapers in Kolhapur to present pristine, corporate-grade project estimates to clients.
 *    - Complies with Specification 01: "PWA Clean UI Standards" & Specification 03: "Component Specifications".
 * 
 * 3. WHAT WAS USED:
 *    - `jspdf` vector document builder.
 *    - Base64 Data URL constant (`BGW_LOGO_BASE64`).
 *    - TypeScript domain types (`LandscapingEstimateWithParsedItems`).
 * 
 * 4. HOW IT WORKS:
 *    - `buildEstimatePdf(estimate)` constructs the multi-section vector document.
 *    - `generateEstimatePdf(estimate, autoSave)` triggers browser download or returns `doc` for sharing.
 * 
 * ----------------------------------------------------------------------------
 */

import { jsPDF } from 'jspdf';
import { LandscapingEstimateWithParsedItems } from '../types';
import { BGW_LOGO_BASE64 } from './bgwLogoBase64';

export function buildEstimatePdf(estimate: LandscapingEstimateWithParsedItems): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const leftMargin = 15;
  const rightMargin = 195;
  const contentWidth = rightMargin - leftMargin; // 180mm

  // --------------------------------------------------------------------------
  // 1. BRAND HEADER BANNER (Forest Green #1B4D3E)
  // --------------------------------------------------------------------------
  doc.setFillColor(27, 77, 62);
  doc.rect(leftMargin, 12, contentWidth, 26, 'F');

  // Official Logo Container Badge (Crisp White rounded box)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(leftMargin + 3, 14, 22, 22, 2.5, 2.5, 'F');

  // Embed Official BGW Logo
  try {
    doc.addImage(BGW_LOGO_BASE64, 'PNG', leftMargin + 3.5, 14.5, 21, 21);
  } catch (logoErr) {
    console.warn('Failed to render BGW logo in estimate PDF:', logoErr);
  }

  // Nursery Title (White)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text("BHARTI'S GREEN WORLD", leftMargin + 28, 20.5);

  // Nursery Subtitle & Location
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'Landscape Architecture • Garden Design & Commercial Nursery',
    leftMargin + 28,
    26.5
  );
  doc.setFontSize(7.5);
  doc.text(
    'Bambarwadi, Tal. Panhala, Dist. Kolhapur • Phone: +91 85307 91085',
    leftMargin + 28,
    32.5
  );

  // Right Header Badge: QUOTATION & ESTIMATE
  doc.setFillColor(232, 242, 238);
  doc.rect(rightMargin - 52, 17, 46, 7, 'F');
  doc.setTextColor(27, 77, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SITE ESTIMATE & QUOTATION', rightMargin - 29, 21.8, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(estimate.estimateNo, rightMargin - 6, 31, { align: 'right' });

  // --------------------------------------------------------------------------
  // 2. CLIENT & SITE METADATA CARD (Two-Column Grid)
  // --------------------------------------------------------------------------
  let currentY = 43;

  const estimateDate = new Date(estimate.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Metadata Card Background
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.rect(leftMargin, currentY, contentWidth, 22, 'FD');

  const metaTextY = currentY + 5.5;

  // Left Column - Quotation Reference & Site Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Quote Date:', leftMargin + 4, metaTextY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(estimateDate, leftMargin + 28, metaTextY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Site Location:', leftMargin + 4, metaTextY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(estimate.siteLocation.slice(0, 38), leftMargin + 28, metaTextY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Plot / Area:', leftMargin + 4, metaTextY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 77, 62);
  doc.text(estimate.plotArea, leftMargin + 28, metaTextY + 11);

  // Right Column - Client Profile & Status
  const rightColX = 110;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Client Name:', rightColX, metaTextY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(estimate.clientName.slice(0, 32), rightColX + 28, metaTextY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Contact Phone:', rightColX, metaTextY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(`+91 ${estimate.clientPhone}`, rightColX + 28, metaTextY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Quote Status:', rightColX, metaTextY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(
    estimate.status === 'APPROVED' || estimate.status === 'CONVERTED'
      ? 22
      : estimate.status === 'SENT'
      ? 30
      : 107,
    estimate.status === 'APPROVED' || estimate.status === 'CONVERTED'
      ? 163
      : estimate.status === 'SENT'
      ? 64
      : 114,
    estimate.status === 'APPROVED' || estimate.status === 'CONVERTED'
      ? 74
      : estimate.status === 'SENT'
      ? 175
      : 128
  );
  doc.text(estimate.status, rightColX + 28, metaTextY + 11);

  // --------------------------------------------------------------------------
  // 3. SCOPE OF WORK (if specified)
  // --------------------------------------------------------------------------
  currentY += 26;

  if (estimate.scopeOfWork && estimate.scopeOfWork.trim().length > 0) {
    doc.setFillColor(243, 247, 245);
    doc.setDrawColor(187, 222, 206);
    doc.rect(leftMargin, currentY, contentWidth, 12, 'FD');

    doc.setFillColor(27, 77, 62);
    doc.rect(leftMargin, currentY, 2, 12, 'F'); // Accent bar

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(27, 77, 62);
    doc.text('Scope of Work & Execution Summary:', leftMargin + 4, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    doc.text(estimate.scopeOfWork, leftMargin + 4, currentY + 8.5, {
      maxWidth: contentWidth - 8,
    });

    currentY += 16;
  }

  // --------------------------------------------------------------------------
  // 4. ITEMIZED MATERIALS & BOTANICAL ITEMS TABLE HEADER
  // --------------------------------------------------------------------------
  doc.setFillColor(232, 242, 238);
  doc.rect(leftMargin, currentY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 77, 62);

  doc.text('#', leftMargin + 3, currentY + 4.8);
  doc.text('Description of Botanical Plants / Site Materials', leftMargin + 12, currentY + 4.8);
  doc.text('Category', leftMargin + 95, currentY + 4.8);
  doc.text('Qty', leftMargin + 128, currentY + 4.8, { align: 'right' });
  doc.text('Rate (Rs.)', leftMargin + 155, currentY + 4.8, { align: 'right' });
  doc.text('Amount (Rs.)', rightMargin - 3, currentY + 4.8, { align: 'right' });

  // --------------------------------------------------------------------------
  // 5. LINE ITEMS
  // --------------------------------------------------------------------------
  currentY += 8.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);

  estimate.lineItems.forEach((item, index) => {
    // Multi-page check
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    const desc = item.description || 'Landscaping Item';
    const category = item.category || 'PLANTS';
    const qty = String(item.qty);
    const rate = item.unitRate.toFixed(2);
    const lineTotal = item.total.toFixed(2);

    // Zebra row shading
    if (index % 2 === 1) {
      doc.setFillColor(251, 253, 251);
      doc.rect(leftMargin, currentY - 3.5, contentWidth, 6.5, 'F');
    }

    doc.text(String(index + 1), leftMargin + 3, currentY + 1);
    doc.text(desc.slice(0, 44), leftMargin + 12, currentY + 1);
    doc.text(category, leftMargin + 95, currentY + 1);
    doc.text(qty, leftMargin + 128, currentY + 1, { align: 'right' });
    doc.text(rate, leftMargin + 155, currentY + 1, { align: 'right' });
    doc.text(lineTotal, rightMargin - 3, currentY + 1, { align: 'right' });

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.line(leftMargin, currentY + 3, rightMargin, currentY + 3);

    currentY += 6.5;
  });

  // --------------------------------------------------------------------------
  // 6. FINANCIAL BREAKDOWN & COMMERCIAL TERMS
  // --------------------------------------------------------------------------
  currentY += 5;

  if (currentY > 215) {
    doc.addPage();
    currentY = 20;
  }

  // Left Note: Quotation Terms & Conditions
  const termsBoxWidth = 90;
  const termsHeight = 32;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.rect(leftMargin, currentY, termsBoxWidth, termsHeight, 'FD');

  doc.setFillColor(27, 77, 62);
  doc.rect(leftMargin, currentY, 2, termsHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(27, 77, 62);
  doc.text('Commercial Terms & Milestone Schedule:', leftMargin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  doc.text('• Estimate Validity: 30 Calendar Days from quotation date.', leftMargin + 4, currentY + 10);
  doc.text('• Milestone 1: 40% advance mobilization & earth prep.', leftMargin + 4, currentY + 15);
  doc.text('• Milestone 2: 40% on plant supply & lawn installation.', leftMargin + 4, currentY + 20);
  doc.text('• Milestone 3: 20% on final handover & initial inspection.', leftMargin + 4, currentY + 25);
  doc.text('• Water & electrical connection to be facilitated on-site.', leftMargin + 4, currentY + 30);

  // Right Box: Financial Summary
  const summaryBoxWidth = 80;
  const summaryBoxX = rightMargin - summaryBoxWidth;
  const summaryHeight = 32;

  doc.setFillColor(250, 251, 249);
  doc.setDrawColor(209, 213, 219);
  doc.rect(summaryBoxX, currentY, summaryBoxWidth, summaryHeight, 'FD');

  let sumY = currentY + 6;

  // Material Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('Material Subtotal:', summaryBoxX + 4, sumY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(`Rs. ${estimate.materialTotal.toFixed(2)}`, rightMargin - 4, sumY, { align: 'right' });

  // Labor Charges
  sumY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Site Labor & Prep Charges:', summaryBoxX + 4, sumY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(`Rs. ${estimate.laborCharges.toFixed(2)}`, rightMargin - 4, sumY, { align: 'right' });

  // Grand Total Line
  sumY += 7;
  doc.setDrawColor(27, 77, 62);
  doc.line(summaryBoxX + 2, sumY - 3, rightMargin - 2, sumY - 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 77, 62);
  doc.text('Grand Total Estimate:', summaryBoxX + 4, sumY);
  doc.text(`Rs. ${estimate.grandTotal.toFixed(2)}`, rightMargin - 4, sumY, { align: 'right' });

  // Tax notice below grand total
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text('* Agricultural Produce GST-Exempt', rightMargin - 4, sumY + 5, { align: 'right' });

  // --------------------------------------------------------------------------
  // 7. DUAL SIGNATURE BLOCK
  // --------------------------------------------------------------------------
  let sigY = Math.max(currentY + summaryHeight + 16, 255);
  if (sigY > 265) {
    doc.addPage();
    sigY = 30;
  }

  doc.setDrawColor(156, 163, 175);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(leftMargin + 6, sigY, leftMargin + 65, sigY);
  doc.line(rightMargin - 65, sigY, rightMargin - 6, sigY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Client Acceptance Signature', leftMargin + 35, sigY + 4, { align: 'center' });
  doc.text("Authorized Landscape Architect (Bharti's)", rightMargin - 35, sigY + 4, { align: 'center' });

  // --------------------------------------------------------------------------
  // 8. FOOTER NOTE & LEGAL DISCLAIMER
  // --------------------------------------------------------------------------
  const footerY = 285;
  doc.setDrawColor(209, 213, 219);
  doc.line(leftMargin, footerY - 5, rightMargin, footerY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(27, 77, 62);
  doc.text(
    "🌱 Bharti's Green World Nursery • Turning Spaces Into Living Sanctuaries • Kolhapur 🌸",
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return doc;
}

export function generateEstimatePdf(
  estimate: LandscapingEstimateWithParsedItems,
  autoSave: boolean = true
): jsPDF {
  const doc = buildEstimatePdf(estimate);

  if (autoSave) {
    const sanitizedFileName = `Bharti_Estimate_${estimate.estimateNo}.pdf`;
    doc.save(sanitizedFileName);
  }

  return doc;
}

