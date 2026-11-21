/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/inventory/actions/inventoryActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented Next.js Server Actions for Sapling Inventory Batches and nursery stock ledger management.
 *    - Added support for `unitCostPrice` across batch creation and updating.
 *    - Built concurrency-safe sequential batch code generator `generateNextBatchCode()` producing `BGW-BAT-YYYY-XXXX` formats.
 *    - Added query action `getNextBatchCodeAction()` to serve next sequential batch identifiers to client forms.
 *    - Updated `createInventoryBatchAction` to automatically assign and guarantee unique sequential batch codes via `prisma.$transaction`.
 *    - Maintained `getInventoryBatchesAction`, `getInventoryBatchByIdAction`, `updateInventoryBatchAction`, and `deleteInventoryBatchAction`.
 *    - Eagerly joined relational models (`plant` and `vendor`) via standard Prisma query builders.
 *    - Wrapped every operation in mandatory try-catch blocks returning standard `ActionResult<T>`.
 *    - Validated payloads with `InventoryBatchInputSchema` and invoked `revalidatePath(APP_ROUTES.INVENTORY)`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: ADD UNIT PURCHASE COST AND AUTO-CALCULATE BATCH TOTALS IN INVENTORY FORM".
 *    - Fulfills Specification 04: "Next.js Server Actions First", "Zero Raw SQL", "Concurrency-Safe Transactions".
 *    - Provides precise financial accounting of total consignment expenditure and mortality write-downs.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM query builder and interactive transactions (`prisma.$transaction`).
 *    - Zod validation (`InventoryBatchInputSchema`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Queries database for current year's highest batch sequence; increments by 1;
 *      verifies absence of collision inside an atomic transaction; persists `unitCostPrice` and quantities;
 *      revalidates cache; and returns structured result.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  InventoryBatchWithRelations,
  InventoryBatchInput,
  InventoryBatchInputSchema,
  BatchConsignmentInput,
  BatchConsignmentInputSchema,
  BatchPlantItemInput,
} from '../types';

// ============================================================================
// 1. UTILITY: AUTO-GENERATE CONCURRENCY-SAFE SEQUENTIAL BATCH CODE (BGW-BAT-YYYY-XXXX)
// ============================================================================

/**
 * Synchronizes the parent Plant stockCount from the sum of currentQty across all active batches.
 */
export async function syncPlantStockCount(txOrPrisma: any, plantId: string): Promise<number> {
  const aggregate = await txOrPrisma.inventoryBatch.aggregate({
    where: {
      plantId,
      status: {
        not: 'ARCHIVED',
      },
    },
    _sum: {
      currentQty: true,
    },
  });

  const totalStock = aggregate._sum.currentQty ?? 0;

  await txOrPrisma.plant.update({
    where: { id: plantId },
    data: {
      stockCount: totalStock,
    },
  });

  return totalStock;
}

/**
 * Extracts the highest sequence number from existing batches for the current year
 * and generates the next sequential code formatted as BGW-BAT-YYYY-XXXX (e.g. BGW-BAT-2026-0001).
 */
export async function generateNextBatchCode(
  txOrPrisma: any = prisma,
  customYear?: number
): Promise<string> {
  const currentYear = customYear || new Date().getFullYear();
  const prefix = `BGW-BAT-${currentYear}-`;

  const [latestBatch, currentYearBatches, legacyBatches] = await Promise.all([
    txOrPrisma.inventoryBatch.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { batchNumber: true },
    }),
    txOrPrisma.inventoryBatch.findMany({
      where: {
        batchNumber: {
          startsWith: prefix,
        },
      },
      select: { batchNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    txOrPrisma.inventoryBatch.findMany({
      where: {
        batchNumber: {
          startsWith: 'BATCH-',
        },
      },
      select: { batchNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  let maxSeq = 0;

  // 1. Scan current year BGW-BAT-YYYY-XXXX codes
  for (const b of currentYearBatches) {
    const regex = new RegExp(`^BGW-BAT-${currentYear}-(\\d+)`, 'i');
    const match = b.batchNumber.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  // 2. Scan legacy batches if no current year BGW batches found
  if (maxSeq === 0) {
    for (const b of legacyBatches) {
      const match = b.batchNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  // 3. Fallback to latest batch number
  if (maxSeq === 0 && latestBatch?.batchNumber) {
    const match = latestBatch.batchNumber.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        maxSeq = num;
      }
    }
  }

  // 4. Increment and pad sequence to 4 digits (e.g. 0001, 0002)
  const nextSeq = maxSeq + 1;
  let candidateBatchNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  // 5. Guarantee absolute uniqueness against race conditions
  let counter = nextSeq;
  while (await txOrPrisma.inventoryBatch.findFirst({ where: { batchNumber: candidateBatchNumber } })) {
    counter++;
    candidateBatchNumber = `${prefix}${String(counter).padStart(4, '0')}`;
  }

  return candidateBatchNumber;
}

// ============================================================================
// 2. QUERY: GET NEXT SEQUENTIAL BATCH CODE FOR UI PRE-FILL
// ============================================================================

export async function getNextBatchCodeAction(): Promise<ActionResult<string>> {
  try {
    const code = await generateNextBatchCode(prisma);
    return {
      success: true,
      data: code,
    };
  } catch (error) {
    console.error('[getNextBatchCodeAction Error]:', error);
    return {
      success: false,
      error: 'Failed to generate sequential batch tracking code.',
    };
  }
}

// ============================================================================
// 2B. QUERY: FETCH EXISTING ACTIVE BATCH CODES FOR RE-USE / APPENDING
// ============================================================================

export async function getExistingBatchCodesAction(): Promise<ActionResult<string[]>> {
  try {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      select: {
        batchNumber: true,
      },
      distinct: ['batchNumber'],
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    return {
      success: true,
      data: batches.map((b) => b.batchNumber),
    };
  } catch (error) {
    console.error('[getExistingBatchCodesAction Error]:', error);
    return {
      success: false,
      error: 'Failed to retrieve existing batch codes.',
      data: [],
    };
  }
}

// ============================================================================
// 3. QUERY: FETCH ALL ACTIVE INVENTORY BATCHES WITH RELATIONS
// ============================================================================

export async function getInventoryBatchesAction(): Promise<
  ActionResult<InventoryBatchWithRelations[]>
> {
  try {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      include: {
        plant: true,
        vendor: true,
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    return {
      success: true,
      data: batches,
    };
  } catch (error) {
    console.error('[getInventoryBatchesAction Error]:', error);
    return {
      success: false,
      error: 'Failed to retrieve sapling batches. Please refresh and try again.',
    };
  }
}

// ============================================================================
// 4. QUERY: FETCH SINGLE INVENTORY BATCH BY UUID
// ============================================================================

export async function getInventoryBatchByIdAction(
  id: string
): Promise<ActionResult<InventoryBatchWithRelations | null>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'A valid batch ID is required.',
      };
    }

    const batch = await prisma.inventoryBatch.findUnique({
      where: { id },
      include: {
        plant: true,
        vendor: true,
      },
    });

    if (!batch || batch.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'Inventory batch record not found or has been archived.',
        data: null,
      };
    }

    return {
      success: true,
      data: batch,
    };
  } catch (error) {
    console.error('[getInventoryBatchByIdAction Error]:', error);
    return {
      success: false,
      error: 'Failed to load batch details. Please try again.',
    };
  }
}

// ============================================================================
// 5. MUTATION: CREATE NEW MULTI-PLANT INVENTORY BATCH CONSIGNMENT
// ============================================================================

export async function createBatchConsignmentAction(
  rawData: BatchConsignmentInput
): Promise<ActionResult<InventoryBatchWithRelations[]>> {
  try {
    let candidateBatchCode = rawData.batchNumber?.trim();
    if (!candidateBatchCode) {
      candidateBatchCode = await generateNextBatchCode(prisma);
    }

    const normalizedData = {
      ...rawData,
      batchNumber: candidateBatchCode,
    };

    const validationResult = BatchConsignmentInputSchema.safeParse(normalizedData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid consignment batch details provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;
    const finalBatchNumber = data.batchNumber;
    const purchaseDate = new Date(data.purchaseDate);
    const vendorId = data.vendorId ? data.vendorId : null;

    const createdBatches = await prisma.$transaction(async (tx) => {
      const results: InventoryBatchWithRelations[] = [];
      const affectedPlantIds = new Set<string>();

      for (const item of data.items) {
        const batch = await tx.inventoryBatch.create({
          data: {
            batchNumber: finalBatchNumber,
            plantId: item.plantId,
            vendorId,
            initialQty: item.initialQty,
            currentQty: item.currentQty,
            mortalityQty: item.mortalityQty ?? 0,
            unitCostPrice: item.unitCostPrice !== undefined ? item.unitCostPrice : null,
            purchaseDate,
            status: 'ACTIVE',
          },
          include: {
            plant: true,
            vendor: true,
          },
        });

        results.push(batch);
        affectedPlantIds.add(item.plantId);
      }

      // Recalculate stock for all affected plants inside the same atomic transaction
      for (const plantId of affectedPlantIds) {
        await syncPlantStockCount(tx, plantId);
      }

      return results;
    });

    revalidatePath(APP_ROUTES.INVENTORY);
    revalidatePath(APP_ROUTES.PLANTS);
    revalidatePath(APP_ROUTES.DASHBOARD);
    revalidatePath('/dashboard');
    revalidatePath('/plants');

    return {
      success: true,
      data: createdBatches,
    };
  } catch (error: any) {
    console.error('[createBatchConsignmentAction Error]:', error);
    return {
      success: false,
      error: error?.message || 'Failed to register consignment batch due to a server error.',
    };
  }
}

// ============================================================================
// 5B. MUTATION: CREATE SINGLE INVENTORY BATCH OR DELEGATE TO CONSIGNMENT
// ============================================================================

export async function createInventoryBatchAction(
  rawData: InventoryBatchInput | BatchConsignmentInput | any
): Promise<ActionResult<InventoryBatchWithRelations>> {
  try {
    // If incoming data contains an items array, delegate to multi-plant consignment action
    if (rawData && Array.isArray(rawData.items)) {
      const consignmentResult = await createBatchConsignmentAction(rawData as BatchConsignmentInput);
      if (!consignmentResult.success || !consignmentResult.data || consignmentResult.data.length === 0) {
        return {
          success: false,
          error: consignmentResult.error || 'Failed to create consignment batch.',
          fieldErrors: consignmentResult.fieldErrors,
        };
      }

      return {
        success: true,
        data: consignmentResult.data[0],
      };
    }

    // Single batch record creation
    let candidateBatchCode = rawData.batchNumber?.trim();
    if (!candidateBatchCode) {
      candidateBatchCode = await generateNextBatchCode(prisma);
    }

    const normalizedData = {
      ...rawData,
      batchNumber: candidateBatchCode,
    };

    const validationResult = InventoryBatchInputSchema.safeParse(normalizedData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid inventory batch details provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;

    const newBatch = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryBatch.create({
        data: {
          batchNumber: data.batchNumber,
          plantId: data.plantId,
          vendorId: data.vendorId ? data.vendorId : null,
          initialQty: data.initialQty,
          currentQty: data.currentQty,
          mortalityQty: data.mortalityQty,
          unitCostPrice: data.unitCostPrice !== undefined ? data.unitCostPrice : null,
          purchaseDate: new Date(data.purchaseDate),
          status: 'ACTIVE',
        },
        include: {
          plant: true,
          vendor: true,
        },
      });

      await syncPlantStockCount(tx, data.plantId);
      return created;
    });

    revalidatePath(APP_ROUTES.INVENTORY);
    revalidatePath(APP_ROUTES.PLANTS);
    revalidatePath(APP_ROUTES.DASHBOARD);
    revalidatePath('/dashboard');
    revalidatePath('/plants');

    return {
      success: true,
      data: newBatch,
    };
  } catch (error) {
    console.error('[createInventoryBatchAction Error]:', error);
    return {
      success: false,
      error: 'Failed to register inventory batch due to a server error. Please try again.',
    };
  }
}

// ============================================================================
// 6. MUTATION: UPDATE EXISTING INVENTORY BATCH RECORD
// ============================================================================

export async function updateInventoryBatchAction(
  id: string,
  rawData: InventoryBatchInput
): Promise<ActionResult<InventoryBatchWithRelations>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid batch ID for update.',
      };
    }

    // 1. Validate payload with Zod
    const validationResult = InventoryBatchInputSchema.safeParse(rawData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid inventory batch details provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;

    // 2. Wrap update and stock recalculation in atomic transaction
    const updatedBatch = await prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryBatch.findUnique({
        where: { id },
      });

      if (!existing || existing.status === 'ARCHIVED') {
        throw new Error('Inventory batch record does not exist or has been removed.');
      }

      const updated = await tx.inventoryBatch.update({
        where: { id },
        data: {
          batchNumber: data.batchNumber,
          plantId: data.plantId,
          vendorId: data.vendorId ? data.vendorId : null,
          initialQty: data.initialQty,
          currentQty: data.currentQty,
          mortalityQty: data.mortalityQty,
          unitCostPrice: data.unitCostPrice !== undefined ? data.unitCostPrice : null,
          purchaseDate: new Date(data.purchaseDate),
        },
        include: {
          plant: true,
          vendor: true,
        },
      });

      // Recalculate parent Plant stock directly from sum of currentQty across active batches
      await syncPlantStockCount(tx, data.plantId);

      // If plant association changed, recalculate previous plant's stock as well
      if (existing.plantId !== data.plantId) {
        await syncPlantStockCount(tx, existing.plantId);
      }

      return updated;
    });

    // 3. Revalidate cache paths
    revalidatePath(APP_ROUTES.INVENTORY);
    revalidatePath(APP_ROUTES.INVENTORY_EDIT(id));
    revalidatePath(APP_ROUTES.PLANTS);
    revalidatePath(APP_ROUTES.DASHBOARD);
    revalidatePath('/dashboard');
    revalidatePath('/plants');

    return {
      success: true,
      data: updatedBatch,
    };
  } catch (error: any) {
    console.error('[updateInventoryBatchAction Error]:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update inventory batch details. Please try again.',
    };
  }
}

// ============================================================================
// 7. MUTATION: SOFT-DELETE (ARCHIVE) INVENTORY BATCH RECORD
// ============================================================================

export async function deleteInventoryBatchAction(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'A valid batch ID is required for archiving.',
      };
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryBatch.findUnique({
        where: { id },
        select: { plantId: true },
      });

      await tx.inventoryBatch.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
        },
      });

      if (existing?.plantId) {
        await syncPlantStockCount(tx, existing.plantId);
      }
    });

    revalidatePath(APP_ROUTES.INVENTORY);
    revalidatePath(APP_ROUTES.PLANTS);
    revalidatePath(APP_ROUTES.DASHBOARD);
    revalidatePath('/dashboard');
    revalidatePath('/plants');

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('[deleteInventoryBatchAction Error]:', error);
    return {
      success: false,
      error: 'Failed to archive inventory batch record. Please try again.',
    };
  }
}
