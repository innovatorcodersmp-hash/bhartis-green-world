/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/api/inventory/route.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented REST API route handlers (`GET`, `POST`) for Sapling Batches (`InventoryBatch`).
 *    - Extended `POST` handler to support multi-plant repeatable line-items (`items: [...]`) alongside
 *      shared consignment headers (`batchNumber`, `purchaseDate` / `arrivalDate`, `vendorId` / `supplierId`),
 *      while preserving full backwards compatibility for single plant batch payloads.
 *    - Wrapped batch creation in an atomic `prisma.$transaction(...)` so that every affected `Plant`
 *      record has its `stockCount` field recalculated directly from the sum of active batch quantities
 *      and written to the `Plant` table.
 *    - Dispatched Next.js cache revalidation triggers for `/inventory`, `/dashboard`, and `/plants`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills User Request: "Atomic Batch Creation & Stock Sync (inventoryActions.ts & /api/inventory/route.ts)".
 *    - Enables nursery staff and API clients to log multiple cultivars under one batch consignment in one request.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Edge / Node Route Handlers (`NextRequest`, `NextResponse`).
 *    - Prisma ORM transactional query builder (`prisma.$transaction`, `aggregate`).
 *    - Next.js cache purging (`revalidatePath`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - `GET`: Returns list of all active non-archived inventory batches with relations.
 *    - `POST`: Detects multi-plant array or single-plant payload; auto-generates next batch code if absent;
 *      executes atomic transaction creating all batch records and recalculating plant stock counts;
 *      purges route caches; and returns created batch records with 201 status.
 * 
 * ----------------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { APP_ROUTES } from '@/lib/constants/routes';
import { generateNextBatchCode, syncPlantStockCount } from '@/modules/inventory/actions/inventoryActions';

export async function GET() {
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

    return NextResponse.json({
      success: true,
      data: batches,
    });
  } catch (error: any) {
    console.error('[API /api/inventory GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory batches.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const purchaseDate = body.arrivalDate
      ? new Date(body.arrivalDate)
      : body.purchaseDate
      ? new Date(body.purchaseDate)
      : new Date();

    const vendorId = body.supplierId || body.vendorId || null;

    let candidateBatchNumber = body.batchNumber?.trim();
    if (!candidateBatchNumber) {
      candidateBatchNumber = await generateNextBatchCode(prisma);
    }

    // MULTI-PLANT CONSIGNMENT REPEATER PAYLOAD
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const createdBatches = await prisma.$transaction(async (tx) => {
        const results = [];
        const affectedPlantIds = new Set<string>();

        for (const item of body.items) {
          const plantId = item.plantId;
          if (!plantId) continue;

          const initialQty = Number(item.initialQty ?? item.currentStock ?? item.currentQty ?? 0);
          const currentQty = Number(item.currentQty ?? item.currentStock ?? initialQty);
          const mortalityQty = Number(item.mortalityQty ?? 0);
          const unitCostPrice = item.unitCostPrice !== undefined && item.unitCostPrice !== null
            ? Number(item.unitCostPrice)
            : null;

          const batch = await tx.inventoryBatch.create({
            data: {
              batchNumber: candidateBatchNumber,
              plantId,
              vendorId,
              initialQty,
              currentQty,
              mortalityQty,
              unitCostPrice,
              purchaseDate,
              status: 'ACTIVE',
            },
            include: {
              plant: true,
              vendor: true,
            },
          });

          results.push(batch);
          affectedPlantIds.add(plantId);
        }

        // Recalculate stock for all affected plants inside the same atomic transaction
        for (const plantId of affectedPlantIds) {
          await syncPlantStockCount(tx, plantId);
        }

        return results;
      });

      // Purge caches
      revalidatePath(APP_ROUTES.INVENTORY);
      revalidatePath(APP_ROUTES.PLANTS);
      revalidatePath(APP_ROUTES.DASHBOARD);
      revalidatePath('/dashboard');
      revalidatePath('/plants');

      return NextResponse.json(
        { success: true, data: createdBatches },
        { status: 201 }
      );
    }

    // SINGLE PLANT BATCH PAYLOAD
    const plantId = body.plantId;
    if (!plantId) {
      return NextResponse.json(
        { success: false, error: 'plantId or items array is required.' },
        { status: 400 }
      );
    }

    const initialQty = Number(body.initialQty ?? body.currentStock ?? body.currentQty ?? 0);
    const currentQty = Number(body.currentQty ?? body.currentStock ?? initialQty);
    const mortalityQty = Number(body.mortalityQty ?? 0);
    const unitCostPrice = body.unitCostPrice !== undefined && body.unitCostPrice !== null
      ? Number(body.unitCostPrice)
      : null;

    const createdBatch = await prisma.$transaction(async (tx) => {
      const batch = await tx.inventoryBatch.create({
        data: {
          batchNumber: candidateBatchNumber,
          plantId,
          vendorId,
          initialQty,
          currentQty,
          mortalityQty,
          unitCostPrice,
          purchaseDate,
          status: 'ACTIVE',
        },
        include: {
          plant: true,
          vendor: true,
        },
      });

      // Recalculate parent Plant stock directly from sum of currentQty across active batches
      await syncPlantStockCount(tx, plantId);

      return batch;
    });

    // Invalidate caches so Vercel never serves stale data
    revalidatePath(APP_ROUTES.INVENTORY);
    revalidatePath(APP_ROUTES.PLANTS);
    revalidatePath(APP_ROUTES.DASHBOARD);
    revalidatePath('/dashboard');
    revalidatePath('/plants');

    return NextResponse.json(
      { success: true, data: createdBatch },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/inventory POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create inventory batch.' },
      { status: 500 }
    );
  }
}
