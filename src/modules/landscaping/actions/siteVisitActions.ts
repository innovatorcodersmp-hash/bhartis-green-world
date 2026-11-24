/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/landscaping/actions/siteVisitActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented Next.js Server Actions for routine Landscaping Site Visits & Maintenance Logs.
 *    - Provided CRUD operations (`getSiteVisitsAction`, `createSiteVisitAction`, `deleteSiteVisitAction`).
 *    - Built lookup action `getContractsForSiteVisitAction` to seamlessly prefill site names,
 *      client names, and client phone numbers from registered landscaping project contracts.
 *    - Validated all payloads against Zod schema (`SiteVisitInputSchema`) with strict 10-digit phone checking.
 *    - Revalidated cache paths (`APP_ROUTES.CONTRACTS_SITE_VISITS`, `APP_ROUTES.CONTRACTS`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: IMPLEMENT SITE VISIT & MAINTENANCE WHATSAPP UPDATE".
 *    - Guarantees server-side data integrity and relational mapping to active contracts.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM query builder.
 *    - Zod schema validator (`SiteVisitInputSchema`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  SiteVisitWithRelations,
  SiteVisitInput,
  SiteVisitInputSchema,
} from '../types';

/**
 * Fetches all active routine landscaping site visits ordered by visit date descending.
 */
export async function getSiteVisitsAction(): Promise<ActionResult<SiteVisitWithRelations[]>> {
  try {
    const visits = await prisma.siteVisit.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        contract: true,
      },
      orderBy: {
        visitDate: 'desc',
      },
    });

    return {
      success: true,
      data: visits,
    };
  } catch (error: unknown) {
    console.error('Failed to fetch site visits:', error);
    return {
      success: false,
      error: 'Unable to retrieve site visit logs. Please check your network connection.',
    };
  }
}

/**
 * Fetches active garden contracts with joined customer metadata to enable 1-click
 * auto-fill of site address, client name, and customer phone inside the visit form.
 */
export async function getContractsForSiteVisitAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      contractNo: string;
      siteAddress: string;
      projectType: string;
      customer: {
        name: string;
        phone: string;
      };
    }>
  >
> {
  try {
    const contracts = await prisma.gardenContract.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: contracts.map((c) => ({
        id: c.id,
        contractNo: c.contractNo,
        siteAddress: c.siteAddress,
        projectType: c.projectType,
        customer: {
          name: c.customer.name,
          phone: c.customer.phone,
        },
      })),
    };
  } catch (error: unknown) {
    console.error('Failed to fetch contracts for site visit lookup:', error);
    return {
      success: false,
      error: 'Unable to retrieve landscaping contracts for project lookup.',
    };
  }
}

/**
 * Creates and persists a new routine site visit log with strict Zod validation.
 */
export async function createSiteVisitAction(
  rawInput: SiteVisitInput
): Promise<ActionResult<SiteVisitWithRelations>> {
  try {
    const parsed = SiteVisitInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Please correct the highlighted form errors before saving.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const {
      contractId,
      siteName,
      customerName,
      customerMobile,
      visitDate,
      areasChecked,
      workDone,
      siteStatus,
      replacementCount,
      replacementNotes,
      nextVisitDate,
      supervisorNotes,
    } = parsed.data;

    // Parse dates safely
    const parsedVisitDate = new Date(visitDate);
    const parsedNextVisitDate = nextVisitDate && nextVisitDate.trim()
      ? new Date(nextVisitDate.trim())
      : null;

    const newVisit = await prisma.siteVisit.create({
      data: {
        contract: contractId ? { connect: { id: contractId } } : undefined,
        siteName,
        customerName,
        customerMobile,
        visitDate: isNaN(parsedVisitDate.getTime()) ? new Date() : parsedVisitDate,
        areasChecked,
        workDone,
        siteStatus,
        replacementCount: replacementCount || 0,
        replacementNotes: replacementNotes || null,
        nextVisitDate: parsedNextVisitDate && !isNaN(parsedNextVisitDate.getTime()) ? parsedNextVisitDate : null,
        supervisorNotes: supervisorNotes || null,
      },
      include: {
        contract: true,
      },
    });

    revalidatePath(APP_ROUTES.CONTRACTS_SITE_VISITS);
    revalidatePath(APP_ROUTES.CONTRACTS);

    return {
      success: true,
      data: newVisit,
    };
  } catch (error: unknown) {
    console.error('Failed to create site visit log:', error);
    return {
      success: false,
      error: 'An unexpected database error occurred while saving the site visit.',
    };
  }
}

/**
 * Soft-deletes a site visit log (sets status to ARCHIVED).
 */
export async function deleteSiteVisitAction(id: string): Promise<ActionResult<boolean>> {
  try {
    await prisma.siteVisit.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    revalidatePath(APP_ROUTES.CONTRACTS_SITE_VISITS);
    revalidatePath(APP_ROUTES.CONTRACTS);

    return {
      success: true,
      data: true,
    };
  } catch (error: unknown) {
    console.error('Failed to archive site visit log:', error);
    return {
      success: false,
      error: 'Unable to archive site visit log.',
    };
  }
}

