/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/vendors/actions/vendorActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented Next.js Server Actions for Vendor and Supplier Master management.
 *    - Created `getVendorsAction`, `getVendorByIdAction`, `createVendorAction`, `updateVendorAction`, and `deleteVendorAction`.
 *    - Wrapped every action in mandatory try-catch blocks returning `ActionResult<T>`.
 *    - Validated payloads with `VendorInputSchema` ensuring valid 10-digit mobile numbers and categories.
 *    - Invoked `revalidatePath(APP_ROUTES.VENDORS)` upon successful mutations.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 04: "Next.js Server Actions First", "Zero Raw SQL", "Mandatory Try-Catch".
 *    - Ensures reliable procurement trails for inventory batches (seeds, saplings, plastic pots, vermicompost).
 *    - Protects the database against duplicate telephone collisions.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM query builder (`prisma.vendor.findMany`, `create`, `update`, `findUnique`).
 *    - Zod validation (`VendorInputSchema`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Actions receive form payloads, validate against schema, persist via Prisma, revalidate paths, and return `{ success, data, error }`.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Vendor, VendorInput, VendorInputSchema } from '../types';

// ============================================================================
// 1. QUERY: FETCH ALL ACTIVE & INACTIVE VENDORS
// ============================================================================

export async function getVendorsAction(): Promise<ActionResult<Vendor[]>> {
  try {
    const vendors = await prisma.vendor.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: vendors,
    };
  } catch (error) {
    console.error('[getVendorsAction Error]:', error);
    return {
      success: false,
      error: 'Failed to retrieve vendor records. Please refresh and try again.',
    };
  }
}

// ============================================================================
// 2. QUERY: FETCH SINGLE VENDOR BY UUID
// ============================================================================

export async function getVendorByIdAction(
  id: string
): Promise<ActionResult<Vendor | null>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'A valid vendor ID is required.',
      };
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor || vendor.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'Vendor record not found or has been archived.',
        data: null,
      };
    }

    return {
      success: true,
      data: vendor,
    };
  } catch (error) {
    console.error('[getVendorByIdAction Error]:', error);
    return {
      success: false,
      error: 'Failed to load vendor details. Please try again.',
    };
  }
}

// ============================================================================
// 3. MUTATION: CREATE NEW VENDOR RECORD
// ============================================================================

export async function createVendorAction(
  rawData: VendorInput
): Promise<ActionResult<Vendor>> {
  try {
    // 1. Validate payload with Zod
    const validationResult = VendorInputSchema.safeParse(rawData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid vendor details provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;

    // 2. Check for unique mobile number collision
    const existingVendor = await prisma.vendor.findUnique({
      where: { phone: data.phone },
    });

    if (existingVendor) {
      return {
        success: false,
        error: `Vendor with mobile number '${data.phone}' is already registered as ${existingVendor.name}.`,
        fieldErrors: {
          phone: [`Mobile number '${data.phone}' is already registered.`],
        },
      };
    }

    // 3. Persist record via Prisma ORM
    const newVendor = await prisma.vendor.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone,
        category: data.category,
        status: 'ACTIVE',
      },
    });

    // 4. Revalidate cache
    revalidatePath(APP_ROUTES.VENDORS);

    return {
      success: true,
      data: newVendor,
    };
  } catch (error) {
    console.error('[createVendorAction Error]:', error);
    return {
      success: false,
      error: 'Failed to register vendor due to a server error. Please try again.',
    };
  }
}

// ============================================================================
// 4. MUTATION: UPDATE EXISTING VENDOR RECORD
// ============================================================================

export async function updateVendorAction(
  id: string,
  rawData: VendorInput
): Promise<ActionResult<Vendor>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid vendor ID for update.',
      };
    }

    // 1. Validate payload with Zod
    const validationResult = VendorInputSchema.safeParse(rawData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid vendor details provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;

    // 2. Verify existence
    const existing = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!existing || existing.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'Vendor record does not exist or has been removed.',
      };
    }

    // 3. Check for mobile collision if changed
    if (data.phone !== existing.phone) {
      const duplicatePhone = await prisma.vendor.findUnique({
        where: { phone: data.phone },
      });

      if (duplicatePhone && duplicatePhone.id !== id) {
        return {
          success: false,
          error: `Mobile number '${data.phone}' is already registered under ${duplicatePhone.name}.`,
          fieldErrors: {
            phone: [`Mobile number '${data.phone}' belongs to another vendor.`],
          },
        };
      }
    }

    // 4. Persist update via Prisma ORM
    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone,
        category: data.category,
      },
    });

    // 5. Revalidate cache paths
    revalidatePath(APP_ROUTES.VENDORS);
    revalidatePath(APP_ROUTES.VENDORS_EDIT(id));

    return {
      success: true,
      data: updatedVendor,
    };
  } catch (error) {
    console.error('[updateVendorAction Error]:', error);
    return {
      success: false,
      error: 'Failed to update vendor details. Please try again.',
    };
  }
}

// ============================================================================
// 5. MUTATION: SOFT-DELETE (ARCHIVE) VENDOR RECORD
// ============================================================================

export async function deleteVendorAction(id: string): Promise<ActionResult<boolean>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'A valid vendor ID is required for archiving.',
      };
    }

    // Soft-delete to preserve inventory batch purchase provenance
    await prisma.vendor.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });

    revalidatePath(APP_ROUTES.VENDORS);

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('[deleteVendorAction Error]:', error);
    return {
      success: false,
      error: 'Failed to archive vendor record. Please try again.',
    };
  }
}
