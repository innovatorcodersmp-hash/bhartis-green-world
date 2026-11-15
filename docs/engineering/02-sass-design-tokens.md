# 02. SASS Design Tokens & Styling Architecture
**Project:** Bharti's Green World ERP (Kolhapur)  
**Author / Lead Architect:** Saniya Patil  
**Styling Framework:** SASS/SCSS Modules + Global Token Variables  

---

## 1. Directory Structure & Import Rules

All design tokens, variables, and mixins reside in `@/styles/`:

```text
src/
└── styles/
    ├── abstract/
    │   ├── _variables.scss      <-- Single source of truth for design tokens
    │   ├── _mixins.scss         <-- Responsive breakpoints, flexbox, PWA mixins
    │   └── _functions.scss      
    ├── base/
    │   ├── _reset.scss          <-- PWA touch normalization
    │   └── _typography.scss     
    └── globals.scss             
```

---

## 2. Centralized Design Tokens (`_variables.scss`)

```scss
// ============================================================================
// BHARTI'S GREEN WORLD - GLOBAL DESIGN TOKENS
// ============================================================================

// 1. BRAND PALETTE (Forest Green PWA Theme)
$color-primary:          #1B4D3E; // Forest Green (Header, main actions)
$color-primary-hover:    #13392E; 
$color-primary-light:    #E8F2EE; // Soft Sage tint
$color-secondary:        #2E7D32; 

// 2. NEUTRALS & BACKGROUNDS
$color-bg-main:          #F8FAF9; 
$color-surface:          #FFFFFF; 
$color-border:           #E5E7EB; 
$color-border-dark:      #D1D5DB; 

// 3. TYPOGRAPHY / TEXT COLORS
$color-text-main:        #1F2937; 
$color-text-muted:       #6B7280; 
$color-text-inverse:     #FFFFFF; 

// 4. STATUS & METRIC INDICATORS
$color-success:          #16A34A; 
$color-warning:          #D97706; 
$color-danger:           #DC2626; 
$color-info:             #2563EB; 

// 5. TYPOGRAPHY SCALES (16px base prevents mobile auto-zoom)
$font-family-base:       system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
$font-size-xs:           0.75rem;   // 12px
$font-size-sm:           0.875rem;  // 14px
$font-size-base:         1rem;      // 16px (PWA mobile standard input text)
$font-size-lg:           1.125rem;  // 18px
$font-size-xl:           1.375rem;  // 22px
$font-size-2xl:          1.75rem;   // 28px

// 6. LAYOUT & PWA TOUCH DIMENSIONS
$header-height:          58px;     
$bottom-nav-clearance:   9rem;     // Equal to pb-36 clearance
$min-touch-target:       44px;     // Minimum PWA touch target size
$border-radius-sm:       6px;      
$border-radius-md:       10px;     
$border-radius-lg:       16px;     

// 7. RESPONSIVE BREAKPOINTS
$breakpoint-sm:          576px;
$breakpoint-md:          768px;
$breakpoint-lg:          1024px;
$breakpoint-xl:          1280px;
```

---

## 3. Global Responsive & PWA Mixins (`_mixins.scss`)

```scss
@import 'variables';

@mixin mobile-only {
  @media (max-width: #{$breakpoint-md - 1px}) { @content; }
}

@mixin tablet-up {
  @media (min-width: #{$breakpoint-md}) { @content; }
}

@mixin desktop-up {
  @media (min-width: #{$breakpoint-lg}) { @content; }
}

@mixin touch-target {
  min-height: $min-touch-target;
  min-width: $min-touch-target;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@mixin card-surface {
  background-color: $color-surface;
  border: 1px solid $color-border;
  border-radius: $border-radius-md;
  box-shadow: $shadow-sm;
}
```
