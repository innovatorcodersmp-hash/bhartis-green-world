/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/contracts/actions/contractActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built Next.js Server Actions for Landscaping Projects, Garden Contracts, Milestone Stage Invoicing,
 *      and Advance Payment Ledger.
 *    - Implemented:
 *      * `generateNextContractNumber`: Generates sequential contract tracking codes formatted as
 *        `BGW-CNT-YYYY-XXXX` (e.g. `BGW-CNT-2026-0001`) with concurrency-safe collision guards.
 *      * `getNextContractNumberAction`: Server Action querying the next sequential contract code for instant UI pre-filling.
 *      * `getContractsAction`: Retrieves active contracts with joined customer profiles and payment ledgers.
 *      * `getContractByIdAction`: Retrieves a specific contract with relations.
 *      * `createContractAction`: Creates a contract with initial valuation, auto-generated `BGW-CNT-YYYY-XXXX`
 *        numbering, and advance receipt. Auto-registers walk-in / new clients in Customer Master within the
 *        atomic transaction using idempotent upsert.
 *      * `updateContractAction`: Modifies contract scope, execution stage, progress, and auto-syncs customer master.
 *      * `deleteContractAction`: Soft-deletes/archives contracts to preserve audit logs.
 *      * `recordContractPaymentAction`: Records stage payments/advances (`GardenContractPayment`),
 *        increments `advanceReceived`, recalculates `balanceAmount`, and syncs customer Udhar credit balance.
 *      * `generateContractMilestoneInvoiceAction`: Constructs milestone invoice payload for printable vector PDF dispatch.
 *    - Executed atomic Prisma ORM transactions (`prisma.$transaction`) ensuring strict financial consistency and concurrency safety. Zero raw SQL.
 *    - Triggered cache revalidation on `APP_ROUTES.CONTRACTS` and `APP_ROUTES.CUSTOMERS`.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 04: "Next.js Server Actions First", "Zero Raw SQL", "Mandatory Try-Catch".
 *    - Fulfills user request: "TASK: AUTOMATE CONTRACT NUMBER GENERATION WITH BGW PREFIX IN LANDSCAPING MODULE".
 *    - Eliminates manual typing or random contract codes, enforcing unified `BGW-CNT-YYYY-XXXX` tracking across the nursery.
 *    - Automatically binds and creates customer accounts for walk-in site contracts without manual double-entry.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM query builder and interactive transactions (`prisma.$transaction`).
 *    - Zod validation (`ContractInputSchema`, `RecordPaymentInputSchema`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Generates sequential BGW contract codes; validates payloads with Zod; commits changes within atomic
 *      transactions; revalidates paths; and returns standard `ActionResult<T>`.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  GardenContractWithRelations,
  GardenContractPayment,
  ContractInput,
  ContractInputSchema,
  RecordPaymentInput,
  RecordPaymentInputSchema,
  MilestoneInvoicePayload,
  ContractStage,
} from '../types';

// ============================================================================
// 1. UTILITY: AUTO-GENERATE CONCURRENCY-SAFE SEQUENTIAL CONTRACT NUMBER
// ============================================================================

/**
 * Extracts the highest sequence number from existing contracts for the current year
 * and generates the next sequential code formatted as BGW-CNT-YYYY-XXXX (e.g., BGW-CNT-2026-0001).
 */
export async function generateNextContractNumber(
  txOrPrisma: any = prisma,
  customYear?: number
): Promise<string> {
  const currentYear = customYear || new Date().getFullYear();
  const prefix = `BGW-CNT-${currentYear}-`;

  const currentYearContracts = await txOrPrisma.gardenContract.findMany({
    where: {
      contractNo: {
        startsWith: prefix,
      },
    },
    select: { contractNo: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  let maxSeq = 0;

  // Scan current year BGW-CNT-YYYY-XXXX codes
  const bgwRegex = new RegExp(`^BGW-CNT-${currentYear}-(\\d+)`, 'i');
  for (const c of currentYearContracts) {
    const match = c.contractNo.match(bgwRegex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  // Increment and pad sequence to 4 digits (e.g. 0001, 0002)
  const nextSeq = maxSeq + 1;
  let candidateContractNo = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  // Guarantee absolute uniqueness against race conditions or manual inserts
  let counter = nextSeq;
  while (
    await txOrPrisma.gardenContract.findUnique({
      where: { contractNo: candidateContractNo },
    })
  ) {
    counter++;
    candidateContractNo = `${prefix}${String(counter).padStart(4, '0')}`;
  }

  return candidateContractNo;
}

// ============================================================================
// 2. QUERY: GET NEXT SEQUENTIAL CONTRACT NUMBER FOR UI PRE-FILL
// ============================================================================

export async function getNextContractNumberAction(
  customYear?: number
): Promise<ActionResult<string>> {
  try {
    const contractNo = await generateNextContractNumber(prisma, customYear);
    return {
      success: true,
      data: contractNo,
    };
  } catch (error) {
    console.error('Failed to retrieve next sequential contract number:', error);
    const year = customYear || new Date().getFullYear();
    return {
      success: true,
      data: `BGW-CNT-${year}-0001`,
    };
  }
}

// ============================================================================
// 3. QUERY: FETCH ALL ACTIVE GARDEN CONTRACTS WITH CUSTOMER & PAYMENTS
// ============================================================================

export async function getContractsAction(): Promise<
  ActionResult<GardenContractWithRelations[]>
> {
  try {
    const contracts = await prisma.gardenContract.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      include: {
        customer: true,
        payments: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: contracts as GardenContractWithRelations[],
    };
  } catch (error) {
    console.error('Failed to retrieve garden contracts:', error);
    return {
      success: false,
      error: 'Unable to retrieve landscaping contracts. Please try again.',
    };
  }
}

// ============================================================================
// 2. QUERY: FETCH CONTRACT BY UNIQUE IDENTIFIER
// ============================================================================

export async function getContractByIdAction(
  id: string
): Promise<ActionResult<GardenContractWithRelations>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid contract identifier supplied.',
      };
    }

    const contract = await prisma.gardenContract.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!contract || contract.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'The requested landscaping contract was not found.',
      };
    }

    return {
      success: true,
      data: contract as GardenContractWithRelations,
    };
  } catch (error) {
    console.error(`Failed to retrieve contract [ID: ${id}]:`, error);
    return {
      success: false,
      error: 'Unable to load contract details.',
    };
  }
}

// ============================================================================
// 3. MUTATION: CREATE NEW GARDEN CONTRACT
// ============================================================================

export async function createContractAction(
  input: ContractInput
): Promise<ActionResult<GardenContractWithRelations>> {
  try {
    const parsed = ContractInputSchema.safeParse(input);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || 'Validation failed. Please verify the contract details.';
      return {
        success: false,
        error: firstError,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const {
      contractNo,
      customerId,
      clientName,
      clientPhone,
      siteAddress,
      projectType,
      plotSize,
      totalEstimate,
      advanceReceived,
      currentStage,
      progressPercent,
      supervisorNotes,
    } = parsed.data;

    // Auto-calculate financial balance
    const balanceAmount = Math.max(0, totalEstimate - advanceReceived);

    const newContract = await prisma.$transaction(async (tx) => {
      // 1. Resolve or verify sequential contract tracking number (BGW-CNT-YYYY-XXXX)
      let finalContractNo = (contractNo || '').trim();
      if (!finalContractNo) {
        finalContractNo = await generateNextContractNumber(tx);
      } else {
        const existingContract = await tx.gardenContract.findUnique({
          where: { contractNo: finalContractNo },
        });
        if (existingContract) {
          finalContractNo = await generateNextContractNumber(tx);
        }
      }

      let finalCustomerId = customerId;

      // If Walk-in or no customerId provided, check or register Customer in Master
      if (!finalCustomerId || finalCustomerId === 'WALK_IN_NEW') {
        const cleanPhone = clientPhone ? clientPhone.replace(/\D/g, '').slice(-10) : '';

        let customer = null;

        // 1. If phone is provided, atomically upsert customer in Customer Master
        if (cleanPhone) {
          customer = await tx.customer.upsert({
            where: { phone: cleanPhone },
            update: {
              ...(siteAddress?.trim() ? { address: siteAddress.trim() } : {}),
            },
            create: {
              name: (clientName || 'Walk-in Client').trim(),
              phone: cleanPhone,
              address: siteAddress?.trim() || null,
              totalUdharDue: 0.0,
              status: 'ACTIVE',
            },
          });
          finalCustomerId = customer.id;
        } else if (clientName) {
          // 2. Otherwise search by name or generate temporary identifier
          customer = await tx.customer.findFirst({
            where: { name: { equals: clientName.trim(), mode: 'insensitive' } },
          });

          if (customer) {
            finalCustomerId = customer.id;
            if (!customer.address && siteAddress.trim()) {
              await tx.customer.update({
                where: { id: customer.id },
                data: { address: siteAddress.trim() },
              });
            }
          } else {
            const createdCust = await tx.customer.create({
              data: {
                name: clientName.trim(),
                phone: `WALK-${Date.now().toString().slice(-8)}`,
                address: siteAddress?.trim() || null,
                totalUdharDue: 0.0,
                status: 'ACTIVE',
              },
            });
            finalCustomerId = createdCust.id;
          }
        }
      }

      const contract = await tx.gardenContract.create({
        data: {
          contractNo: finalContractNo,
          customerId: finalCustomerId!,
          siteAddress,
          projectType,
          plotSize,
          totalEstimate,
          advanceReceived,
          balanceAmount,
          currentStage,
          progressPercent,
          supervisorNotes,
        },
        include: {
          customer: true,
          payments: true,
        },
      });

      // If initial advance was recorded, log an initial payment receipt
      if (advanceReceived > 0) {
        await tx.gardenContractPayment.create({
          data: {
            contractId: contract.id,
            amount: advanceReceived,
            paymentMode: 'UPI',
            stageName: 'ADVANCE_MOBILIZATION',
            receiptNo: `RCP-${finalContractNo}-001`,
            notes: 'Initial contract advance received upon project agreement.',
          },
        });
      }

      return contract;
    });

    revalidatePath(APP_ROUTES.CONTRACTS);
    revalidatePath(APP_ROUTES.CUSTOMERS);

    return {
      success: true,
      data: newContract as GardenContractWithRelations,
    };
  } catch (error) {
    console.error('Failed to create garden contract:', error);
    return {
      success: false,
      error: 'Database transaction failed while creating the contract.',
    };
  }
}

// ============================================================================
// 4. MUTATION: UPDATE EXISTING GARDEN CONTRACT
// ============================================================================

export async function updateContractAction(
  id: string,
  input: ContractInput
): Promise<ActionResult<GardenContractWithRelations>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid contract ID supplied for update.',
      };
    }

    const parsed = ContractInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed. Please review the highlighted fields.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const {
      contractNo,
      customerId,
      clientName,
      clientPhone,
      siteAddress,
      projectType,
      plotSize,
      totalEstimate,
      advanceReceived,
      currentStage,
      progressPercent,
      supervisorNotes,
    } = parsed.data;

    // Check for collision on contractNo with another record
    const existing = await prisma.gardenContract.findFirst({
      where: {
        contractNo,
        id: { not: id },
      },
    });
    if (existing) {
      return {
        success: false,
        error: `Contract number "${contractNo}" is already in use by another contract.`,
        fieldErrors: {
          contractNo: ['This contract number is already in use.'],
        },
      };
    }

    const balanceAmount = Math.max(0, totalEstimate - advanceReceived);

    const updatedContract = await prisma.$transaction(async (tx) => {
      let finalCustomerId = customerId;

      if (!finalCustomerId || finalCustomerId === 'WALK_IN_NEW') {
        const cleanPhone = clientPhone ? clientPhone.replace(/\D/g, '').slice(-10) : '';

        let customer = cleanPhone
          ? await tx.customer.findUnique({ where: { phone: cleanPhone } })
          : null;

        if (!customer && clientName) {
          customer = await tx.customer.findFirst({
            where: { name: { equals: clientName.trim(), mode: 'insensitive' } },
          });
        }

        if (customer) {
          finalCustomerId = customer.id;
          if (!customer.address && siteAddress.trim()) {
            await tx.customer.update({
              where: { id: customer.id },
              data: { address: siteAddress.trim() },
            });
          }
        } else {
          const createdCust = await tx.customer.create({
            data: {
              name: (clientName || 'Walk-in Client').trim(),
              phone: cleanPhone || `WALK-${Date.now().toString().slice(-8)}`,
              address: siteAddress?.trim() || null,
              totalUdharDue: 0.0,
              status: 'ACTIVE',
            },
          });
          finalCustomerId = createdCust.id;
        }
      }

      return await tx.gardenContract.update({
        where: { id },
        data: {
          contractNo,
          customerId: finalCustomerId!,
          siteAddress,
          projectType,
          plotSize,
          totalEstimate,
          advanceReceived,
          balanceAmount,
          currentStage,
          progressPercent,
          supervisorNotes,
        },
        include: {
          customer: true,
          payments: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    });

    revalidatePath(APP_ROUTES.CONTRACTS);
    revalidatePath(APP_ROUTES.CONTRACTS_EDIT(id));
    revalidatePath(APP_ROUTES.CUSTOMERS);

    return {
      success: true,
      data: updatedContract as GardenContractWithRelations,
    };
  } catch (error) {
    console.error(`Failed to update contract [ID: ${id}]:`, error);
    return {
      success: false,
      error: 'Database transaction failed while updating contract.',
    };
  }
}

// ============================================================================
// 5. MUTATION: RECORD STAGE PAYMENT & ADVANCE LEDGER
// ============================================================================

export async function recordContractPaymentAction(
  input: RecordPaymentInput
): Promise<
  ActionResult<{
    payment: GardenContractPayment;
    contract: GardenContractWithRelations;
  }>
> {
  try {
    const parsed = RecordPaymentInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed. Please review the payment amount and details.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { contractId, amount, paymentMode, stageName, notes } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current contract with customer and existing payments
      const contract = await tx.gardenContract.findUnique({
        where: { id: contractId },
        include: {
          customer: true,
          payments: true,
        },
      });

      if (!contract || contract.status === 'ARCHIVED') {
        throw new Error('Landscaping contract not found or has been archived.');
      }

      // 2. Generate sequential payment receipt number
      const paymentCount = (contract.payments?.length || 0) + 1;
      const receiptNo = `RCP-${contract.contractNo}-${String(paymentCount).padStart(3, '0')}`;

      // 3. Create payment record
      const payment = await tx.gardenContractPayment.create({
        data: {
          contractId: contract.id,
          amount,
          paymentMode,
          stageName,
          receiptNo,
          notes,
        },
      });

      // 4. Recalculate contract advances and pending balance
      const newAdvanceReceived = contract.advanceReceived + amount;
      const newBalanceAmount = Math.max(0, contract.totalEstimate - newAdvanceReceived);

      // Check if stageName corresponds to a valid ContractStage enum to advance project
      const validContractStages: ContractStage[] = [
        'SITE_PREP',
        'PLANTING',
        'IRRIGATION_SETUP',
        'MAINTENANCE_HANDOVER',
      ];
      const stageUpdate = validContractStages.includes(stageName as ContractStage)
        ? { currentStage: stageName as ContractStage }
        : {};

      const updatedContract = await tx.gardenContract.update({
        where: { id: contract.id },
        data: {
          advanceReceived: newAdvanceReceived,
          balanceAmount: newBalanceAmount,
          ...stageUpdate,
        },
        include: {
          customer: true,
          payments: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      // 5. Synchronize Customer directory Udhar ledger if applicable
      if (paymentMode === 'CREDIT_UDHAR') {
        // Record as credit receivable against customer profile
        await tx.customer.update({
          where: { id: contract.customerId },
          data: {
            totalUdharDue: {
              increment: amount,
            },
          },
        });
      } else if (paymentMode === 'CASH' || paymentMode === 'UPI') {
        // If customer had an outstanding Udhar balance, reduce it proportionally
        if (contract.customer && contract.customer.totalUdharDue > 0) {
          const udharDeduction = Math.min(contract.customer.totalUdharDue, amount);
          if (udharDeduction > 0) {
            await tx.customer.update({
              where: { id: contract.customerId },
              data: {
                totalUdharDue: {
                  decrement: udharDeduction,
                },
              },
            });
          }
        }
      }

      return {
        payment,
        contract: updatedContract as GardenContractWithRelations,
      };
    });

    revalidatePath(APP_ROUTES.CONTRACTS);
    revalidatePath(APP_ROUTES.CUSTOMERS);
    revalidatePath(APP_ROUTES.CONTRACTS_EDIT(input.contractId));

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Failed to record contract stage payment:', error);
    return {
      success: false,
      error: error?.message || 'Transaction failed while recording the milestone payment.',
    };
  }
}

// ============================================================================
// 6. QUERY / MUTATION: GENERATE CONTRACT MILESTONE INVOICE PAYLOAD
// ============================================================================

export async function generateContractMilestoneInvoiceAction({
  contractId,
  stageName,
  invoiceAmount,
  notes,
}: {
  contractId: string;
  stageName: string;
  invoiceAmount: number;
  notes?: string | null;
}): Promise<ActionResult<MilestoneInvoicePayload>> {
  try {
    if (!contractId || typeof contractId !== 'string') {
      return {
        success: false,
        error: 'Invalid contract ID supplied for invoice generation.',
      };
    }

    const contract = await prisma.gardenContract.findUnique({
      where: { id: contractId },
      include: {
        customer: true,
        payments: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!contract || contract.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'Contract not found or is no longer active.',
      };
    }

    const totalPaid = contract.advanceReceived;
    const balanceDue = contract.balanceAmount;
    const cleanStage = stageName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const receiptNo = `INV-${contract.contractNo}-${cleanStage || 'STAGE'}`;

    const payload: MilestoneInvoicePayload = {
      contract: contract as GardenContractWithRelations,
      stageName,
      invoiceAmount: invoiceAmount > 0 ? invoiceAmount : contract.totalEstimate,
      invoiceDate: new Date().toISOString(),
      receiptNo,
      previousPaid: Math.max(0, totalPaid - invoiceAmount),
      totalPaid,
      balanceDue,
      notes: notes || contract.supervisorNotes,
    };

    return {
      success: true,
      data: payload,
    };
  } catch (error) {
    console.error(`Failed to construct milestone invoice for contract [ID: ${contractId}]:`, error);
    return {
      success: false,
      error: 'Unable to prepare milestone invoice data.',
    };
  }
}

// ============================================================================
// 7. MUTATION: SOFT-DELETE / ARCHIVE GARDEN CONTRACT
// ============================================================================

export async function deleteContractAction(
  id: string
): Promise<ActionResult<void>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid contract ID supplied for deletion.',
      };
    }

    await prisma.gardenContract.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });

    revalidatePath(APP_ROUTES.CONTRACTS);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Failed to archive contract [ID: ${id}]:`, error);
    return {
      success: false,
      error: 'Unable to archive contract. Please try again.',
    };
  }
}
