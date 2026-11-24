# Development Phases

**Multi-Tenant E-Commerce SaaS Platform**  
Last Updated: 24 November 2026

This document defines the clear scope of **Phase 1** and **Phase 2**.  
It serves as the single source of truth for what should be built now versus later.

---

## Guiding Principles

- **Phase 1** = Minimum viable product that real companies can use and pay for.
- **Phase 2** = Improvements and advanced features that make the platform stronger and more competitive.
- Solo builder friendly — each phase is broken into clear, sequential steps.
- Focus first on the core pain points: easy registration, bulk product upload, and reliable orders + payments.

---

## Phase 1 — Launch Ready (Core Platform)

**Goal**: A working multi-tenant platform where shopping companies can register, upload products (including via CSV), manage orders, accept Paystack payments, and go live with a basic store.

**Target Outcome**: First 3–5 paying companies can run real stores.

### Phase 1 Scope

| Area                        | Included in Phase 1                          | Notes |
|----------------------------|----------------------------------------------|-------|
| Multi-tenancy              | Yes                                          | Full tenant isolation |
| Company Registration       | Yes                                          | Onboarding flow |
| Authentication             | Yes (Clerk)                                  | Owner + Staff roles |
| Product Management         | Yes                                          | CRUD + Variants |
| Bulk Upload (CSV/Excel)    | Yes                                          | Core differentiator |
| Inventory                  | Yes (basic)                                  | Stock quantity |
| Orders                     | Yes                                          | Full order lifecycle |
| Paystack Payments          | Yes                                          | Primary payment method |
| Discounts / Coupons        | Yes (basic)                                  | Percentage & fixed |
| Multi-currency             | Yes (basic)                                  | NGN primary + others |
| Admin Dashboard            | Yes                                          | Clean & functional |
| Customer Storefront        | Yes                                          | Basic but usable |
| Email Notifications        | Yes                                          | Order confirmations |
| SMS Notifications          | Yes (basic)                                  | Critical local need |
| Analytics                  | Yes (basic)                                  | Revenue, orders, top products |
| Custom Domains             | Preparation only                             | Full support in Phase 2 |
| Delivery / Shipping        | Basic (manual zones)                         | Simple zone-based rates |
| SaaS Billing               | Yes                                          | Subscription plans for tenants |
| Staff Roles                | Yes (Owner + Staff)                          | Simple permissions |

### Phase 1 – Detailed Steps

#### 1. Foundation
1. Set up Turborepo monorepo
2. Create apps: `web` (storefront), `admin`, `api` (NestJS)
3. Set up shared packages (`database`, `ui`, `types`, `config`)
4. Configure Neon (PostgreSQL) + Upstash (Redis)
5. Set up Prisma schema with multi-tenancy (`tenantId` on all relevant models)
6. Implement TenantGuard and request scoping

#### 2. Authentication & Tenancy
1. Integrate Clerk
2. Company registration flow (create Tenant + Owner user)
3. Login / Logout
4. Basic staff invitation (Owner can add staff)
5. Role-based access (Owner vs Staff)

#### 3. Core Catalog
1. Categories
2. Products (with variants: size, color, etc.)
3. Inventory management (stock quantity)
4. Product images via Cloudinary
5. **Bulk CSV / Excel upload** (with validation + error report)
6. Sample / mock product data for testing

#### 4. Orders & Checkout
1. Cart (storefront)
2. Checkout flow
3. Order creation & status management
4. Paystack integration (initialize + verify payments)
5. Order confirmation emails
6. Basic SMS notifications (order placed / paid)

#### 5. Admin Experience
1. Dashboard overview (sales, orders, low stock)
2. Products list + create/edit
3. Orders list + order detail
4. Customers list (basic)
5. Discounts / Coupons
6. Basic analytics (revenue, orders, top products)
7. Store settings (logo, currency, basic info)

#### 6. Delivery (Basic)
1. Delivery zones (e.g. Lagos, Abuja, Other States)
2. Flat or zone-based pricing
3. Estimated delivery days
4. Show shipping cost at checkout

#### 7. SaaS Billing
1. Subscription plans (Starter, Growth, Business)
2. Paystack subscription or recurring billing
3. Plan limits enforcement (products, staff, etc.)
4. Billing page in Admin

#### 8. Polish & Launch Prep
1. Responsive design (mobile-friendly admin)
2. Error handling & loading states
3. Basic security (rate limiting, input validation)
4. Seed data + demo store
5. Documentation for first users

**Phase 1 Exit Criteria**
- A new company can register and have a working store in under 15–20 minutes
- Bulk product upload works reliably
- Real orders can be placed and paid via Paystack
- Owner can manage products, orders, and basic delivery settings
- Platform can charge the company a monthly subscription

---

## Phase 2 — Strength & Scale

**Goal**: Make the platform significantly more powerful, reduce manual work, and improve conversion & retention.

### Phase 2 Scope

| Area                        | Phase 2 Focus |
|----------------------------|---------------|
| Delivery / Shipping        | Advanced zones, weight-based, logistics integrations |
| Custom Domains             | Full support + easy setup |
| Notifications              | Better SMS templates, more triggers, email sequences |
| Analytics                  | Deeper insights, date filters, export |
| Staff & Permissions        | More granular roles |
| Inventory                  | Low stock alerts, variants inventory improvements |
| Marketing                  | Abandoned cart, better discount rules |
| Performance                | Caching, search improvements |
| Multi-store / Advanced     | Better multi-currency handling, tax settings |
| Admin UX                   | Faster tables, bulk actions, better mobile experience |
| Onboarding                 | Guided setup checklist, sample data wizard |

### Phase 2 – Recommended Steps

#### 1. Advanced Delivery
1. Weight / item-based shipping rates
2. More flexible zone system (by state + city)
3. Integration-ready structure for GIG, Kwik, DHL, etc.
4. Store pickup option
5. Shipping labels / tracking number field

#### 2. Custom Domains
1. Domain connection flow in Admin
2. DNS instructions
3. Automatic SSL handling
4. Domain status monitoring

#### 3. Notifications & Communication
1. Better SMS templates (order status, low stock, etc.)
2. Email templates with branding
3. Notification preferences per tenant
4. Abandoned cart emails/SMS (basic)

#### 4. Deeper Analytics
1. Date range filters
2. Sales by product / category / variant
3. Customer insights
4. Export to CSV
5. Simple revenue forecasting

#### 5. Better Catalog & Inventory
1. Improved variant management
2. Low stock alerts (email + SMS)
3. Bulk edit products
4. Product import improvements (better mapping + history)

#### 6. Admin Experience Improvements
1. Faster data tables with filters & search
2. Bulk actions (delete, update status, etc.)
3. Better mobile admin experience
4. Activity log (who did what)

#### 7. Growth Features
1. More advanced discount rules
2. Gift cards / store credit (optional)
3. Customer accounts improvements
4. Basic SEO tools for the storefront

#### 8. Platform Hardening
1. Better error monitoring
2. Usage limits & soft/hard enforcement
3. Improved onboarding checklist
4. Performance optimization (caching, database indexes)

---

## What Is Explicitly Out of Scope (For Now)

- Mobile app
- Multi-language
- Advanced marketplace features (vendors selling on one storefront)
- Complex ERP / accounting integrations
- AI features
- Crypto payments (can be explored later)

---

## Summary Timeline Suggestion (Solo Builder)

| Phase     | Focus                          | Rough Duration (part-time) |
|-----------|--------------------------------|----------------------------|
| Phase 1   | Core platform + launch         | 8–14 weeks                 |
| Phase 2   | Delivery depth + polish        | 6–10 weeks                 |

These are estimates. Actual speed depends on consistency and how many decisions are locked early.

---

## How to Use This Document

- Treat **Phase 1** as the current definition of “done” for the first launch.
- Do not start Phase 2 features until Phase 1 exit criteria are met.
- Review this document after the first 3 paying customers and adjust priorities if needed.

**Status**: Active  
**Next Review**: After first paying customers
