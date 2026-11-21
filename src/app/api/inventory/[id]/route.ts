/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/api/inventory/[id]/route.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented REST API route handlers (`GET`, `PUT`, `PATCH`, `DELETE`) for individual Sapling Batches.
 *    - Wrapped update and deletion operations in atomic `prisma.$transaction(...)` blocks so that parent
 *      `Plant` records have their `stockCount` recalculated directly from the sum of active batch quantities.
 *    - Handled plant reallocation logic: if a batch's `plantId` changes, both previous and new `Plant` stock
 *      counts are atomically recalculated and synced.
 *    - Purged Next.js ISR/SSR caches via `revalidatePath` for `/dashboard` and `/plants`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Satisfies User Request: "Sync Plant Stock on Batch Create, Update, and Delete (API Routes)".
 *    - Prevents data desynchronization between inventory batches and plant stock counts.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Edge / Node Route Handlers (`NextRequest`, `NextResponse`).
 *    - Prisma ORM transactional query builder (`prisma.$transaction`, `aggregate`).
 *    - Next.js cache purging (`revalidatePath`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - `GET`: Finds single batch by UUID with plant and vendor relations.
 *    - `PUT` / `PATCH`: Verifies existing batch, updates quantity/mortality/plant, recalculates
 *      parent plant stock in transaction, invalidates dashboard and plant caches, returns updated batch.
 *    - `DELETE`: Archives batch (RecordStatus.ARCHIVED), recalculates parent plant stock, invalidates caches.
 * 
 * ----------------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { APP_ROUTES } from '@/lib/constants/routes';
import { syncPlantStockCount } from '@/modules/inventory/actions/inventoryActions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'A valid batch ID is required.' },
        { status: 400 }
      );
    }

    const batch = await prisma.inventoryBatch.findUnique({
      where: { id },
      include: {
        plant: true,
        vendor: true,
      },
    });

    if (!batch || batch.status === 'ARCHIVED') {
      return NextResponse.json(
        { success: false, error: 'Inventory batch not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: batch,
    });
  } catch (error: any) {
    console.error('[API /api/inventory/[id] GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batch details.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return handleUpdate(request, params);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return handleUpdate(request, params);
}

async function handleUpdate(request: NextRequest, paramsPromise: Promise<{ id: string }>) {
  try {
    const { id } = await paramsPromise;
    const body = await request.json();

    const updatedBatch = await prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryBatch.findUnique({
        where: { id },
      });

      if (!existing || existing.status === 'ARCHIVED') {
        throw new Error('Inventory batch record not found or has been removed.');
      }

      const targetPlantId = body.plantId || existing.plantId;
      const initialQty = body.initialQty !== undefined ? Number(body.initialQty) : existing.initialQty;
      const currentQty = body.currentQty !== undefined
        ? Number(body.currentQty)
        : body.currentStock !== undefined
        ? Number(body.currentStock)
        : existing.currentQty;
      const mortalityQty = body.mortalityQty !== undefined ? Number(body.mortalityQty) : existing.mortalityQty;
      const unitCostPrice = body.unitCostPrice !== undefined
        ? (body.unitCostPrice === null ? null : Number(body.unitCostPrice))
        : existing.unitCostPrice;
      const batchNumber = body.batchNumber ? body.batchNumber.trim() : existing.batchNumber;
      const vendorId = body.vendorId !== undefined ? (body.vendorId || null) : existing.vendorId;
      const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : existing.purchaseDate;

      // Verify batch code uniqueness for the same plant cultivar if changed
      if (batchNumber !== existing.batchNumber || targetPlantId !== existing.plantId) {
        const duplicate = await tx.inventoryBatch.findFirst({
          where: {
            batchNumber,
            plantId: targetPlantId,
            NOT: { id },
          },
        });
        if (duplicate) {
          throw new Error(`Batch Number '${batchNumber}' already has an entry for this plant cultivar.`);
        }
      }

      const updated = await tx.inventoryBatch.update({
        where: { id },
        data: {
          batchNumber,
          plantId: targetPlantId,
          vendorId,
          initialQty,
          currentQty,
          mortalityQty,
          unitCostPrice,
          purchaseDate,
        },
        include: {
          plant: true,
          vendor: true,
        },
      });

      // Recalculate stock for the assigned plant
      await syncPlantStockCount(tx, targetPlantId);

      // If plant reassigned, recalculate stock for previous plant as well
      if (existing.plantId !== targetPlantId) {
        await syncPlantStockCount(tx, existing.plantId);
      }

      return updated;
    });

    revalidatePath(APP_ROUTES.INVENTORY);
    revalidatePath(APP_ROUTES.INVENTORY_EDIT(id));
    revalidatePath(APP_ROUTES.PLANTS);
    revalidatePath(APP_ROUTES.DASHBOARD);
    revalidatePath('/dashboard');
    revalidatePath('/plants');

    return NextResponse.json({
      success: true,
      data: updatedBatch,
    });
  } catch (error: any) {
    console.error('[API /api/inventory/[id] UPDATE Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update inventory batch.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryBatch.findUnique({
        where: { id },
        select: { plantId: true },
      });

      if (!existing) {
        throw new Error('Inventory batch record not found.');
      }

      await tx.inventoryBatch.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
        },
      });

      // Recalculate parent Plant stock
      await syncPlantStockCount(tx, existing.plantId);
    });

    revalidatePath(APP_ROUTES.INVENTORY);
    revalidatePath(APP_ROUTES.PLANTS);
    revalidatePath(APP_ROUTES.DASHBOARD);
    revalidatePath('/dashboard');
    revalidatePath('/plants');

    return NextResponse.json({
      success: true,
      data: true,
    });
  } catch (error: any) {
    console.error('[API /api/inventory/[id] DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete inventory batch.' },
      { status: 500 }
    );
  }
}

