/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/landscaping/utils/whatsappSiteVisit.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented standardized manual WhatsApp click-to-chat utilities for Landscaping
 *      Site Visits & Maintenance updates (`formatSiteVisitWhatsAppMessage`, `getSiteVisitWhatsAppUrl`, `openSiteVisitWhatsApp`).
 *    - Implemented exact approved messaging template with zero modifications.
 *    - Sanitized customer mobile number according to Indian telecom standard (+91 prefix).
 *    - Configured window.open cross-origin safe dispatch matching the POS invoice receipt flow.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT SITE VISIT & MAINTENANCE WHATSAPP UPDATE".
 *    - Enables site supervisors and cashier staff to dispatch instant routine maintenance
 *      reports directly to client WhatsApp accounts with zero paid API overhead.
 * 
 * 3. WHAT WAS USED:
 *    - Standard URL encoding (`encodeURIComponent`).
 *    - Universal Click-to-Chat `https://wa.me/` protocol.
 * 
 * ----------------------------------------------------------------------------
 */

export interface SiteVisitMessageInput {
  siteName: string;
  customerName: string;
  customerMobile?: string | null;
  visitDate: string | Date;
  areasChecked: string;
  workDone: string;
  siteStatus: string;
  replacementNotes?: string | null;
  nextVisitDate?: string | Date | null;
}

/**
 * Sanitizes and formats phone number for WhatsApp wa.me link (+91 for India).
 * Strictly mirrors the POS billing invoice sanitization logic.
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
 * Helper to format a date into a clean, human-readable Indian date string (e.g., 24 Nov 2026).
 */
export function formatDisplayDate(dateVal?: string | Date | null): string {
  if (!dateVal) return '';
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Builds the exact approved WhatsApp message string for Site Visits & Maintenance:
 *
 * 🌿 *Bharti's Green World Nursery & Landscaping*
 * *Site Visit & Maintenance Update*
 *
 * Hello ${customerName},
 * Our team visited *${siteName}* on *${formattedDate}* for a routine maintenance check.
 *
 * *Checked & Completed:*
 * - ${areasChecked}
 * - ${workDone}
 *
 * *Site Status:* ${siteStatus}
 * *Next Visit:* ${nextVisit || 'As scheduled'}
 *
 * Thank you for trusting Bharti's Green World. Reply here if you need any assistance.
 */
export function formatSiteVisitWhatsAppMessage(visit: SiteVisitMessageInput): string {
  const customerName = visit.customerName.trim() || 'Valued Client';
  const siteName = visit.siteName.trim() || 'Site';
  const formattedDate = formatDisplayDate(visit.visitDate) || 'today';

  const areasChecked = visit.areasChecked.trim() || 'Garden & Lawn Zones';
  const workDone = visit.workDone.trim() || 'Routine maintenance and health check';

  const siteStatus = visit.replacementNotes && visit.replacementNotes.trim()
    ? `${visit.siteStatus.trim()} (${visit.replacementNotes.trim()})`
    : visit.siteStatus.trim() || 'Healthy';

  const nextVisit = formatDisplayDate(visit.nextVisitDate);

  const lines = [
    '🌿 *Bharti\'s Green World Nursery & Landscaping*',
    '*Site Visit & Maintenance Update*',
    '',
    `Hello ${customerName},`,
    `Our team visited *${siteName}* on *${formattedDate}* for a routine maintenance check.`,
    '',
    '*Checked & Completed:*',
    `- ${areasChecked}`,
    `- ${workDone}`,
    '',
    `*Site Status:* ${siteStatus}`,
    `*Next Visit:* ${nextVisit || 'As scheduled'}`,
    '',
    'Thank you for trusting Bharti\'s Green World. Reply here if you need any assistance.',
  ];

  return lines.join('\n');
}

/**
 * Generates the full https://wa.me/ link with prefilled site visit maintenance message.
 */
export function getSiteVisitWhatsAppUrl(visit: SiteVisitMessageInput): string {
  const message = formatSiteVisitWhatsAppMessage(visit);
  const sanitizedPhone = sanitizeWhatsAppPhone(visit.customerMobile);

  if (sanitizedPhone) {
    return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Launches WhatsApp Click-to-Chat in a new tab.
 */
export function openSiteVisitWhatsApp(visit: SiteVisitMessageInput): void {
  const url = getSiteVisitWhatsAppUrl(visit);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

