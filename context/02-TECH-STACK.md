# Tech Stack (Locked)

| Layer                  | Technology                          | Notes |
|------------------------|-------------------------------------|-------|
| Monorepo               | Turborepo + pnpm                    | Recommended |
| Customer Storefront    | Next.js 15                          | App Router |
| Admin Dashboard        | Next.js 15 (separate app)           | Separate from storefront |
| Backend API            | NestJS (TypeScript)                 | Multi-tenancy + business logic |
| Database               | PostgreSQL (Neon recommended)       | Strong relational support |
| ORM                    | Prisma                              | Type-safe |
| Cache & Jobs           | Redis (Upstash) + BullMQ            | Caching + background jobs |
| Authentication         | Clerk                               | Multi-tenant friendly |
| Payments               | Paystack (primary)                  | Best for Nigeria |
| File / Image Storage   | Cloudinary                          | Product images |
| Styling                | Tailwind CSS + Shadcn/UI            | Simple & functional |
| Hosting                | Vercel (frontends) + Railway (API)  | Recommended |
| Email                  | Resend or similar                   | Transactional |
| SMS                    | Termii / Africa's Talking           | To be decided |

## Database Strategy
- **Recommended**: Neon (PostgreSQL) + Upstash (Redis) → No Docker needed
- **Optional**: Docker for local PostgreSQL + Redis

## Key Architectural Decisions
- Multi-tenancy via `tenantId` on all relevant tables
- Separate apps for Storefront (`web`) and Admin (`admin`)
- Shared packages for database, UI, types, and utils
- Background jobs for bulk uploads and notifications
