# Admin dashboard

The admin app uses Clerk for sign-up, sign-in, session management, organization
selection, and sign-out. Copy the workspace `.env.example` to `.env` and set
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ADMIN_URL`, and
`NEXT_PUBLIC_API_URL`.

Enable Organizations in the Clerk Dashboard and keep the default organization
roles: `org:admin` is the company owner and `org:member` is staff. Configure
Clerk invitation emails for the application. New users sign up at `/sign-up`,
then create their company at `/onboarding/create-company`. Owners invite staff
from `/dashboard/team`; API authorization enforces the role even if a staff
member navigates to that page directly.

Run the app from the workspace root with:

```sh
pnpm --filter @repo/admin dev
```
