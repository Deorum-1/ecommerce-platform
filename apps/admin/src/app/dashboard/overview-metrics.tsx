"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { useAdminApi } from "@/lib/admin-api";

type Overview = {
  revenue: number;
  orders: number;
  products: number;
  currency: string;
  lowStock: { id: string; name: string; inventoryQuantity: number }[];
};
export default function OverviewMetrics() {
  const { isLoaded, orgId } = useAuth();
  const api = useAdminApi();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setData(await api("/admin/overview")); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load store metrics."); }
  }, [api]);
  useEffect(() => { if (isLoaded && orgId) void load(); }, [isLoaded, orgId, load]);
  return <section className="mb-6">
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-3">
      {[["Revenue", data ? `${data.currency} ${data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"], ["Orders", data?.orders ?? "—"], ["Products", data?.products ?? "—"]].map(([label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p></article>)}
    </div>
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between"><h2 className="font-semibold text-slate-950">Low stock</h2><Link href="/dashboard/catalog" className="text-sm font-medium text-indigo-700 hover:underline">Manage products</Link></div>
      {data?.lowStock.length ? <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{data.lowStock.slice(0, 6).map((product) => <li key={product.id} className="flex justify-between rounded-lg bg-amber-50 px-3 py-2"><span>{product.name}</span><span className="font-semibold text-amber-800">{product.inventoryQuantity} left</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">{data ? "All products are above the low-stock threshold." : "Loading inventory…"}</p>}
    </div>
  </section>;
}
