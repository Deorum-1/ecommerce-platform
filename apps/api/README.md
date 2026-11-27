# API

The NestJS API reads environment variables from the workspace-root `.env` via
`ConfigModule`. Configure Neon with `DATABASE_URL` (pooled) and `DIRECT_URL`
(direct), and configure Upstash with `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`. The Upstash client is initialized on first use, so
local API startup does not require cloud credentials.

Inject `PrismaService` for database access. It uses the generated client from
`@repo/database` and disconnects during application shutdown.

## Authentication and tenant-scoped routes

`ClerkAuthGuard` verifies bearer session tokens against `CLERK_SECRET_KEY` and
the configured `ADMIN_URL`. `TenantGuard` resolves the verified active Clerk
organization to a database tenant, and `TenantContext` exposes the resulting
tenant ID to request-scoped providers. Never derive tenant identity from a
client-supplied header.

```ts
@UseGuards(ClerkAuthGuard, TenantGuard)
@Controller('products')
export class ProductsController {}
```

`POST /auth/register-company` creates a Clerk organization and maps it to a
tenant, adding the signed-in user as owner. `POST /tenants/invitations` is
restricted to Clerk's `org:admin` role and sends `org:member` invitations.
Apply `RolesGuard` with `@Roles('org:admin')` to owner-only actions. The Clerk
application must have Organizations enabled and retain these default role keys.

Tenant-owned Prisma models store `tenantId`, use tenant-scoped unique
constraints, and enforce tenant-consistent relations between related records.

## Store administration

The authenticated admin API exposes tenant-scoped order, customer, overview,
analytics, discount, and store-settings data. Product creation and editing use
the `/catalog/products` endpoints. Mutations to discounts and store settings
require the active Clerk user to have the `org:admin` role. Apply committed
Prisma migrations and regenerate the client after schema changes:

```sh
pnpm --filter @repo/database db:migrate
pnpm --filter @repo/database db:generate
```

Coupon codes can be created, activated, and deleted in the admin. Checkout
does not yet validate or apply coupon codes. Store logos are configured using
an HTTPS image URL; image upload is not part of store settings.
