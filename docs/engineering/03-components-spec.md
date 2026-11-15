# 03. Shared UI Components Specification
**Project:** Bharti's Green World ERP (Kolhapur)  
**Author / Lead Architect:** Saniya Patil  
**Engine:** TanStack Table v8, Radix UI Primitives, SASS Design Tokens  

---

## 1. Responsive & PWA Component Rules

- **NO RAW HTML CONTROLS:** Module components MUST NOT render raw HTML `<button>`, `<input>`, `<select>`, or `<table>` tags directly.
- All controls MUST import shared primitives (`@/components/ui/`, `@/components/datatable/`).
- Touch area minimum: 44px x 44px on all interactive component triggers.

---

## 2. Core Base Components Specification

### 2.1 Standard Page Shell (`<PageLayout>`)
- **Location:** `@/components/layout/PageLayout.tsx`
- **Purpose:** Wraps every route. Integrates fixed 58px top header, circular leaf logo, responsive hamburger drawer, PWA install prompt banner support, and `$bottom-nav-clearance` (`pb-36`).

### 2.2 Reusable Summary Metric Card (`<MetricCard>`)
- **Location:** `@/components/ui/MetricCard/MetricCard.tsx`
- **Responsive behavior:** Displays as full-width stacked cards on mobile (`<768px`) and expands to a responsive 3 or 4-column metric grid on desktop (`>=1024px`).

### 2.3 Responsive TanStack Data Table Wrapper (`<DataTable>`)
- **Location:** `@/components/datatable/DataTable.tsx`
- **Mobile/PWA Mode:** Wraps table in smooth horizontal swipe container (`overflow-x: auto; -webkit-overflow-scrolling: touch;`) with visual swipe helper subtext on mobile screens.
