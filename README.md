# Multi-Tenant E-Commerce SaaS Platform

A modern multi-tenant e-commerce platform built for the Nigerian market.  
Shopping companies can register, get their own admin dashboard + storefront, upload products in bulk, accept Paystack payments, and manage orders. Companies pay a monthly subscription.

---

## Quick Start for AI / Developers

This project is designed to be built **step by step with AI assistance**.

### 1. Always start here
Read the files inside the `context/` folder **in order**:

| File | Purpose |
|------|---------|
| `context/01-OVERVIEW.md` | What we are building and why |
| `context/02-TECH-STACK.md` | Locked technology decisions |
| `context/03-PHASES.md` | Phase 1 vs Phase 2 scope |
| `context/04-PRICING.md` | Pricing model |
| `context/05-FEATURES.md` | Feature priorities |
| `context/06-CURRENT-STATUS.md` | Current state of the project |

### 2. Detailed Documents
- [Full Pricing Strategy](./docs/PRICING_STRATEGY.md)
- [Detailed Phases & Steps](./docs/PHASES.md)
- [Original Step-by-Step Guide](./docs/STEP_BY_STEP.md)
- [What I Need From You](./WHAT_I_NEED_FROM_YOU.md)

---

## Project Structure (Target)

```
ecommerce-platform/
├── apps/
│   ├── web/          # Customer storefront (Next.js)
│   ├── admin/        # Admin dashboard (Next.js)
│   └── api/          # Backend (NestJS)
├── packages/
│   ├── database/     # Prisma schema & client
│   ├── ui/           # Shared UI components
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Shared configs
│   └── utils/        # Shared helpers
├── context/          # AI-friendly project context (start here)
├── docs/             # Detailed documentation
├── docker/           # Optional local development
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## Current Status

**Phase**: Phase 1 foundation
**Next Step**: Begin Phase 2 backend foundation; see `context/06-CURRENT-STATUS.md`

### Local infrastructure

Start the local PostgreSQL and Redis services with `docker compose up -d`.
Copy `.env.example` to `.env` and use the local database and Redis URLs shown
there when developing against Docker. Then generate the Prisma client and apply
the initial migration:

```bash
pnpm --filter @repo/database run db:generate
pnpm --filter @repo/database run db:migrate
```

---

## How to Work With AI

When asking AI to continue development, always say:

> "Read the context folder first, especially 01-OVERVIEW.md to 06-CURRENT-STATUS.md, then continue from the current status."

This keeps the AI aligned with all previous decisions.
