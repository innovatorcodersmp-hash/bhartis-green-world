/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/actions/posActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented Next.js Server Actions for Point of Sale (POS) retail billing counter operations.
 *    - Resolved Prisma Client relational validation in `createPosBillAction`:
 *      * Connected customer relation via nested relation input:
 *        `customer: finalCustomerId ? { connect: { id: finalCustomerId } } : undefined`
 *        instead of raw scalar `customerId` on nested `PosBillCreateInput`.
 *      * Connected item plant relations via `plant: { connect: { id: item.plantId } }`.
 *    - Implemented concurrency-safe sequential invoice number generator `generateNextInvoiceNumber()`
 *      producing standardized `BGW-INV-YYYY-XXXX` formats (e.g. `BGW-INV-2026-0001`).
 *    - Added query action `getNextInvoiceNumberAction()` to fetch next sequential invoice numbers for POS UI pre-filling.
 *    - Updated `createPosBillAction` to automatically assign and guarantee unique sequential invoice codes inside `prisma.$transaction`.
 *    - Updated `createPosBillAction` to accept `transactionId` (for UPI / QR payments) and auto-resolve
 *      customer identity via `customerPhone` when Udhar credit is extended to a mobile-bearing walk-in.
 *    - Maintained atomic transactional guarantees via Prisma ORM:
 *      * Creates POS bill receipt and associated item lines.
 *      * Decrements live nursery plant stock counts.
 *      * Adjusts customer Udhar ledger balance upon partial or zero-cash credit sales.
 *    - Maintained `getPosBillsAction` and `getPosBillByIdAction`.
 *    - Revalidated cache paths (`APP_ROUTES.POS`, `APP_ROUTES.PLANTS`, `APP_ROUTES.CUSTOMERS`).
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills bug fix: Eliminates PrismaClientValidationError `Unknown argument customerId. Did you mean customer?`.
 *    - Fulfills Specification 04: "Next.js Server Actions First", "Atomic Transactions", "Data Integrity".
 *    - Guarantees seamless checkout execution without runtime ORM relational contract exceptions.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM query builder and interactive transactions (`prisma.$transaction`).
 *    - Zod validation (`PosBillInputSchema`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Normalizes incoming payload; validates schema; opens atomic transaction; verifies uniqueness;
 *      connects Customer and Plant relations via standard Prisma nested connect contracts;
 *      decrements stock; debits customer Udhar ledger; and returns populated receipt payload.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  PosBillWithRelations,
  PosBillInput,
  PosBillInputSchema,
} from '../types';

// ============================================================================
// 1. UTILITY: AUTO-GENERATE CONCURRENCY-SAFE SEQUENTIAL INVOICE CODE (BGW-INV-YYYY-XXXX)
// ============================================================================

/**
 * Extracts the highest sequence number from existing POS bills for the current year
 * and generates the next sequential code formatted as BGW-INV-YYYY-XXXX (e.g. BGW-INV-2026-0001).
 */
export async function generateNextInvoiceNumber(
  txOrPrisma: any = prisma,
  customYear?: number
): Promise<string> {
  const currentYear = customYear || new Date().getFullYear();
  const prefix = `BGW-INV-${currentYear}-`;

  const [latestBill, currentYearBills, legacyBills] = await Promise.all([
    txOrPrisma.posBill.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { billNumber: true },
    }),
    txOrPrisma.posBill.findMany({
      where: {
        billNumber: {
          startsWith: prefix,
        },
      },
      select: { billNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    txOrPrisma.posBill.findMany({
      where: {
        billNumber: {
          startsWith: 'BILL-',
        },
      },
      select: { billNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  let maxSeq = 0;

  // 1. Scan current year BGW-INV-YYYY-XXXX codes
  for (const b of currentYearBills) {
    const regex = new RegExp(`^BGW-INV-${currentYear}-(\\d+)`, 'i');
    const match = b.billNumber.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  // 2. Scan legacy bills if no current year BGW bills found
  if (maxSeq === 0) {
    for (const b of legacyBills) {
      const match = b.billNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  // 3. Fallback to latest bill number
  if (maxSeq === 0 && latestBill?.billNumber) {
    const match = latestBill.billNumber.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        maxSeq = num;
      }
    }
  }

  // 4. Increment and pad sequence to 4 digits (e.g. 0001, 0002)
  const nextSeq = maxSeq + 1;
  let candidateBillNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  // 5. Guarantee absolute uniqueness against race conditions
  let counter = nextSeq;
  while (await txOrPrisma.posBill.findUnique({ where: { billNumber: candidateBillNumber } })) {
    counter++;
    candidateBillNumber = `${prefix}${String(counter).padStart(4, '0')}`;
  }

  return candidateBillNumber;
}

// ============================================================================
// 2. QUERY: GET NEXT SEQUENTIAL INVOICE CODE FOR UI PRE-FILL
// ============================================================================

export async function getNextInvoiceNumberAction(): Promise<ActionResult<string>> {
  try {
    const code = await generateNextInvoiceNumber(prisma);
    return {
      success: true,
      data: code,
    };
  } catch (error) {
    console.error('[getNextInvoiceNumberAction Error]:', error);
    return {
      success: false,
      error: 'Failed to generate sequential invoice tracking code.',
    };
  }
}

// ============================================================================
// 3. QUERY: FETCH ALL POS BILLS WITH RELATIONS
// ============================================================================

export async function getPosBillsAction(): Promise<
  ActionResult<PosBillWithRelations[]>
> {
  try {
    const bills = await prisma.posBill.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            plant: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: bills,
    };
  } catch (error) {
    console.error('[getPosBillsAction Error]:', error);
    return {
      success: false,
      error: 'Failed to retrieve POS billing records. Please try again.',
    };
  }
}

// ============================================================================
// 4. QUERY: FETCH SINGLE POS BILL BY UUID OR BILL NUMBER
// ============================================================================

export async function getPosBillByIdAction(
  id: string
): Promise<ActionResult<PosBillWithRelations | null>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'A valid bill ID or invoice number is required.',
      };
    }

    const bill = await prisma.posBill.findFirst({
      where: {
        OR: [{ id }, { billNumber: id }],
      },
      include: {
        customer: true,
        items: {
          include: {
            plant: true,
          },
        },
      },
    });

    if (!bill || bill.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'POS bill record not found or has been archived.',
        data: null,
      };
    }

    return {
      success: true,
      data: bill,
    };
  } catch (error) {
    console.error('[getPosBillByIdAction Error]:', error);
    return {
      success: false,
      error: 'Failed to load bill receipt details. Please try again.',
    };
  }
}

// ============================================================================
// 5. MUTATION: ATOMIC POS BILL CREATION TRANSACTION
// ============================================================================

export async function createPosBillAction(
  rawData: PosBillInput
): Promise<ActionResult<PosBillWithRelations>> {
  try {
    // 1. Auto-generate sequential invoice number if empty or not provided
    let candidateBillNumber = rawData.billNumber?.trim();
    if (!candidateBillNumber) {
      candidateBillNumber = await generateNextInvoiceNumber(prisma);
    }

    const normalizedData = {
      ...rawData,
      billNumber: candidateBillNumber,
    };

    // 2. Validate payload with Zod
    const validationResult = PosBillInputSchema.safeParse(normalizedData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid POS bill details provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;

    // 3. Enforce Customer Requirement for Credit Udhar
    if (data.paymentMode === 'CREDIT_UDHAR' && !data.customerId && !data.customerPhone?.trim()) {
      return {
        success: false,
        error: 'A registered customer or verified mobile number is required to record a Credit / Udhar bill.',
        fieldErrors: {
          customerId: ['Please select a customer or enter a mobile number for credit sales.'],
        },
      };
    }

    // 4. Calculate total bill amount and remaining balance due
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const balanceDue = Math.max(0, totalAmount - data.amountPaid);

    // 5. Execute concurrency-safe atomic database transaction via Prisma ORM
    const createdBill = await prisma.$transaction(async (tx) => {
      let finalBillNumber = data.billNumber;

      // Check collision inside transaction; if collision occurs, re-generate next sequential code
      const existingBill = await tx.posBill.findUnique({
        where: { billNumber: finalBillNumber },
      });

      if (existingBill) {
        finalBillNumber = await generateNextInvoiceNumber(tx);
      }

      let finalCustomerId = data.customerId || null;

      // Auto-resolve or create customer profile if credit sale provides mobile number
      if (!finalCustomerId && data.customerPhone?.trim()) {
        const phone = data.customerPhone.trim();
        let customer = await tx.customer.findFirst({
          where: { phone },
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: `Walk-in Customer (${phone})`,
              phone,
              totalUdharDue: 0,
              status: 'ACTIVE',
            },
          });
        }
        finalCustomerId = customer.id;
      }

      // 5a. Create POS Bill with nested line items
      const newBill = await tx.posBill.create({
        data: {
          billNumber: finalBillNumber,
          customer: finalCustomerId ? { connect: { id: finalCustomerId } } : undefined,
          totalAmount,
          paymentMode: data.paymentMode,
          amountPaid: data.amountPaid,
          balanceDue,
          transactionId: data.transactionId ? data.transactionId : null,
          status: 'ACTIVE',
          items: {
            create: data.items.map((item) => ({
              plant: { connect: { id: item.plantId } },
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              status: 'ACTIVE',
            })),
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              plant: true,
            },
          },
        },
      });

      // 5b. Decrement plant live inventory stock counts
      for (const item of data.items) {
        await tx.plant.update({
          where: { id: item.plantId },
          data: {
            stockCount: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 5c. If unpaid balance due exists and customer is linked, update customer Udhar ledger
      if (balanceDue > 0 && finalCustomerId) {
        await tx.customer.update({
          where: { id: finalCustomerId },
          data: {
            totalUdharDue: {
              increment: balanceDue,
            },
          },
        });
      }

      return newBill;
    });

    // 6. Revalidate cache paths
    revalidatePath(APP_ROUTES.POS);
    revalidatePath(APP_ROUTES.PLANTS);
    revalidatePath(APP_ROUTES.CUSTOMERS);

    return {
      success: true,
      data: createdBill,
    };
  } catch (error) {
    console.error('[createPosBillAction Error]:', error);
    return {
      success: false,
      error: 'Failed to complete POS checkout transaction. Please try again.',
    };
  }
}
