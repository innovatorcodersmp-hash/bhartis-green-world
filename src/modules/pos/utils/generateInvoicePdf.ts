/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/utils/generateInvoicePdf.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Compacted the client-side vector Tax Invoice PDF generator (`buildInvoicePdf`, `generateInvoicePdf`).
 *    - Completely removed signature blocks ("Customer / Receiver's Signature", "Authorized Signatory").
 *    - Completely removed bottom legal disclaimer and footer notes.
 *    - Dynamically calculated document page height based strictly on content items and summary boxes,
 *      eliminating all unnecessary white space and ending cleanly right below the Grand Total box.
 *    - Embedded official nursery logo badge in top header banner (`NURSERY_LOGO_BASE64`).
 *    - Maintained unified vector PDF output for both mobile Web Share API (`navigator.share`) and direct download (`doc.save`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: REMOVE SIGNATURES AND FOOTER TO COMPACT THE PDF INVOICE LAYOUT".
 *    - Streamlines digital e-bill PDF appearance on smartphones and WhatsApp chats, removing blank void.
 *    - Produces a clean, tightly cropped executive tax invoice card for fast review and printing.
 *    - Complies with Specification 01: "PWA Clean UI Standards" & Specification 03: "Component Specifications".
 * 
 * 3. WHAT WAS USED:
 *    - `jspdf` vector document builder with dynamic height configuration.
 *    - Base64 Data URL constant (`NURSERY_LOGO_BASE64`).
 *    - TypeScript domain types (`PosBillWithRelations`).
 * 
 * 4. HOW IT WORKS:
 *    - Dynamically computes `totalPageHeight = Math.max(115, Math.ceil(summaryY + summaryHeight + 8))`.
 *    - Instantiates `jsPDF` using custom page height (`[pageWidth, totalPageHeight]`).
 *    - Draws branded header with logo, metadata card, itemized table, and financial summary box.
 *    - Terminates cleanly below the summary box with zero trailing blank space.
 * 
 * ----------------------------------------------------------------------------
 */

import { jsPDF } from 'jspdf';
import { PosBillWithRelations } from '../types';
import { NURSERY_LOGO_BASE64 } from './nurseryLogoBase64';

export function buildInvoicePdf(bill: PosBillWithRelations): jsPDF {
  const pageWidth = 210;
  const leftMargin = 15;
  const rightMargin = 195;
  const contentWidth = rightMargin - leftMargin; // 180mm

  // Layout coordinate calculations
  const headerY = 10;
  const headerHeight = 24;
  const metaY = 37;
  const metaHeight = 18;
  const tableHeaderY = 58;
  const tableHeaderHeight = 6.5;
  const rowHeight = 6;
  const itemsStartY = 68.5;
  const itemsTotalHeight = bill.items.length * rowHeight;
  const summaryY = itemsStartY + itemsTotalHeight + 2.5;
  const summaryHeight = bill.balanceDue > 0 ? 30 : 25;
  const bottomPadding = 8;

  // Calculate dynamic compact page height
  const totalPageHeight = Math.max(
    115,
    Math.ceil(summaryY + summaryHeight + bottomPadding)
  );

  // jsPDF requires width <= height for portrait orientation
  const isLandscape = totalPageHeight < pageWidth;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: isLandscape ? [totalPageHeight, pageWidth] : [pageWidth, totalPageHeight],
  });

  // --------------------------------------------------------------------------
  // 1. BRAND HEADER BANNER (Forest Green #1B4D3E)
  // --------------------------------------------------------------------------
  doc.setFillColor(27, 77, 62);
  doc.rect(leftMargin, headerY, contentWidth, headerHeight, 'F');

  // Official Logo Container Badge (Crisp White rounded box)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(leftMargin + 2.5, headerY + 2, 20, 20, 2, 2, 'F');

  // Embed Official Logo Image
  try {
    doc.addImage(NURSERY_LOGO_BASE64, 'PNG', leftMargin + 3, headerY + 2.5, 19, 19);
  } catch (logoErr) {
    console.warn('Failed to render logo in PDF, using fallback:', logoErr);
  }

  // Nursery Title (White)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text("BHARTI'S GREEN WORLD", leftMargin + 26, headerY + 7);

  // Nursery Subtitle & Location
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'Plant Nursery & Landscape Architecture • Kolhapur, Maharashtra',
    leftMargin + 26,
    headerY + 13
  );
  doc.setFontSize(7.5);
  doc.text(
    'Shiroli / Kolhapur 416122 • Phone: +91 98220 12345 • GSTIN: 27AABCB1234F1Z5',
    leftMargin + 26,
    headerY + 19
  );

  // Document Badge on Right Header
  doc.setFillColor(232, 242, 238);
  doc.rect(rightMargin - 48, headerY + 3.5, 44, 6.5, 'F');
  doc.setTextColor(27, 77, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TAX INVOICE / CASH MEMO', rightMargin - 26, headerY + 8, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(bill.billNumber, rightMargin - 4, headerY + 18, { align: 'right' });

  // --------------------------------------------------------------------------
  // 2. INVOICE & CUSTOMER METADATA CARD (Two-Column Grid)
  // --------------------------------------------------------------------------
  const customerName = bill.customer?.name || 'Walk-in Retail Buyer';
  const customerPhone = bill.customer?.phone || 'Walk-in Guest';

  const billDate = new Date(bill.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const billTime = new Date(bill.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabel =
    bill.paymentMode === 'CASH'
      ? 'Cash Counter'
      : bill.paymentMode === 'UPI'
      ? 'UPI / Digital Bank Transfer'
      : 'Credit (Udhar Ledger)';

  // Metadata Card Background
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.rect(leftMargin, metaY, contentWidth, metaHeight, 'FD');

  const metaTextY = metaY + 4.8;

  // Left Column - Bill Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Invoice Date:', leftMargin + 4, metaTextY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(`${billDate}, ${billTime}`, leftMargin + 28, metaTextY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Payment Mode:', leftMargin + 4, metaTextY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(paymentLabel, leftMargin + 28, metaTextY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Counter Desk:', leftMargin + 4, metaTextY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text('Main POS Billing Desk', leftMargin + 28, metaTextY + 10);

  // Right Column - Customer Profile
  const rightColX = 110;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Customer Name:', rightColX, metaTextY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(customerName.slice(0, 32), rightColX + 28, metaTextY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Contact Number:', rightColX, metaTextY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(customerPhone, rightColX + 28, metaTextY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Customer Type:', rightColX, metaTextY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(
    bill.customer ? 'Registered Directory Customer' : 'Walk-in Retail Buyer',
    rightColX + 28,
    metaTextY + 10
  );

  // --------------------------------------------------------------------------
  // 3. ITEMS TABLE HEADER
  // --------------------------------------------------------------------------
  doc.setFillColor(232, 242, 238);
  doc.rect(leftMargin, tableHeaderY, contentWidth, tableHeaderHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 77, 62);

  doc.text('#', leftMargin + 3, tableHeaderY + 4.5);
  doc.text('Item Description / Plant Cultivar', leftMargin + 12, tableHeaderY + 4.5);
  doc.text('Category', leftMargin + 92, tableHeaderY + 4.5);
  doc.text('Qty', leftMargin + 125, tableHeaderY + 4.5, { align: 'right' });
  doc.text('Rate (Rs.)', leftMargin + 152, tableHeaderY + 4.5, { align: 'right' });
  doc.text('Total (Rs.)', rightMargin - 3, tableHeaderY + 4.5, { align: 'right' });

  // --------------------------------------------------------------------------
  // 4. LINE ITEMS
  // --------------------------------------------------------------------------
  let currentY = itemsStartY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);

  bill.items.forEach((item, index) => {
    const plantName = item.plant?.name || 'Botanical Plant';
    const skuText = item.plant?.sku ? ` (${item.plant.sku})` : '';
    const fullDesc = `${plantName}${skuText}`;
    const category = item.plant?.category || 'NURSERY';
    const qty = String(item.quantity);
    const unitPrice = item.unitPrice.toFixed(2);
    const lineTotal = item.totalPrice.toFixed(2);

    // Zebra striping
    if (index % 2 === 1) {
      doc.setFillColor(251, 253, 251);
      doc.rect(leftMargin, currentY - 3.5, contentWidth, rowHeight, 'F');
    }

    doc.text(String(index + 1), leftMargin + 3, currentY + 0.8);
    doc.text(fullDesc.slice(0, 42), leftMargin + 12, currentY + 0.8);
    doc.text(category, leftMargin + 92, currentY + 0.8);
    doc.text(qty, leftMargin + 125, currentY + 0.8, { align: 'right' });
    doc.text(unitPrice, leftMargin + 152, currentY + 0.8, { align: 'right' });
    doc.text(lineTotal, rightMargin - 3, currentY + 0.8, { align: 'right' });

    // Subtle divider
    doc.setDrawColor(229, 231, 235);
    doc.line(leftMargin, currentY + 2.7, rightMargin, currentY + 2.7);

    currentY += rowHeight;
  });

  // --------------------------------------------------------------------------
  // 5. FINANCIAL SETTLEMENT SUMMARY CARD & GST EXEMPT NOTICE
  // --------------------------------------------------------------------------
  const summaryBoxActualY = currentY + 2.5;

  // Left Note: Agricultural Goods GST Notice
  const noteBoxWidth = 85;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.rect(leftMargin, summaryBoxActualY, noteBoxWidth, summaryHeight, 'FD');

  doc.setFillColor(16, 185, 129);
  doc.rect(leftMargin, summaryBoxActualY, 2, summaryHeight, 'F'); // Green accent bar

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(27, 77, 62);
  doc.text('Agricultural Horticultural Produce:', leftMargin + 4, summaryBoxActualY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  doc.text(
    'Live botanical plants, nursery saplings, and green foliage are exempt from GST under statutory Nil-rated agricultural notifications.',
    leftMargin + 4,
    summaryBoxActualY + 10,
    { maxWidth: noteBoxWidth - 7 }
  );

  // Right Summary Box
  const summaryBoxWidth = 82;
  const summaryBoxX = rightMargin - summaryBoxWidth;

  doc.setFillColor(250, 251, 249);
  doc.setDrawColor(209, 213, 219);
  doc.rect(summaryBoxX, summaryBoxActualY, summaryBoxWidth, summaryHeight, 'FD');

  let sumY = summaryBoxActualY + 5;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('Subtotal:', summaryBoxX + 4, sumY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(`Rs. ${bill.totalAmount.toFixed(2)}`, rightMargin - 4, sumY, { align: 'right' });

  // Discount
  sumY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Discount:', summaryBoxX + 4, sumY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('Rs. 0.00', rightMargin - 4, sumY, { align: 'right' });

  // Amount Received
  sumY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Net Amount Paid:', summaryBoxX + 4, sumY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(`Rs. ${bill.amountPaid.toFixed(2)}`, rightMargin - 4, sumY, { align: 'right' });

  // Balance Due (Udhar)
  if (bill.balanceDue > 0) {
    sumY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 38, 38);
    doc.text('Balance Due (Udhar):', summaryBoxX + 4, sumY);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${bill.balanceDue.toFixed(2)}`, rightMargin - 4, sumY, { align: 'right' });
  }

  // Grand Total Line
  sumY += 5;
  doc.setDrawColor(27, 77, 62);
  doc.line(summaryBoxX + 2, sumY - 3.2, rightMargin - 2, sumY - 3.2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(27, 77, 62);
  doc.text('Grand Total:', summaryBoxX + 4, sumY);
  doc.text(`Rs. ${bill.totalAmount.toFixed(2)}`, rightMargin - 4, sumY, { align: 'right' });

  return doc;
}

export function generateInvoicePdf(
  bill: PosBillWithRelations,
  autoSave: boolean = true
): jsPDF {
  const doc = buildInvoicePdf(bill);

  if (autoSave) {
    const sanitizedFileName = `Bharti_Nursery_Invoice_${bill.billNumber}.pdf`;
    doc.save(sanitizedFileName);
  }

  return doc;
}
