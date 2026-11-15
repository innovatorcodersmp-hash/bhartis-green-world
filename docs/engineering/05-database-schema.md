# 05. Database Schema, PK Rules & Indexing Strategy
**Project:** Bharti's Green World ERP (Kolhapur)  
**Author / Lead Architect:** Saniya Patil  
**Engine:** Prisma ORM / PostgreSQL  

---

## 1. Universal Table Architectural Rules

1. **Mandatory Audit & Lifecycle Fields:** Every table MUST include `status` (`ACTIVE`, `INACTIVE`, `ARCHIVED`), `createdAt`, and `updatedAt`.
2. **Primary Key Strategy:** UUIDs for core entities (Customer, Vendor, Employee), Human Business Keys (`Plant.sku`, `PosBill.billNumber`), and Auto-Increment Integers for lightweight join tables (`PosItemLine`, `ContractMaterial`).
3. **Mandatory Indexing (`@@index`):** Explicit indexes on foreign keys, phone numbers, categories, and audit timestamps.
