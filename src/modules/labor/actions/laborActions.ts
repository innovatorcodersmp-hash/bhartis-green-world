/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/labor/actions/laborActions.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built Next.js Server Actions for Employee Directory & Login Credentials Provisioning.
 *    - Implemented `getEmployeesAction`, `getEmployeeByIdAction`, `createEmployeeAction`,
 *      `updateEmployeeAction`, and `deleteEmployeeAction`.
 *    - Enforced uniqueness validation for staff usernames and contact phone numbers.
 *    - Wrapped every action in strict try-catch blocks returning standard `ActionResult<T>`. Zero raw SQL.
 *    - Triggered cache invalidation on `APP_ROUTES.LABOR` upon successful mutations.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 04: "Next.js Server Actions First", "Zero Raw SQL", "Mandatory Try-Catch".
 *    - Allows nursery management to securely provision POS credentials for cashiers and attendance profiles
 *      for outdoor grafting laborers in Kolhapur.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js Server Actions (`'use server'`).
 *    - Prisma ORM query builder methods.
 *    - Zod validation (`EmployeeInputSchema`).
 *    - Centralized route constants (`APP_ROUTES`).
 * 
 * 4. HOW IT WORKS:
 *    - Validates inputs via Zod, checks unique constraints, commits record via Prisma, and revalidates cache.
 * 
 * ----------------------------------------------------------------------------
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResult } from '@/types';
import { APP_ROUTES } from '@/lib/constants/routes';
import {
  Employee,
  EmployeeInput,
  EmployeeInputSchema,
} from '../types';

// ============================================================================
// 1. QUERY: FETCH ALL ACTIVE EMPLOYEES & WORKERS
// ============================================================================

export async function getEmployeesAction(): Promise<ActionResult<Employee[]>> {
  try {
    const employees = await prisma.employee.findMany({
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
      data: employees,
    };
  } catch (error) {
    console.error('Failed to retrieve employee directory:', error);
    return {
      success: false,
      error: 'Unable to retrieve employee records. Please try again.',
    };
  }
}

// ============================================================================
// 2. QUERY: FETCH EMPLOYEE BY UNIQUE ID
// ============================================================================

export async function getEmployeeByIdAction(
  id: string
): Promise<ActionResult<Employee>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid employee identifier supplied.',
      };
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee || employee.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'The requested employee profile was not found.',
      };
    }

    return {
      success: true,
      data: employee,
    };
  } catch (error) {
    console.error(`Failed to retrieve employee [ID: ${id}]:`, error);
    return {
      success: false,
      error: 'Unable to load employee details.',
    };
  }
}

// ============================================================================
// 3. MUTATION: CREATE NEW EMPLOYEE ACCOUNT & CREDENTIALS
// ============================================================================

export async function createEmployeeAction(
  input: EmployeeInput
): Promise<ActionResult<Employee>> {
  try {
    const parsed = EmployeeInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed. Please verify staff details and credentials.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const {
      fullName,
      username,
      password,
      phone,
    } = parsed.data;

    // Check username collision
    if (username) {
      const existingUser = await prisma.employee.findUnique({
        where: { username },
      });
      if (existingUser) {
        return {
          success: false,
          error: `Username "${username}" is already assigned to another staff member.`,
          fieldErrors: {
            username: ['This username is already taken.'],
          },
        };
      }
    }

    // Check phone collision
    const existingPhone = await prisma.employee.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return {
        success: false,
        error: `Phone number "${phone}" is already registered to another employee.`,
        fieldErrors: {
          phone: ['This phone number is already registered.'],
        },
      };
    }

    const newEmployee = await prisma.employee.create({
      data: {
        name: fullName,
        username,
        password,
        phone,
      },
    });

    revalidatePath(APP_ROUTES.LABOR);

    return {
      success: true,
      data: newEmployee,
    };
  } catch (error) {
    console.error('Failed to create employee profile:', error);
    return {
      success: false,
      error: 'Database transaction failed while creating employee account.',
    };
  }
}

// ============================================================================
// 4. MUTATION: UPDATE EXISTING EMPLOYEE DETAILS & CREDENTIALS
// ============================================================================

export async function updateEmployeeAction(
  id: string,
  input: EmployeeInput
): Promise<ActionResult<Employee>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid employee ID supplied for update.',
      };
    }

    const parsed = EmployeeInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed. Please review the highlighted fields.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const {
      fullName,
      username,
      password,
      phone,
    } = parsed.data;

    // Check username collision on other records
    if (username) {
      const existingUser = await prisma.employee.findFirst({
        where: {
          username,
          id: { not: id },
        },
      });
      if (existingUser) {
        return {
          success: false,
          error: `Username "${username}" is already taken by another employee.`,
          fieldErrors: {
            username: ['This username is already taken.'],
          },
        };
      }
    }

    // Check phone collision on other records
    const existingPhone = await prisma.employee.findFirst({
      where: {
        phone,
        id: { not: id },
      },
    });
    if (existingPhone) {
      return {
        success: false,
        error: `Phone number "${phone}" is already in use by another staff member.`,
        fieldErrors: {
          phone: ['This phone number is already registered.'],
        },
      };
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name: fullName,
        username,
        password,
        phone,
      },
    });

    revalidatePath(APP_ROUTES.LABOR);
    revalidatePath(APP_ROUTES.LABOR_EDIT(id));

    return {
      success: true,
      data: updatedEmployee,
    };
  } catch (error) {
    console.error(`Failed to update employee [ID: ${id}]:`, error);
    return {
      success: false,
      error: 'Database transaction failed while updating employee profile.',
    };
  }
}

// ============================================================================
// 5. MUTATION: SOFT-DELETE / ARCHIVE EMPLOYEE PROFILE
// ============================================================================

export async function deleteEmployeeAction(
  id: string
): Promise<ActionResult<void>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid employee ID supplied for deletion.',
      };
    }

    await prisma.employee.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });

    revalidatePath(APP_ROUTES.LABOR);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Failed to archive employee [ID: ${id}]:`, error);
    return {
      success: false,
      error: 'Unable to archive employee. Please try again.',
    };
  }
}
