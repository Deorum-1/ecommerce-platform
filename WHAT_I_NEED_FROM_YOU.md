# What I Need From You

This file tracks all decisions and requirements for the platform.  
**Status: Mostly Completed** (as of 24 November 2026)

---

## 1. Project Goals & Scope ✅ Completed

1. Is this platform meant to be:
   - [x] A public SaaS where other companies can register and pay you

2. How many shopping companies do you expect in the first 6–12 months?
   - Rough estimate: **5**

3. Do you want each company to have:
   - [x] Ability to connect their own custom domain later

4. What is the primary market? (Country / Region)
   - **Nigeria**

---

## 2. Technical Preferences ✅ Completed

| Decision                        | Final Choice                          | Notes |
|--------------------------------|---------------------------------------|-------|
| Backend language               | **NestJS (TypeScript)**               | Locked |
| Authentication                 | **Clerk**                             | Locked |
| Admin & Storefront             | **Separate apps**                     | Locked |
| Primary payment provider       | **Paystack**                          | Locked |
| Secondary payment (optional)   | Crypto (later)                        | Interested |
| File / Image storage           | **Cloudinary**                        | Locked |
| Hosting preference             | **Vercel + Railway**                  | Locked |
| Database                       | **Neon (PostgreSQL)**                 | Cloud-first |
| Redis / Cache                  | **Upstash**                           | Cloud-first |
| Docker                         | Optional only                         | Not required |

---

## 3. Features Priority ✅ Completed

| Feature                              | Priority     |
|--------------------------------------|--------------|
| Company registration & onboarding    | Must Have    |
| Bulk product upload (CSV/Excel)      | Must Have    |
| Product variants (size, color, etc.) | Must Have    |
| Inventory management                 | Must Have    |
| Order management                     | Must Have    |
| Discount / Coupon system             | Must Have    |
| Multi-currency                       | Must Have    |
| Analytics dashboard                  | Must Have    |
| Staff roles & permissions            | Must Have    |
| Email notifications                  | Must Have    |
| SMS notifications                    | Must Have    |
| Custom domains for stores            | Must Have    |
| Subscription billing (SaaS model)    | Must Have    |
| Customer accounts                    | Nice to Have |
| Multi-language                       | Not Needed   |
| Mobile app later                     | Not Needed   |

---

## 4. Accounts & Access You Need to Provide

### Required Soon (Phase 1–2)
- [ ] GitHub account (or create a new repository)
- [ ] **Neon** account (free) → for PostgreSQL
- [ ] **Upstash** account (free) → for Redis
- [ ] **Clerk** account (free) → for Authentication
- [ ] **Cloudinary** account (free) → for images
- [ ] **Paystack** account (test mode first)

### Required Later
- [ ] Domain name
- [ ] Resend / email service account
- [ ] SMS provider (Termii or Africa's Talking)
- [ ] Production hosting upgrades (if needed)

---

## 5. Branding & Design ✅ Completed

1. Do you already have:
   - Logo? → **No**
   - Brand colors? → **No**
   - Preferred font? → **No**
   - Existing website for inspiration? → **Jumia**

2. Design style preference:
   - [x] Simple & functional

3. Any reference websites you like?
   - Jumia

---

## 6. Data & Existing Assets ✅ Completed

1. Do you already have product data?
   - [x] No → We will use **mock data**

2. Need to migrate from an existing system?
   - No

---

## 7. Budget & Timeline Expectations

1. Target launch date?
   - Not yet decided

2. Are you building this:
   - [x] Solo (with my guidance)

3. Rough monthly budget for tools & hosting later?
   - Not specified

---

## 8. Legal & Business ✅ Completed

1. Will companies pay you a monthly/yearly fee to use the platform?
   - **Yes, definitely**

2. Do you need terms of service, privacy policy, and merchant agreement templates?
   - To be decided later

3. Any specific compliance requirements?
   - Not specified yet

---

## Summary of Locked Decisions

- Public SaaS for Nigerian market
- ~5 companies expected in year 1
- NestJS + PostgreSQL (Neon) + Prisma + Clerk + Paystack + Cloudinary
- Separate Admin + Storefront apps
- Cloud-first (Neon + Upstash) — Docker is optional
- Strong focus on bulk upload, multi-currency, SMS, analytics, and subscription billing

---

**Next Action**: Ready to start Phase 1 (Project setup + Database schema)
