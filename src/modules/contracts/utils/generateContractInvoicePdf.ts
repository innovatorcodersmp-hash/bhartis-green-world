/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/utils/generateContractInvoicePdf.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built client-side vector PDF generator (`buildContractInvoicePdf`, `generateContractInvoicePdf`)
 *      for Landscaping Projects & Garden Contract Milestone Invoices.
 *    - Structured executive A4 Portrait layout:
 *      * Brand Header: Forest green banner (#1B4D3E), official nursery logo (`BGW_LOGO_BASE64`),
 *        landscape architecture metadata, and milestone invoice badge.
 *      * Site & Client Profile Card: Two-column grid detailing Invoice No, Date, Contract ID,
 *        Client Name, Mobile Phone, Site Location, Plot Dimensions, and Project Classification.
 *      * Stage Execution Tracker: Visual progression indicator highlighting current stage
 *        (Site Prep, Planting & Lawn, Irrigation Setup, Handover) and % completion.
 *      * Milestone Valuation Table: Total contract quotation, previous collections, current stage claim,
 *        and net outstanding balance.
 *      * Payment Ledger Snapshot: Itemized list of historical payment receipts (`GardenContractPayment[]`).
 *      * Payment Modes & Banking: Verified UPI ID (`bhartisgreenworld@okaxis`) and Kolhapur branch banking details.
 *      * Authorized Signatory & Client Acceptance blocks.
 *    - Enabled automatic browser download and direct Blob/File generation for instant sharing.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT CONTRACT STAGE INVOICING AND ADVANCE PAYMENT LEDGER IN MODULE 6".
 *    - Guarantees professional corporate billing standards for large-scale landscaping projects in Kolhapur.
 *    - Complies with Specification 01: "PWA Clean UI Standards" & Specification 07: "Code Quality Standards".
 * 
 * 3. WHAT WAS USED:
 *    - `jspdf` vector document builder.
 *    - Base64 Data URL constant (`BGW_LOGO_BASE64`).
 *    - TypeScript domain types (`GardenContractWithRelations`, `MilestoneInvoicePayload`).
 * 
 * 4. HOW IT WORKS:
 *    - `buildContractInvoicePdf(contract, milestoneData)` builds the multi-section vector document.
 *    - `generateContractInvoicePdf(contract, milestoneData, autoSave)` triggers browser download or returns `doc`.
 * 
 * ----------------------------------------------------------------------------
 */

import { jsPDF } from 'jspdf';
import { GardenContractWithRelations, MilestoneInvoicePayload } from '../types';
import { BGW_LOGO_BASE64 } from './bgwLogoBase64';

export function buildContractInvoicePdf(
  contract: GardenContractWithRelations,
  milestoneData?: Partial<MilestoneInvoicePayload>
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const leftMargin = 15;
  const rightMargin = 195;
  const contentWidth = rightMargin - leftMargin; // 180mm

  // Determine stage and invoice metadata
  const currentStageName =
    milestoneData?.stageName ||
    (contract.currentStage === 'SITE_PREP'
      ? 'Site Preparation & Earthwork'
      : contract.currentStage === 'PLANTING'
      ? 'Tree Plantation & Lawn Turf'
      : contract.currentStage === 'IRRIGATION_SETUP'
      ? 'Drip & Sprinkler Setup'
      : 'Maintenance & Handover');

  const invoiceNo =
    milestoneData?.receiptNo ||
    `INV-${contract.contractNo}-${contract.currentStage}`;

  const invoiceDateStr = milestoneData?.invoiceDate
    ? new Date(milestoneData.invoiceDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const invoiceAmount = milestoneData?.invoiceAmount ?? contract.totalEstimate;
  const totalPaid = milestoneData?.totalPaid ?? contract.advanceReceived;
  const balanceDue = milestoneData?.balanceDue ?? contract.balanceAmount;

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
    console.warn('Failed to render BGW logo in contract invoice PDF:', logoErr);
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
    'Shiroli / Kolhapur 416122 • Phone: +91 98220 12345 • GSTIN: 27AABCB1234F1Z5',
    leftMargin + 28,
    32.5
  );

  // Right Header Badge: STAGE TAX INVOICE
  doc.setFillColor(232, 242, 238);
  doc.rect(rightMargin - 54, 17, 48, 7, 'F');
  doc.setTextColor(27, 77, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('STAGE TAX INVOICE', rightMargin - 30, 21.8, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(invoiceNo, rightMargin - 6, 31, { align: 'right' });

  // --------------------------------------------------------------------------
  // 2. CLIENT & SITE METADATA CARD (Two-Column Grid)
  // --------------------------------------------------------------------------
  let currentY = 43;

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.rect(leftMargin, currentY, contentWidth, 25, 'FD');

  const metaTextY = currentY + 5.5;

  // Left Column - Contract ID, Date, Client Name & Phone
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Contract ID:', leftMargin + 4, metaTextY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 77, 62);
  doc.text(contract.contractNo, leftMargin + 28, metaTextY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Invoice Date:', leftMargin + 4, metaTextY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(invoiceDateStr, leftMargin + 28, metaTextY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Client Name:', leftMargin + 4, metaTextY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(contract.customer?.name || 'Valued Client', leftMargin + 28, metaTextY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Tel: ${contract.customer?.phone || 'N/A'}`, leftMargin + 28, metaTextY + 16.5);

  // Right Column - Site Location, Plot Size, Project Classification
  const rightColX = leftMargin + 100;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Site Location:', rightColX, metaTextY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(contract.siteAddress.slice(0, 32), rightColX + 24, metaTextY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Plot / Area:', rightColX, metaTextY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 77, 62);
  doc.text(contract.plotSize, rightColX + 24, metaTextY + 6);

  const projectTypeLabel =
    contract.projectType === 'LAWN'
      ? 'Lawn & Turf Development'
      : contract.projectType === 'ORCHARD'
      ? 'Fruit Orchard Plantation'
      : contract.projectType === 'RESIDENTIAL'
      ? 'Residential Landscape'
      : 'Drip & Micro-Irrigation';

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Classification:', rightColX, metaTextY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(projectTypeLabel, rightColX + 24, metaTextY + 12);

  // --------------------------------------------------------------------------
  // 3. MILESTONE STAGE & EXECUTION PROGRESS
  // --------------------------------------------------------------------------
  currentY += 29;

  doc.setFillColor(232, 242, 238);
  doc.rect(leftMargin, currentY, contentWidth, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 77, 62);
  doc.text('ACTIVE MILESTONE STAGE:', leftMargin + 4, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 24, 39);
  doc.text(currentStageName, leftMargin + 50, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 77, 62);
  doc.text(`PROJECT COMPLETION: ${contract.progressPercent}% DONE`, rightMargin - 4, currentY + 5, {
    align: 'right',
  });

  // Progress Bar Line
  doc.setDrawColor(209, 213, 219);
  doc.setFillColor(229, 231, 235);
  doc.roundedRect(leftMargin + 4, currentY + 7.5, contentWidth - 8, 2.5, 1, 1, 'F');

  const filledWidth = Math.max(3, ((contentWidth - 8) * contract.progressPercent) / 100);
  doc.setFillColor(27, 77, 62);
  doc.roundedRect(leftMargin + 4, currentY + 7.5, filledWidth, 2.5, 1, 1, 'F');

  // --------------------------------------------------------------------------
  // 4. FINANCIAL SUMMARY & MILESTONE VALUATION TABLE
  // --------------------------------------------------------------------------
  currentY += 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 77, 62);
  doc.text('CONTRACT FINANCIAL SCHEDULE & STAGE DISBURSEMENTS', leftMargin, currentY);

  currentY += 3;

  // Table Header
  doc.setFillColor(27, 77, 62);
  doc.rect(leftMargin, currentY, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('#', leftMargin + 4, currentY + 4.8);
  doc.text('Milestone Component / Financial Description', leftMargin + 16, currentY + 4.8);
  doc.text('Status / Terms', leftMargin + 115, currentY + 4.8);
  doc.text('Amount (INR)', rightMargin - 4, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // Financial Line Items
  const financeRows = [
    {
      num: '1',
      desc: 'Total Agreed Contract Project Valuation',
      status: 'Project Quotation',
      amount: `Rs. ${contract.totalEstimate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      isBold: true,
      color: [17, 24, 39],
    },
    {
      num: '2',
      desc: 'Total Advances & Payments Collected to Date',
      status: 'Cumulative Receipts',
      amount: `Rs. ${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      isBold: false,
      color: [22, 101, 52],
    },
    {
      num: '3',
      desc: `Current Milestone Invoiced: ${currentStageName}`,
      status: 'Current Claim',
      amount: `Rs. ${invoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      isBold: true,
      color: [27, 77, 62],
    },
    {
      num: '4',
      desc: 'Remaining Contract Balance Pending',
      status: balanceDue > 0 ? 'Due upon Completion' : 'Fully Cleared',
      amount: `Rs. ${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      isBold: true,
      color: balanceDue > 0 ? [185, 28, 28] : [22, 101, 52],
    },
  ];

  for (let i = 0; i < financeRows.length; i++) {
    const row = financeRows[i];
    doc.setFillColor(i % 2 === 0 ? 255 : 249, 250, 251);
    doc.rect(leftMargin, currentY, contentWidth, 7, 'F');

    doc.setDrawColor(243, 244, 246);
    doc.line(leftMargin, currentY + 7, rightMargin, currentY + 7);

    doc.setFont('helvetica', row.isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(row.num, leftMargin + 4, currentY + 4.8);

    doc.setTextColor(row.color[0], row.color[1], row.color[2]);
    doc.text(row.desc, leftMargin + 16, currentY + 4.8);

    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(row.status, leftMargin + 115, currentY + 4.8);

    doc.setFont('helvetica', row.isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(row.color[0], row.color[1], row.color[2]);
    doc.text(row.amount, rightMargin - 4, currentY + 4.8, { align: 'right' });

    currentY += 7;
  }

  // --------------------------------------------------------------------------
  // 5. PAYMENT LEDGER SNAPSHOT (If payment records exist)
  // --------------------------------------------------------------------------
  if (contract.payments && contract.payments.length > 0) {
    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(27, 77, 62);
    doc.text('RECENT STAGE PAYMENT LEDGER', leftMargin, currentY);

    currentY += 3;

    // Sub-table Header
    doc.setFillColor(243, 244, 246);
    doc.rect(leftMargin, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(75, 85, 99);
    doc.text('Receipt No', leftMargin + 4, currentY + 4.2);
    doc.text('Date', leftMargin + 38, currentY + 4.2);
    doc.text('Milestone Stage', leftMargin + 66, currentY + 4.2);
    doc.text('Mode', leftMargin + 118, currentY + 4.2);
    doc.text('Amount (INR)', rightMargin - 4, currentY + 4.2, { align: 'right' });

    currentY += 6;

    const displayedPayments = contract.payments.slice(-4); // Show up to last 4 payments
    for (const p of displayedPayments) {
      doc.setFillColor(255, 255, 255);
      doc.rect(leftMargin, currentY, contentWidth, 5.5, 'F');
      doc.setDrawColor(243, 244, 246);
      doc.line(leftMargin, currentY + 5.5, rightMargin, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(31, 41, 55);
      doc.text(p.receiptNo || 'RCP-N/A', leftMargin + 4, currentY + 3.8);

      const pDate = new Date(p.paidAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      });
      doc.text(pDate, leftMargin + 38, currentY + 3.8);
      doc.text(p.stageName.replace(/_/g, ' '), leftMargin + 66, currentY + 3.8);
      doc.text(p.paymentMode, leftMargin + 118, currentY + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text(
        `Rs. ${p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        rightMargin - 4,
        currentY + 3.8,
        { align: 'right' }
      );

      currentY += 5.5;
    }
  }

  // --------------------------------------------------------------------------
  // 6. BANKING & UPI SETTLEMENT DETAILS
  // --------------------------------------------------------------------------
  currentY += 5;

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.rect(leftMargin, currentY, contentWidth, 18, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 77, 62);
  doc.text('PAYMENT DETAILS & VERIFIED ACCOUNTS:', leftMargin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(31, 41, 55);
  doc.text(
    'UPI (Google Pay / PhonePe / Paytm): bhartisgreenworld@okaxis',
    leftMargin + 4,
    currentY + 10.5
  );
  doc.text(
    'Bank: State Bank of India • Branch: Shiroli Kolhapur • IFSC: SBIN0001234 • A/C: 38291048591',
    leftMargin + 4,
    currentY + 15
  );

  // --------------------------------------------------------------------------
  // 7. SUPERVISOR NOTES & REMARKS (If present)
  // --------------------------------------------------------------------------
  if (contract.supervisorNotes || milestoneData?.notes) {
    currentY += 21;
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(254, 240, 138);
    doc.rect(leftMargin, currentY, contentWidth, 12, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(161, 98, 7);
    doc.text('SUPERVISOR / SITE NOTES:', leftMargin + 4, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 63, 18);
    const notesText = milestoneData?.notes || contract.supervisorNotes || '';
    doc.text(notesText.slice(0, 120), leftMargin + 4, currentY + 9);
    currentY += 12;
  } else {
    currentY += 20;
  }

  // --------------------------------------------------------------------------
  // 8. SIGNATURE & VERIFICATION BLOCKS
  // --------------------------------------------------------------------------
  const sigY = Math.max(currentY + 6, 260);

  // Left: Client Acceptance
  doc.setDrawColor(156, 163, 175);
  doc.line(leftMargin + 5, sigY + 12, leftMargin + 65, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  doc.text('Client Acceptance Signature', leftMargin + 10, sigY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(156, 163, 175);
  doc.text('Date & Site Approval', leftMargin + 18, sigY + 20);

  // Right: Authorized Landscape Architect
  doc.line(rightMargin - 65, sigY + 12, rightMargin - 5, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(27, 77, 62);
  doc.text("BHARTI'S GREEN WORLD", rightMargin - 60, sigY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Authorized Signatory & Landscape Architect', rightMargin - 64, sigY + 20);

  return doc;
}

export function generateContractInvoicePdf(
  contract: GardenContractWithRelations,
  milestoneData?: Partial<MilestoneInvoicePayload>,
  autoSave: boolean = true
): jsPDF {
  const doc = buildContractInvoicePdf(contract, milestoneData);

  if (autoSave && typeof window !== 'undefined') {
    const safeContractNo = contract.contractNo.replace(/[^a-zA-Z0-9-_]/g, '_');
    const safeStage = (milestoneData?.stageName || contract.currentStage).replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `Invoice_${safeContractNo}_${safeStage}.pdf`;
    doc.save(filename);
  }

  return doc;
}

