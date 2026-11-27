# Multi-Tenant E-Commerce SaaS Platform

A modern multi-tenant e-commerce platform built for the Nigerian market.  
Shopping companies can register, get their own admin dashboard + storefront, upload products in bulk, accept Paystack payments, and manage orders. Companies pay a monthly subscription.

---

## Quick Start for AI / Developers

This project is designed to be built **step by step with AI assistance**.

### 1. Always start here

Read the files inside the `context/` folder **in order**:

| File                           | Purpose                      |
| ------------------------------ | ---------------------------- |
| `context/01-OVERVIEW.md`       | What we are building and why |
| `context/02-TECH-STACK.md`     | Locked technology decisions  |
| `context/03-PHASES.md`         | Phase 1 vs Phase 2 scope     |
| `context/04-PRICING.md`        | Pricing model                |
| `context/05-FEATURES.md`       | Feature priorities           |
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

**Phase**: Phase 4 — Orders & Checkout implemented
**Next Step**: Apply the order migration and configure test credentials to exercise checkout.

### Database and Redis

Copy `.env.example` to `.env` and set `DATABASE_URL` to Neon's pooled
connection string and `DIRECT_URL` to its direct connection string. Prisma
uses the direct connection for migrations. Set `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` from Upstash for API cache access.

For local development without cloud accounts, start the services with
`docker compose up -d` and set `DATABASE_URL` and `DIRECT_URL` to the Docker
PostgreSQL URL examples in `.env.example`. The API can start without Upstash
credentials; Redis operations require the Upstash REST variables.
Generate the Prisma client and apply the initial migration:

```bash
pnpm --filter @repo/database run db:generate
pnpm --filter @repo/database run db:migrate
```

### Authentication and staff access

Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env`, then
enable Organizations in the Clerk Dashboard. Set the membership mode to
**optional** so new users can sign in before creating a company through the
custom onboarding flow. Set the creator role to `org:admin` and the default
member role to `org:member`; registration creates the organization with the
registering user as its creator, and invitations assign staff `org:member`.
Owners can invite staff from the dashboard. These roles are enforced by the
API, not only hidden in the admin UI.

The API verifies Clerk bearer tokens and maps the token's active organization
to a tenant. Tenant identity is never accepted from a request header.

### Orders, checkout, and notifications

Set `PAYSTACK_SECRET_KEY` in the root `.env.local`; use a Paystack test key
until ready for live payments. Configure the Paystack webhook to
`https://<api-host>/payments/paystack/webhook`. The API verifies Paystack
transactions and webhook signatures before marking an order paid.

Configure SMTP with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`,
and `SMTP_FROM` for order confirmation email. Configure `TERMII_API_KEY` and
`TERMII_SENDER_ID` for order-placed and payment-confirmed SMS. Notifications
are skipped with a server warning when their provider is not configured.

Copy `apps/web/.env.example` to `apps/web/.env.local`, set
`NEXT_PUBLIC_STOREFRONT_TENANT_SLUG` to the slug created during company
registration, and keep `NEXT_PUBLIC_API_URL` pointed at the API. For a quick
local preview, the storefront also accepts `?store=<tenant-slug>`.

---

## How to Work With AI

When asking AI to continue development, always say:

> "Read the context folder first, especially 01-OVERVIEW.md to 06-CURRENT-STATUS.md, then continue from the current status."

This keeps the AI aligned with all previous decisions.
