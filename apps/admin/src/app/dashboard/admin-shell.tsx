"use client";

import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const links = [
  ["Overview", "/dashboard"],
  ["Products", "/dashboard/catalog"],
  ["Orders", "/dashboard/orders"],
  ["Customers", "/dashboard/customers"],
  ["Discounts", "/dashboard/discounts"],
  ["Analytics", "/dashboard/analytics"],
  ["Store settings", "/dashboard/settings"],
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (
    pathname === "/dashboard" ||
    pathname === "/dashboard/catalog" ||
    pathname === "/dashboard/team"
  ) return children;

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#172033] px-4 py-6 text-white lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 font-semibold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5b5ce2]">S</span>Store Admin</Link>
        <p className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">Workspace</p>
        <nav aria-label="Main navigation" className="space-y-1">
          {links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)) ? "page" : undefined} className={`block rounded-xl px-3 py-3 text-sm transition ${pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)) ? "bg-white/10 font-medium text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>{label}</Link>)}
          <Link href="/dashboard/team" className="block rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white">Team</Link>
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.04] p-3"><p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">Switch workspace</p><OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" createOrganizationUrl="/onboarding/create-company" /></div>
      </aside>
      <div className="lg:pl-64">
        <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8">
          <Link href="/dashboard" className="font-semibold text-slate-900 lg:hidden">Store Admin</Link>
          <span className="hidden text-sm text-slate-500 lg:block">Store management</span>
          <div className="flex items-center gap-3"><div className="lg:hidden"><OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" createOrganizationUrl="/onboarding/create-company" /></div><UserButton /></div>
        </header>
        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <nav aria-label="Mobile navigation" className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {links.slice(1).map(([label, href]) => <Link key={href} href={href} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">{label}</Link>)}
          </nav>
          {children}
        </section>
      </div>
    </main>
  );
}
