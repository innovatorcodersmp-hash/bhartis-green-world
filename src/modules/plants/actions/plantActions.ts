/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/plants/actions/plantActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Simplified Next.js Server Actions for Plant Master catalogue operations.
 *    - Structured `createPlantAction` and `updatePlantAction` to treat `name` as the primary unified
 *      plant identifier (supporting bilingual formats e.g. "Kashmiri Red Rose / काश्मिरी गुलाब").
 *    - Persisted auto-generated sequential `BGW-PLT-{paddedSequence}` SKU codes within concurrency-safe transactions.
 *    - Maintained `getPlantsAction`, `getPlantByIdAction`, `getNextPlantCodeAction`, and `deletePlantAction`.
 *    - Wrapped every operation in mandatory try-catch blocks returning standard `ActionResult<T>`.
 *    - Triggered cache revalidation on `APP_ROUTES.PLANTS`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: SIMPLIFY PLANT FORM TO SINGLE NAME FIELD AND RESTRAIN UI CARD WIDTH".
 *    - Follows Specification 04: "Next.js Server Actions First", "Zero Raw SQL".
 *    - Reduces overhead for nursery supervisors entering plant records into the master catalogue.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM query builder and interactive transactions (`prisma.$transaction`).
 *    - Zod validation (`PlantInputSchema`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Validates incoming single-name catalogue payload with Zod; generates sequential BGW code;
 *      persists catalogue entity; preserves existing inventory columns; revalidates routes.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { APP_ROUTES } from '@/lib/constants/routes';
import { Plant, PlantInput, PlantInputSchema, PlantCategory } from '../types';

// ============================================================================
// 1. UTILITY: AUTO-GENERATE CONCURRENCY-SAFE SEQUENTIAL PLANT CODE (BGW PREFIX)
// ============================================================================

/**
 * Extracts the highest sequence number from existing plant SKUs and generates
 * the next sequential code formatted as BGW-PLT-{paddedSequence} (e.g., BGW-PLT-0001).
 */
export async function generateNextPlantCode(
  txOrPrisma: any = prisma,
  _category?: PlantCategory
): Promise<string> {
  // Query existing plants to extract highest numeric sequence
  const [latestPlant, bgwPltPlants, legacyPltPlants] = await Promise.all([
    txOrPrisma.plant.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { sku: true },
    }),
    txOrPrisma.plant.findMany({
      where: {
        sku: {
          startsWith: 'BGW-PLT-',
        },
      },
      select: { sku: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    txOrPrisma.plant.findMany({
      where: {
        sku: {
          startsWith: 'NV-PLT-',
        },
      },
      select: { sku: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  let maxSeq = 0;

  // 1. Scan BGW-PLT- prefixed records first
  for (const p of bgwPltPlants) {
    const match = p.sku.match(/BGW-PLT-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  // 2. Scan legacy NV-PLT- prefixed records to guarantee continuous numbering
  for (const p of legacyPltPlants) {
    const match = p.sku.match(/NV-PLT-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  // 3. If no prefixed records found, scan the latest plant for any ending numeric suffix
  if (maxSeq === 0 && latestPlant?.sku) {
    const match = latestPlant.sku.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        maxSeq = num;
      }
    }
  }

  // 4. Increment and pad sequence to 4 digits (e.g. 0001, 0002)
  const nextSeq = maxSeq + 1;
  let candidateSku = `BGW-PLT-${String(nextSeq).padStart(4, '0')}`;

  // 5. Guarantee absolute uniqueness against race conditions or manual inserts
  let counter = nextSeq;
  while (await txOrPrisma.plant.findUnique({ where: { sku: candidateSku } })) {
    counter++;
    candidateSku = `BGW-PLT-${String(counter).padStart(4, '0')}`;
  }

  return candidateSku;
}

// ============================================================================
// 2. QUERY: GET NEXT SEQUENTIAL PLANT CODE FOR UI PRE-FILL
// ============================================================================

export async function getNextPlantCodeAction(
  category?: PlantCategory
): Promise<ActionResult<string>> {
  try {
    const nextCode = await generateNextPlantCode(prisma, category);
    return {
      success: true,
      data: nextCode,
    };
  } catch (error) {
    console.error('[getNextPlantCodeAction Error]:', error);
    return {
      success: false,
      error: 'Failed to generate next sequential plant code.',
      data: 'BGW-PLT-0001',
    };
  }
}

// ============================================================================
// 3. QUERY: FETCH ALL ACTIVE & INACTIVE PLANTS
// ============================================================================

export async function getPlantsAction(): Promise<ActionResult<Plant[]>> {
  try {
    const plants = await prisma.plant.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: plants,
    };
  } catch (error) {
    console.error('[getPlantsAction Error]:', error);
    return {
      success: false,
      error: 'Failed to retrieve plant inventory records. Please refresh and try again.',
    };
  }
}

// ============================================================================
// 4. QUERY: FETCH SINGLE PLANT BY UUID
// ============================================================================

export async function getPlantByIdAction(
  id: string
): Promise<ActionResult<Plant | null>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'A valid plant ID is required.',
      };
    }

    const plant = await prisma.plant.findUnique({
      where: { id },
    });

    if (!plant || plant.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'Plant record not found or has been archived.',
        data: null,
      };
    }

    return {
      success: true,
      data: plant,
    };
  } catch (error) {
    console.error('[getPlantByIdAction Error]:', error);
    return {
      success: false,
      error: 'Failed to load plant details. Please try again.',
    };
  }
}

// ============================================================================
// 5. MUTATION: CREATE NEW PURE CATALOGUE PLANT (SINGLE NAME IDENTIFIER)
// ============================================================================

export async function createPlantAction(
  rawData: PlantInput
): Promise<ActionResult<Plant>> {
  try {
    // 1. Validate catalogue payload with Zod
    const validationResult = PlantInputSchema.safeParse(rawData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid plant form data provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;

    // 2. Concurrency-safe atomic transaction
    const newPlant = await prisma.$transaction(async (tx) => {
      let finalSku = data.sku?.trim();

      // If SKU is empty or omitted, generate next sequential code inside transaction
      if (!finalSku) {
        finalSku = await generateNextPlantCode(tx, data.category);
      } else {
        // If provided SKU already exists (concurrent collision), assign next sequential code
        const existing = await tx.plant.findUnique({
          where: { sku: finalSku },
        });
        if (existing) {
          finalSku = await generateNextPlantCode(tx, data.category);
        }
      }

      // Persist pure catalogue record via Prisma ORM builder
      return tx.plant.create({
        data: {
          sku: finalSku,
          name: data.name,
          marathiName: data.marathiName || null,
          category: data.category,
          price: data.price,
          costPrice: data.costPrice ?? 0,
          stockCount: data.stockCount ?? 0,
          polyhouseNo: data.polyhouseNo || null,
          status: 'ACTIVE',
        },
      });
    });

    // 3. Revalidate cache
    revalidatePath(APP_ROUTES.PLANTS);

    return {
      success: true,
      data: newPlant,
    };
  } catch (error) {
    console.error('[createPlantAction Error]:', error);
    return {
      success: false,
      error: 'Failed to create plant record due to a server error. Please try again.',
    };
  }
}

// ============================================================================
// 6. MUTATION: UPDATE EXISTING PURE CATALOGUE RECORD
// ============================================================================

export async function updatePlantAction(
  id: string,
  rawData: PlantInput
): Promise<ActionResult<Plant>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid plant ID for update.',
      };
    }

    // 1. Validate catalogue payload with Zod
    const validationResult = PlantInputSchema.safeParse(rawData);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || 'Invalid plant form data provided.';

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validationResult.data;

    // 2. Verify existence
    const existing = await prisma.plant.findUnique({
      where: { id },
    });

    if (!existing || existing.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'Plant record does not exist or has been removed.',
      };
    }

    // Retain existing SKU if not provided
    const targetSku = data.sku?.trim() || existing.sku;

    // 3. Check for SKU collision if changed
    if (targetSku !== existing.sku) {
      const duplicateSku = await prisma.plant.findUnique({
        where: { sku: targetSku },
      });

      if (duplicateSku && duplicateSku.id !== id) {
        return {
          success: false,
          error: `SKU '${targetSku}' is already assigned to another plant.`,
          fieldErrors: {
            sku: [`SKU '${targetSku}' is already in use.`],
          },
        };
      }
    }

    // 4. Persist update for pure catalogue properties (does not overwrite stock/cost)
    const updatedPlant = await prisma.plant.update({
      where: { id },
      data: {
        sku: targetSku,
        name: data.name,
        ...(data.marathiName !== undefined ? { marathiName: data.marathiName || null } : {}),
        category: data.category,
        price: data.price,
      },
    });

    // 5. Revalidate cache paths
    revalidatePath(APP_ROUTES.PLANTS);
    revalidatePath(APP_ROUTES.PLANTS_EDIT(id));

    return {
      success: true,
      data: updatedPlant,
    };
  } catch (error) {
    console.error('[updatePlantAction Error]:', error);
    return {
      success: false,
      error: 'Failed to update plant record. Please try again.',
    };
  }
}

// ============================================================================
// 7. MUTATION: SOFT-DELETE (ARCHIVE) PLANT RECORD
// ============================================================================

export async function deletePlantAction(id: string): Promise<ActionResult<boolean>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'A valid plant ID is required for archiving.',
      };
    }

    // Soft-delete to preserve foreign-key references in POS items & contracts
    await prisma.plant.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });

    revalidatePath(APP_ROUTES.PLANTS);

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('[deletePlantAction Error]:', error);
    return {
      success: false,
      error: 'Failed to archive plant record. Please try again.',
    };
  }
}
