/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/customers/actions/customerActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented Next.js Server Actions for Customer directory management and Udhar (credit) ledger operations.
 *    - Created `getCustomersAction`, `getCustomerByIdAction`, `createCustomerAction`, `updateCustomerAction`, and `deleteCustomerAction`.
 *    - Enforced mandatory try-catch blocks returning `ActionResult<T>` with field-specific error maps.
 *    - Validated payloads with `CustomerInputSchema` (strict 10-digit phone number check).
 *    - Invoked `revalidatePath(APP_ROUTES.CUSTOMERS)` upon state mutations.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 04: "Next.js Server Actions First", "Mandatory Try-Catch", "Zero Raw SQL".
 *    - Guarantees referential integrity between customer ledgers and billing records.
 *    - Prevents duplicate phone entries for retail buyers and landscaping clients in Kolhapur.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM query builder (`prisma.customer.findMany`, `create`, `update`, `findUnique`).
 *    - Zod validation (`CustomerInputSchema`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Actions validate input, perform Prisma ORM queries, revalidate cached views, and return `{ success, data, error }`.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Customer, CustomerInput, CustomerInputSchema } from '../types';

// ============================================================================
// 1. QUERY: FETCH ALL ACTIVE & INACTIVE CUSTOMERS
// ============================================================================

export async function getCustomersAction(): Promise<ActionResult<Customer[]>> {
  try {
    const customers = await prisma.customer.findMany({
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
      data: customers,
    };
  } catch (error) {
    console.error('[getCustomersAction Error]:', error);
    return {
      success: false,
      error: 'Failed to retrieve customer ledger records. Please refresh and try again.',
    };
  }
}

// ============================================================================
// 2. QUERY: FETCH SINGLE CUSTOMER BY UUID
// ============================================================================

export async function getCustomerByIdAction(
  id: string
): Promise<ActionResult<Customer | null>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'A valid customer ID is required.',
      };
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer || customer.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'Customer record not found or has been archived.',
        data: null,
      };
    }

    return {
      success: true,
      data: customer,
    };
  } catch (error) {
    console.error('[getCustomerByIdAction Error]:', error);
    return {
      success: false,
      error: 'Failed to load customer details. Please try again.',
    };
  }
}

// ============================================================================
// 3. MUTATION: CREATE NEW CUSTOMER RECORD
// ============================================================================

export async function createCustomerAction(
  rawData: CustomerInput
): Promise<ActionResult<Customer>> {
  try {
    // 1. Validate payload with Zod
    const validationResult = CustomerInputSchema.safeParse(rawData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid customer details provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;

    // 2. Check for unique mobile number collision
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: data.phone },
    });

    if (existingCustomer) {
      return {
        success: false,
        error: `Customer with mobile number '${data.phone}' is already registered as ${existingCustomer.name}.`,
        fieldErrors: {
          phone: [`Mobile number '${data.phone}' is already registered.`],
        },
      };
    }

    // 3. Persist record via Prisma ORM
    const newCustomer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address || null,
        totalUdharDue: data.totalUdharDue ?? 0.0,
        status: 'ACTIVE',
      },
    });

    // 4. Revalidate cache
    revalidatePath(APP_ROUTES.CUSTOMERS);

    return {
      success: true,
      data: newCustomer,
    };
  } catch (error) {
    console.error('[createCustomerAction Error]:', error);
    return {
      success: false,
      error: 'Failed to register customer due to a server error. Please try again.',
    };
  }
}

// ============================================================================
// 4. MUTATION: UPDATE EXISTING CUSTOMER RECORD
// ============================================================================

export async function updateCustomerAction(
  id: string,
  rawData: CustomerInput
): Promise<ActionResult<Customer>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid customer ID for update.',
      };
    }

    // 1. Validate payload with Zod
    const validationResult = CustomerInputSchema.safeParse(rawData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid customer details provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;

    // 2. Verify existence
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing || existing.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'Customer record does not exist or has been removed.',
      };
    }

    // 3. Check for mobile collision if changed
    if (data.phone !== existing.phone) {
      const duplicatePhone = await prisma.customer.findUnique({
        where: { phone: data.phone },
      });

      if (duplicatePhone && duplicatePhone.id !== id) {
        return {
          success: false,
          error: `Mobile number '${data.phone}' is already registered under ${duplicatePhone.name}.`,
          fieldErrors: {
            phone: [`Mobile number '${data.phone}' belongs to another customer.`],
          },
        };
      }
    }

    // 4. Persist update via Prisma ORM
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address || null,
        totalUdharDue: data.totalUdharDue ?? 0.0,
      },
    });

    // 5. Revalidate cache paths
    revalidatePath(APP_ROUTES.CUSTOMERS);
    revalidatePath(APP_ROUTES.CUSTOMERS_EDIT(id));

    return {
      success: true,
      data: updatedCustomer,
    };
  } catch (error) {
    console.error('[updateCustomerAction Error]:', error);
    return {
      success: false,
      error: 'Failed to update customer details. Please try again.',
    };
  }
}

// ============================================================================
// 5. MUTATION: SOFT-DELETE (ARCHIVE) CUSTOMER RECORD
// ============================================================================

export async function deleteCustomerAction(id: string): Promise<ActionResult<boolean>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'A valid customer ID is required for archiving.',
      };
    }

    // Check if customer has outstanding Udhar before archiving
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (existing && existing.totalUdharDue > 0) {
      return {
        success: false,
        error: `Cannot archive customer with active outstanding Udhar of ₹${existing.totalUdharDue.toFixed(2)}. Settle balance first.`,
      };
    }

    // Soft-delete to preserve billing & contract history
    await prisma.customer.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });

    revalidatePath(APP_ROUTES.CUSTOMERS);

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('[deleteCustomerAction Error]:', error);
    return {
      success: false,
      error: 'Failed to archive customer record. Please try again.',
    };
  }
}
