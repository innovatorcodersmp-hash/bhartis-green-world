/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file prisma/add-saniya.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Standalone one-off runner to provision Saniya Patil (`sanu` / `sanu17`)
 *      and the developer `SUPERADMIN` account directly into PostgreSQL.
 *    - Calls the centralized, idempotent database seeder in `prisma/seed.ts`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Directly satisfies User Request: "run via npx tsx prisma/add-saniya.ts".
 * 
 * ----------------------------------------------------------------------------
 */

import { main } from './seed';

main()
  .then(() => {
    console.log('✅ prisma/add-saniya.ts completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed in prisma/add-saniya.ts:', err);
    process.exit(1);
  });

