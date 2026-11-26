"use client";

import Link from "next/link";
import {
  OrganizationSwitcher,
  UserButton,
  useAuth,
  useOrganization,
} from "@clerk/nextjs";

export default function DashboardPage() {
  const { isLoaded, orgId, orgRole } = useAuth();
  const { organization, isLoaded: organizationLoaded } = useOrganization();

  if (!isLoaded || !organizationLoaded) {
    return <main className="p-8 text-slate-600">Loading your store...</main>;
  }

  if (!orgId || !organization) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
        <h1 className="text-3xl font-semibold text-slate-950">
          No store selected
        </h1>
        <p className="mt-3 text-slate-600">
          Create a company or open the invitation sent to your email.
        </p>
        <Link
          className="mt-6 w-fit rounded-lg bg-slate-950 px-5 py-3 text-white"
          href="/onboarding/create-company"
        >
          Create a company
        </Link>
        <div className="mt-6">
          <OrganizationSwitcher createOrganizationUrl="/onboarding/create-company" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#172033] px-4 py-6 text-white lg:flex">
        <Link className="flex items-center gap-3 px-3" href="/dashboard">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5b5ce2] font-semibold">S</span>
          <span className="font-semibold">Store Admin</span>
        </Link>
        <nav className="mt-10 space-y-1">
          <Link className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-medium" href="/dashboard">
            <span className="h-2 w-2 rounded-full bg-indigo-300" /> Overview
          </Link>
          {orgRole === "org:admin" && (
            <Link className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/dashboard/team">
              <span className="h-2 w-2 rounded-full border border-slate-400" /> Team
            </Link>
          )}
        </nav>
        <div className="mt-auto px-3">
          <OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" createOrganizationUrl="/onboarding/create-company" />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8">
          <div className="lg:hidden">
            <OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" createOrganizationUrl="/onboarding/create-company" />
          </div>
          <p className="hidden text-sm text-slate-500 lg:block">Workspace overview</p>
          <UserButton />
        </header>

        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-indigo-600">{orgRole === "org:admin" ? "Store owner" : "Staff workspace"}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{organization.name}</h1>
            </div>
            {orgRole === "org:admin" && (
              <Link className="rounded-xl bg-[#5b5ce2] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(91,92,226,.18)] hover:bg-[#4546bb]" href="/dashboard/team">
                Invite staff
              </Link>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total revenue", "$24,860", "+18.4%", "bg-indigo-50 text-indigo-700"],
              ["Orders", "1,240", "+12.6%", "bg-emerald-50 text-emerald-700"],
              ["Customers", "892", "+8.2%", "bg-amber-50 text-amber-700"],
              ["Conversion", "3.8%", "+0.6%", "bg-sky-50 text-sky-700"],
            ].map(([label, value, change, tone]) => (
              <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(30,41,59,.04)]">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
                <span className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{change} this month</span>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(30,41,59,.04)] sm:p-6">
              <div className="flex items-center justify-between">
                <div><p className="font-semibold text-slate-950">Store performance</p><p className="mt-1 text-sm text-slate-500">Revenue over the last 8 weeks</p></div>
                <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">Last 8 weeks</span>
              </div>
              <div className="mt-8 flex h-52 items-end gap-3 border-b border-slate-100">
                {[38,52,47,65,58,74,69,88].map((height, index) => (
                  <div key={index} className="group relative flex-1">
                    <div className="rounded-t-lg bg-[#dfe1ff] group-hover:bg-[#7778e9]" style={{ height: `${height * 1.7}px` }} />
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-[#172033] p-6 text-white shadow-[0_12px_36px_rgba(23,32,51,.12)]">
              <p className="text-sm text-slate-300">Quick setup</p>
              <p className="mt-2 text-xl font-semibold">Your store is ready</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">Invite your team and start managing the workspace together.</p>
              {orgRole === "org:admin" && <Link className="mt-6 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-indigo-50" href="/dashboard/team">Manage team</Link>}
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
