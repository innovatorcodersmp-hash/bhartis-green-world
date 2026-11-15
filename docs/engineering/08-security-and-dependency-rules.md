# 08. Security & Dependency Governance Rules
**Project:** Bharti's Green World ERP (Kolhapur)  
**Author / Lead Architect:** Saniya Patil  
**Enforcement Level:** MANDATORY SECURITY & PWA COMPLIANCE AUDIT  

---

## 1. Third-Party Dependency & PWA Vetting

1. **Approved Stack:** Next.js (App Router), `sass`, `zod`, `@tanstack/react-table`, `lucide-react`, `html5-qrcode`, `@prisma/client`, `@ducanh2912/next-pwa` (or standard Web Manifest + Service Worker).
2. **PWA Manifest Security:** Web Manifest must enforce secure HTTPS origins, `standalone` display mode, and proper icon asset declarations.
3. **Security:** Zero high/critical npm vulnerabilities allowed.
