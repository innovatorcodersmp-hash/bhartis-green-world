/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file scripts/sync-plant-stock.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented a standalone Prisma database synchronization script.
 *    - Recalculates and updates each `Plant` record's `stockCount` field directly from the sum
 *      of `currentQty` across all active (non-archived) `InventoryBatch` records.
 *    - Automatically discovers and loads `.env` across local and parent directories.
 *    - Prints a detailed ledger audit showing previous vs. updated stock counts for each plant cultivar.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills User Request: "One-Time Data Sync Script for Existing Neon Batches".
 *    - Eliminates false "0 pots left" low-stock alerts across existing Neon database records
 *      (including 17 batches / 643 pots, such as Exora's 8 pots).
 * 
 * 3. WHAT WAS USED:
 *    - `@prisma/client` (`PrismaClient`).
 *    - Node.js `fs`, `path`, and environment variables (`DATABASE_URL`).
 * 
 * 4. HOW IT WORKS:
 *    - Discovers `.env`, loads `DATABASE_URL`, connects to PostgreSQL datasource;
 *    - Queries all active plants;
 *    - For each plant, aggregates `_sum.currentQty` from `InventoryBatch` where `status != 'ARCHIVED'`;
 *    - Persists updated `stockCount` to `Plant` table;
 *    - Summarizes total batches, varieties, and live ready stock pots.
 * 
 * ----------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';

// Load .env from current directory or parent directory if present
function loadEnv() {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(__dirname, '../.env'),
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const eqIndex = trimmed.indexOf('=');
            const key = trimmed.slice(0, eqIndex).trim();
            let val = trimmed.slice(eqIndex + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
        console.log(`📄 Loaded environment variables from: ${envPath}`);
        break;
      } catch (err) {
        console.warn(`Could not read ${envPath}:`, err);
      }
    }
  }
}

loadEnv();

import { PrismaClient } from '@prisma/client';

export async function syncAllPlantStocks() {
  console.log('🌿 ============================================================');
  console.log('🌱 Starting Bharti\'s Green World Plant Stock Synchronization...');
  console.log('🌿 ============================================================');

  if (!process.env.DATABASE_URL) {
    console.error('❌ Environment variable DATABASE_URL is not set.');
    console.error('   Please define DATABASE_URL in your .env file or export it before running this script:');
    console.error('   DATABASE_URL="postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require" npm run sync-stock\n');
    throw new Error('DATABASE_URL environment variable is required.');
  }

  const prisma = new PrismaClient();

  try {
    // 1. Fetch all active plants
    const plants = await prisma.plant.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        marathiName: true,
        stockCount: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`📋 Found ${plants.length} active plant varieties in master directory.\n`);

    let totalUpdatedPlants = 0;
    let totalPotsCalculated = 0;
    let totalBatchesSummed = 0;

    for (const plant of plants) {
      // 2. Aggregate active batches for this plant
      const [stockAggregate, batchCount] = await Promise.all([
        prisma.inventoryBatch.aggregate({
          where: {
            plantId: plant.id,
            status: {
              not: 'ARCHIVED',
            },
          },
          _sum: {
            currentQty: true,
          },
        }),
        prisma.inventoryBatch.count({
          where: {
            plantId: plant.id,
            status: {
              not: 'ARCHIVED',
            },
          },
        }),
      ]);

      const sumQty = stockAggregate._sum.currentQty ?? 0;
      totalPotsCalculated += sumQty;
      totalBatchesSummed += batchCount;

      // 3. Update plant stockCount
      await prisma.plant.update({
        where: { id: plant.id },
        data: {
          stockCount: sumQty,
        },
      });

      totalUpdatedPlants += 1;

      const changeStr = plant.stockCount !== sumQty
        ? `[SYNCED: ${plant.stockCount} -> ${sumQty} pots]`
        : `[MATCHED: ${sumQty} pots]`;

      const displayName = plant.marathiName
        ? `${plant.name} (${plant.marathiName})`
        : plant.name;

      console.log(`   🪴 ${displayName.padEnd(38)} | SKU: ${plant.sku.padEnd(14)} | ${changeStr} (${batchCount} batches)`);
    }

    console.log('\n============================================================');
    console.log('✅ Stock Synchronization Complete:');
    console.log(`   - Total Plant Varieties Updated : ${totalUpdatedPlants}`);
    console.log(`   - Total Inventory Batches Counted: ${totalBatchesSummed}`);
    console.log(`   - Total Ready Stock Pots Synced : ${totalPotsCalculated}`);
    console.log('============================================================\n');

    return {
      totalUpdatedPlants,
      totalBatchesSummed,
      totalPotsCalculated,
    };
  } catch (error: any) {
    console.error('❌ Error executing plant stock synchronization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-execute when run directly via CLI
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.replace(/\\/g, '/').endsWith('sync-plant-stock.ts'))) {
  syncAllPlantStocks()
    .then(() => {
      console.log('🎉 Stock sync process exited cleanly.');
      process.exit(0);
    })
    .catch((_err) => {
      process.exit(1);
    });
}
