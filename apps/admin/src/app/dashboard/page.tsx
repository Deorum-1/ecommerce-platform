"use client";

import Link from "next/link";
import {
  OrganizationSwitcher,
  UserButton,
  useAuth,
  useOrganization,
} from "@clerk/nextjs";
import OverviewMetrics from "./overview-metrics";

export default function DashboardPage() {
  const { isLoaded, orgId, orgRole } = useAuth();
  const { organization, isLoaded: organizationLoaded } = useOrganization();

  if (!isLoaded || !organizationLoaded) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-5 sm:p-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-10 w-40 rounded-xl bg-slate-200" />
          <div className="mt-10 h-56 rounded-3xl bg-slate-200" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="h-48 rounded-3xl bg-slate-200" />
            <div className="h-48 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!orgId || !organization) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] px-5 py-12">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
        <section className="relative w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_24px_70px_rgba(30,41,59,.09)] sm:p-10">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#5b5ce2] text-lg font-semibold text-white shadow-[0_8px_24px_rgba(91,92,226,.25)]">
            S
          </span>
          <p className="mt-8 text-sm font-semibold text-indigo-600">
            Welcome to Store Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Choose a workspace to continue
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Create a company workspace or accept an invitation to get started.
          </p>
          <Link
            className="mt-7 inline-flex rounded-xl bg-[#5b5ce2] px-5 py-3 font-semibold text-white shadow-[0_8px_24px_rgba(91,92,226,.18)] hover:bg-[#4546bb]"
            href="/onboarding/create-company"
          >
            Create a company
          </Link>
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Have another workspace?
            </p>
            <OrganizationSwitcher createOrganizationUrl="/onboarding/create-company" />
          </div>
        </section>
      </main>
    );
  }

  const isOwner = orgRole === "org:admin";

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#172033] px-4 py-6 text-white lg:flex">
        <Link className="flex items-center gap-3 px-3" href="/dashboard">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5b5ce2] font-semibold">
            S
          </span>
          <span className="font-semibold tracking-tight">Store Admin</span>
        </Link>

        <p className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">
          Workspace
        </p>
        <nav aria-label="Main navigation" className="space-y-1">
          <Link
            aria-current="page"
            className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-medium text-white"
            href="/dashboard"
          >
            <svg
              aria-hidden="true"
              className="h-[18px] w-[18px] text-indigo-300"
              fill="none"
              viewBox="0 0 24 24"
            >
              <rect
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.7"
                width="7"
                x="3.5"
                y="3.5"
              />
              <rect
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.7"
                width="7"
                x="13.5"
                y="3.5"
              />
              <rect
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.7"
                width="7"
                x="3.5"
                y="13.5"
              />
              <rect
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.7"
                width="7"
                x="13.5"
                y="13.5"
              />
            </svg>
            Overview
          </Link>
          <Link
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            href="/dashboard/catalog"
          >
            Catalog
          </Link>
          <Link className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white" href="/dashboard/orders">Orders</Link>
          <Link className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white" href="/dashboard/customers">Customers</Link>
          <Link className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white" href="/dashboard/discounts">Discounts</Link>
          <Link className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white" href="/dashboard/analytics">Analytics</Link>
          <Link className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white" href="/dashboard/settings">Store settings</Link>
          {isOwner && (
            <Link
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              href="/dashboard/team"
            >
              <svg
                aria-hidden="true"
                className="h-[18px] w-[18px]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m11-14.75a3.25 3.25 0 0 1 0 6.5M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M10 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
              Team
            </Link>
          )}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.04] p-3">
          <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
            Switch workspace
          </p>
          <OrganizationSwitcher
            afterSelectOrganizationUrl="/dashboard"
            createOrganizationUrl="/onboarding/create-company"
          />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex flex-col border-b border-slate-200/80 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-0 sm:pl-8 sm:pr-8">
          <div className="flex h-11 items-center justify-between sm:h-[72px]">
            <div className="flex items-center gap-3">
              <Link
                className="flex items-center gap-2.5 lg:hidden"
                href="/dashboard"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#5b5ce2] text-sm font-semibold text-white">
                  S
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  Store Admin
                </span>
              </Link>
              <span className="hidden text-sm text-slate-500 lg:block">
                Workspace overview
              </span>
            </div>
            <div className="sm:hidden">
              <UserButton />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 pb-1 sm:pb-0">
            <div className="lg:hidden">
              <OrganizationSwitcher
                afterSelectOrganizationUrl="/dashboard"
                createOrganizationUrl="/onboarding/create-company"
              />
            </div>
            {isOwner && (
              <Link
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 sm:hidden"
                href="/dashboard/team"
              >
                Team
              </Link>
            )}
            <Link
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 sm:hidden"
              href="/dashboard/catalog"
            >
              Catalog
            </Link>
            <Link className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 sm:hidden" href="/dashboard/orders">Orders</Link>
            <div className="hidden sm:block">
              <UserButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Good to have you here
              </p>
              <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-950">
                Overview
              </h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Workspace active
            </div>
          </div>

          <OverviewMetrics />

          <section className="relative overflow-hidden rounded-3xl bg-[#172033] p-6 text-white shadow-[0_18px_48px_rgba(23,32,51,.14)] sm:p-9">
            <div className="absolute -right-12 -top-32 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute -bottom-36 right-1/4 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-7">
              <div className="flex min-w-0 items-center gap-5">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-2xl font-semibold text-indigo-200">
                  {organization.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-indigo-200">
                    {isOwner ? "Owner workspace" : "Team workspace"}
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                    {organization.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Your company workspace is ready to use.
                  </p>
                </div>
              </div>
              {isOwner && (
                <Link
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-50"
                  href="/dashboard/team"
                >
                  Invite a teammate
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(30,41,59,.035)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-950">
                    Your workspace
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    A quick look at your company access.
                  </p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 20h16M6 20V7.5L12 4l6 3.5V20M9 10h.01M15 10h.01M9 13h.01M15 13h.01M10 20v-3h4v3"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-6 divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Company
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Your active organization
                    </p>
                  </div>
                  <p className="max-w-[50%] truncate text-right text-sm font-medium text-slate-700">
                    {organization.name}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Your role
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Access level in this workspace
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {isOwner ? "Owner" : "Staff"}
                  </span>
                </div>
              </div>
            </section>

            <section className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(30,41,59,.035)] sm:p-7">
              <p className="text-lg font-semibold text-slate-950">
                {isOwner ? "Bring your team in" : "Your team access"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isOwner
                  ? "Invite the people who help run your store and give them secure access to this workspace."
                  : "You can work in this company workspace. Owners manage invitations and team access."}
              </p>
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f6f7ff] p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <svg
                    aria-hidden="true"
                    className="h-[18px] w-[18px]"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m11-14.75a3.25 3.25 0 0 1 0 6.5M10 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Role-based access
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Owners invite teammates; staff can access the workspace.
                  </p>
                </div>
              </div>
              {isOwner && (
                <Link
                  className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                  href="/dashboard/team"
                >
                  Manage team
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
