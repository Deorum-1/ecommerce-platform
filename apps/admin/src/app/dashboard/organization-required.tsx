"use client";

import Link from "next/link";
import { OrganizationSwitcher } from "@clerk/nextjs";

export default function OrganizationRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_24px_70px_rgba(30,41,59,.09)] sm:p-10">
        <p className="text-sm font-semibold text-indigo-600">
          Store workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Choose a workspace to continue
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Select an existing company workspace or create one to access this
          page.
        </p>
        <div className="mt-7">
          <OrganizationSwitcher
            afterSelectOrganizationUrl="/dashboard"
            createOrganizationUrl="/onboarding/create-company"
          />
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Need a new store?{" "}
          <Link
            className="font-semibold text-indigo-700 hover:underline"
            href="/onboarding/create-company"
          >
            Create a company
          </Link>
        </p>
      </section>
    </main>
  );
}
