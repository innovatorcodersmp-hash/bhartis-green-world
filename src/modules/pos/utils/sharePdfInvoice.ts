/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/utils/sharePdfInvoice.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented unified vector PDF Web Share API utility (`shareInvoicePdf`) alongside DOM capture helper (`captureAndShareInvoicePdf`).
 *    - Converted vector `jsPDF` instances created by `generateInvoicePdf(bill, false)` directly into `File` blobs (`application/pdf`).
 *    - Evaluated `navigator.canShare({ files: [pdfFile] })` to invoke native mobile OS share sheets (`navigator.share`),
 *      allowing cashiers and customers to pick WhatsApp directly with the official vector PDF invoice attached.
 *    - Gracefully falls back to standard client-side PDF file download if the browser environment lacks Web Share file capabilities (e.g., desktop browsers).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: UNIFY PDF GENERATOR FOR WHATSAPP SHARE AND DOWNLOAD".
 *    - Bypasses traditional WhatsApp text link limits, allowing actual vector PDF documents to be attached directly to WhatsApp chats.
 *    - Delivers an eco-friendly, professional, paperless invoicing experience for nursery customers in Kolhapur.
 * 
 * 3. WHAT WAS USED:
 *    - `jspdf` for vector PDF container synthesis.
 *    - `html2canvas` for optional DOM fallback rasterization.
 *    - Web Share API (`navigator.canShare`, `navigator.share`).
 *    - Domain types (`PosBillWithRelations`).
 * 
 * 4. HOW IT WORKS:
 *    - Generates unified vector PDF file blob, prompts native mobile share sheet, or falls back to browser download.
 * 
 * ----------------------------------------------------------------------------
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PosBillWithRelations } from '../types';
import { generateInvoicePdf } from './generateInvoicePdf';

export interface SharePdfResult {
  shared: boolean;
  downloaded: boolean;
  error?: string;
}

export interface CaptureAndShareOptions {
  title?: string;
  text?: string;
}

/**
 * Shares official unified vector PDF tax invoice via Web Share API or downloads on desktop.
 */
export async function shareInvoicePdf(
  bill: PosBillWithRelations,
  options?: CaptureAndShareOptions
): Promise<SharePdfResult> {
  try {
    const doc = generateInvoicePdf(bill, false);
    const fileName = `Bharti_Nursery_Invoice_${bill.billNumber}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [pdfFile] });

    if (canShareFiles && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          files: [pdfFile],
          title: options?.title || `Invoice ${bill.billNumber}`,
          text: options?.text || "Bharti's Green World Invoice",
        });
        return { shared: true, downloaded: false };
      } catch (shareError: unknown) {
        if (
          shareError instanceof Error &&
          (shareError.name === 'AbortError' || shareError.message.includes('abort'))
        ) {
          return { shared: false, downloaded: false, error: 'Share cancelled.' };
        }
        console.warn('Web Share failed, falling back to direct download:', shareError);
        doc.save(fileName);
        return { shared: false, downloaded: true };
      }
    } else {
      doc.save(fileName);
      return { shared: false, downloaded: true };
    }
  } catch (error: unknown) {
    console.error('[shareInvoicePdf Error]:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate PDF invoice.';
    return { shared: false, downloaded: false, error: message };
  }
}

/**
 * DOM capture fallback helper using html2canvas.
 */
export async function captureAndShareInvoicePdf(
  receiptElement: HTMLElement,
  billNumber: string,
  options?: CaptureAndShareOptions
): Promise<SharePdfResult> {
  try {
    if (!receiptElement) {
      throw new Error('Receipt element not found for PDF capture.');
    }

    const canvas = await html2canvas(receiptElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);

    const fileName = `Bharti_Nursery_Invoice_${billNumber}.pdf`;
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [pdfFile] });

    if (canShareFiles && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          files: [pdfFile],
          title: options?.title || `Invoice ${billNumber}`,
          text: options?.text || "Bharti's Green World Invoice",
        });
        return { shared: true, downloaded: false };
      } catch (shareError: unknown) {
        if (
          shareError instanceof Error &&
          (shareError.name === 'AbortError' || shareError.message.includes('abort'))
        ) {
          return { shared: false, downloaded: false, error: 'Share cancelled.' };
        }
        console.warn('Web Share failed, falling back to direct download:', shareError);
        pdf.save(fileName);
        return { shared: false, downloaded: true };
      }
    } else {
      pdf.save(fileName);
      return { shared: false, downloaded: true };
    }
  } catch (error: unknown) {
    console.error('[captureAndShareInvoicePdf Error]:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate PDF invoice.';
    return { shared: false, downloaded: false, error: message };
  }
}
