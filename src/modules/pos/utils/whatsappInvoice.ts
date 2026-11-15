/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/utils/whatsappInvoice.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented standardized WhatsApp invoice dispatch helper functions (`formatWhatsAppInvoiceMessage`, `getWhatsAppInvoiceUrl`, `openWhatsAppInvoice`).
 *    - Structured itemized lines, invoice number, date, customer metadata, payment mode, amount paid, and Udhar balance due.
 *    - Handled Indian mobile number sanitization (E.164 91 country prefix formatting).
 *    - Handled walk-in guests without a saved phone by generating open recipient WhatsApp links (`wa.me/?text=...`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: ADD WHATSAPP INVOICE SEND ACTION TO POS BILLING LIST & CHECKOUT".
 *    - Empowers cashiers to dispatch digital paperless e-Bills instantly to customer WhatsApp with 1 click.
 *    - Eliminates paper thermal printing costs and improves payment tracking for Udhar credit accounts.
 * 
 * 3. WHAT WAS USED:
 *    - Domain types (`PosBillWithRelations`).
 *    - Standard URL encoding (`encodeURIComponent`).
 *    - Cross-browser safe window dispatch (`window.open`).
 * 
 * 4. HOW IT WORKS:
 *    - Extracts bill relations (customer name, phone, item lines, payment status).
 *    - Composes a clean botanical header and itemized line breakdown.
 *    - Opens WhatsApp Web or mobile app via universal click-to-chat `https://wa.me/` protocol.
 * 
 * ----------------------------------------------------------------------------
 */

import { PosBillWithRelations } from '../types';

export interface WhatsAppInvoiceOptions {
  customerPhone?: string;
  nurseryPhone?: string;
}

/**
 * Sanitizes and formats phone number for WhatsApp wa.me link (+91 for India).
 */
export function sanitizeWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length > 10 && !digits.startsWith('91')) {
    return `91${digits.slice(-10)}`;
  }
  return digits;
}

/**
 * Composes the structured itemized invoice message string for WhatsApp.
 */
export function formatWhatsAppInvoiceMessage(
  bill: PosBillWithRelations,
  options?: WhatsAppInvoiceOptions
): string {
  const customerName = bill.customer?.name || 'Walk-in Retail Buyer';
  const phone = options?.customerPhone || bill.customer?.phone || '';
  const nurseryPhone = options?.nurseryPhone || '+91 98220 12345';

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
      ? 'UPI / QR Digital'
      : 'Credit (Udhar)';

  const itemLines = bill.items
    .map(
      (it, idx) =>
        `${idx + 1}. *${it.plant?.name || 'Plant'}* × ${it.quantity} @ ₹${it.unitPrice.toFixed(2)} = ₹${it.totalPrice.toFixed(2)}`
    )
    .join('\n');

  const lines = [
    '🌿 *BHARTI\'S GREEN WORLD NURSERY* 🌿',
    '📍 Shiroli / Kolhapur, Maharashtra',
    `📞 Contact: ${nurseryPhone}`,
    '--------------------------------',
    '🧾 *TAX INVOICE / CASH MEMO*',
    `*Invoice No:* ${bill.billNumber}`,
    `*Date:* ${billDate}, ${billTime}`,
    `*Customer:* ${customerName} ${phone ? `(${phone})` : '(Walk-in)'}`,
    '--------------------------------',
    '🌱 *PURCHASED BOTANICAL ITEMS:*',
    itemLines || '1. Assorted Nursery Plants',
    '--------------------------------',
    `💰 *Grand Total:* ₹${bill.totalAmount.toFixed(2)}`,
    `💳 *Payment Mode:* ${paymentLabel}`,
    `💵 *Amount Received:* ₹${bill.amountPaid.toFixed(2)}`,
    bill.balanceDue > 0 ? `⚠️ *Remaining Udhar Balance:* ₹${bill.balanceDue.toFixed(2)}` : '',
    '--------------------------------',
    '🙏 *Thank you for growing green with Bharti\'s Green World!*',
    '🌱 For plant care tips, bulk landscape orders & seasonal saplings, contact us anytime.',
    'Visit Again! 🌸',
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Generates the full https://wa.me/ link with prefilled invoice message.
 */
export function getWhatsAppInvoiceUrl(
  bill: PosBillWithRelations,
  options?: WhatsAppInvoiceOptions
): string {
  const message = formatWhatsAppInvoiceMessage(bill, options);
  const sanitizedPhone = sanitizeWhatsAppPhone(options?.customerPhone || bill.customer?.phone);

  if (sanitizedPhone) {
    return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Launches WhatsApp Click-to-Chat in a new tab.
 */
export function openWhatsAppInvoice(
  bill: PosBillWithRelations,
  options?: WhatsAppInvoiceOptions
): void {
  const url = getWhatsAppInvoiceUrl(bill, options);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

