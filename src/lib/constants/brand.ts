/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/lib/constants/brand.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * Centralized brand metadata, official nursery contact details, and address registry.
 * Replaces hardcoded placeholder details with official visiting card credentials.
 * 
 * ----------------------------------------------------------------------------
 */

export const NURSERY_BRAND = {
  name: "Bharti's Green World",
  fullName: "Bharti's Green World Nursery & Landscaping",
  tagline: "Plant Nursery & Landscape Architecture",
  address: "Bambarwadi, Tal. Panhala, Dist. Kolhapur",
  fullAddress: "Bambarwadi, Tal. Panhala, Dist. Kolhapur, Maharashtra, India",
  locationDisplay: "Bambarwadi, Tal. Panhala, Dist. Kolhapur",
  phone: "+91 85307 91085",
  phoneDisplay: "+91 85307 91085",
  rawPhone: "918530791085",
  email: "contact@bhartisgreenworld.com",
  inquiriesEmail: "bhartisgreenworld@gmail.com",
} as const;

export default NURSERY_BRAND;

