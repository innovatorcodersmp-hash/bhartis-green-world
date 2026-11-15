# 01. Frontend Architecture & Mobile-First PWA Guidelines
**Project:** Bharti's Green World ERP (Kolhapur)  
**Author / Lead Architect:** Saniya Patil  
**Framework:** Next.js (App Router - TypeScript)  
**Styling System:** Centralized SASS/SCSS Design Tokens  

---

## 1. Architectural Principles & Progressive Web App (PWA) Mandate

### 1.1 Mobile-First PWA Responsive Standards
- **PWA Primary Target:** The application is built as a Progressive Web App (PWA) optimized for mobile smartphones (nursery workers, billing counters, site supervisors) while seamlessly scaling to desktop monitors.
- **Service Worker & Manifest Integration:** Full offline-first caching for static assets, installability to homescreen ("Add to Home Screen"), and manifest configuration (`manifest.json` with forest-green theme `#1B4D3E`).
- **Touch Targets:** All buttons, table action triggers, drawer items, and inputs MUST enforce a minimum touch size of **44px x 44px**.
- **Font Zoom Prevention:** Text inputs and selects must maintain a minimum font size of `16px` (`1rem`) to prevent automatic iOS/Android Safari auto-zoom on field focus.

### 1.2 Strict Modular Feature Organization
- Pages inside Next.js `app/` are **lightweight routing shells** (under 50-80 lines of code).
- UI implementations live inside `@/modules/<feature-name>/components/`.

### 1.3 Form Reusability Rules (Add vs. Edit)
- **STRICT REQUIREMENT:** Build a single, highly flexible form component per module (e.g., `<PlantForm />`, `<CustomerForm />`, `<VendorForm />`).
- Pass `initialData={null}` for Create mode and `initialData={existingData}` for Edit mode.

### 1.4 Dedicated Full-Screen Routing (STRICT: NO POPUPS / MODALS)
- Every feature, form, edit view, log entry, and report view MUST reside on its own dedicated full-screen route (e.g., `/plants`, `/plants/new`, `/plants/[id]/edit`).
- Modal popups or sliding form overlays are **STRICTLY PROHIBITED**.
- Every form page provides clear bottom action buttons:
  - **Save / Submit:** Executes validation/action and redirects back to table view.
  - **Cancel:** Discards state and safely routes back to parent table view.

---

## 2. Responsive Breakpoints & Viewport Architecture

- **Mobile Viewport:** `320px` to `767px` (Primary target layout: single column, stack cards, touch scroll).
- **Tablet Viewport:** `768px` to `1023px` (Adaptive 2-column grids).
- **Desktop Viewport:** `1024px+` (Multi-column grids, expanded data table views).
- **Scroll Clearance:** Enforce `$bottom-nav-clearance: 9rem` (`pb-36`) on all scroll containers so content never clips behind mobile bottom chrome or fixed action bars.
