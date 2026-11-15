/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/lib/constants/routes.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Created the centralized route constants registry (APP_ROUTES) for Bharti's Green World ERP.
 *    - Defined dedicated full-screen routes for every module: Plants, Customers, Vendors, Inventory,
 *      POS Billing, Landscaping Contracts, Labor Attendance, Reports, and Settings.
 *    - Implemented type-safe route generator functions for dynamic parameterized routes (edit, view).
 * 
 * 2. WHY IT WAS DONE:
 *    - To strictly eliminate hardcoded URL string literals throughout the application codebase.
 *    - To satisfy the core architectural mandate of dedicated full-screen routes (Zero Popups/Modals).
 *    - To ensure consistent navigation and programmatic redirect handling across Next.js Server Actions and client views.
 * 
 * 3. WHAT WAS USED:
 *    - TypeScript `as const` object assertions for strict compile-time type safety.
 *    - Standard URL path formatting complying with Next.js App Router conventions.
 * 
 * 4. HOW IT WORKS:
 *    - Components and Server Actions import `APP_ROUTES` instead of typing raw route strings.
 *    - Calling `APP_ROUTES.PLANTS_EDIT(plantId)` returns the exact parameterized full-screen edit route `/plants/[id]/edit`.
 * 
 * ----------------------------------------------------------------------------
 */

export const APP_ROUTES = {
  // Core & Dashboard
  DASHBOARD: '/',
  DASHBOARD_ALIAS: '/dashboard',
  ABOUT: '/about',
  PRIVACY: '/privacy',

  // 1. Plant Inventory & Nursery Stock
  PLANTS: '/plants',
  PLANTS_NEW: '/plants/new',
  PLANTS_VIEW: (id: string) => `/plants/${id}`,
  PLANTS_EDIT: (id: string) => `/plants/${id}/edit`,

  // 2. Customer Management (Retail & Landscape Clients)
  CUSTOMERS: '/customers',
  CUSTOMERS_NEW: '/customers/new',
  CUSTOMERS_VIEW: (id: string) => `/customers/${id}`,
  CUSTOMERS_EDIT: (id: string) => `/customers/${id}/edit`,

  // 3. Vendor & Supplier Management
  VENDORS: '/vendors',
  VENDORS_NEW: '/vendors/new',
  VENDORS_VIEW: (id: string) => `/vendors/${id}`,
  VENDORS_EDIT: (id: string) => `/vendors/${id}/edit`,

  // 4. Raw Materials, Fertilizers & Nursery Supplies
  INVENTORY: '/inventory',
  INVENTORY_NEW: '/inventory/new',
  INVENTORY_VIEW: (id: string) => `/inventory/${id}`,
  INVENTORY_EDIT: (id: string) => `/inventory/${id}/edit`,
  INVENTORY_LOG: '/inventory/log',

  // 5. Point of Sale (POS) & Quick Billing Counter
  POS: '/pos',
  POS_NEW: '/pos/new',
  POS_BILLING: '/pos/new',
  POS_HISTORY: '/pos',
  POS_VIEW: (id: string) => `/pos/${id}`,

  // 6. Landscaping Projects & Corporate Contracts
  CONTRACTS: '/contracts',
  CONTRACTS_NEW: '/contracts/new',
  CONTRACTS_VIEW: (id: string) => `/contracts/${id}`,
  CONTRACTS_EDIT: (id: string) => `/contracts/${id}/edit`,
  CONTRACTS_ESTIMATES: '/contracts/estimates',
  CONTRACTS_ESTIMATES_NEW: '/contracts/estimates/new',

  // 7. Labor, Daily Wage & Worker Attendance
  LABOR: '/labor',
  LABOR_NEW: '/labor/new',
  LABOR_VIEW: (id: string) => `/labor/${id}`,
  LABOR_EDIT: (id: string) => `/labor/${id}/edit`,
  LABOR_ATTENDANCE: '/labor/attendance',

  // 8. Business Intelligence, Audits & Reports
  REPORTS: '/reports',

  // 9. Nursery Master Settings & Configurations
  SETTINGS: '/settings',

  // 10. Authentication & Counter Staff Login
  LOGIN: '/login',
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;
