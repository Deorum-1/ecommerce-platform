"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { useAdminApi } from "@/lib/admin-api";

type Analytics = { currency: string; daily: { date: string; orders: number; revenue: number }[]; topProducts: { id?: string; name?: string; quantity: number }[] };
export default function AnalyticsPage() {
  const { isLoaded, orgId } = useAuth();
  const api = useAdminApi();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setData(await api("/admin/analytics")); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load analytics."); }
  }, [api]);
  useEffect(() => { if (isLoaded && orgId) void load(); }, [isLoaded, orgId, load]);
  const revenue = data?.daily.reduce((total, point) => total + point.revenue, 0) ?? 0;
  const orders = data?.daily.reduce((total, point) => total + point.orders, 0) ?? 0;
  return <section>
    <h2 className="text-2xl font-semibold text-slate-950">Analytics</h2>
    <p className="mt-1 text-sm text-slate-500">Store performance over the last 30 days.</p>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Revenue</p><p className="mt-2 text-2xl font-semibold">{(data?.currency || "NGN")} {revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Orders</p><p className="mt-2 text-2xl font-semibold">{orders}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Daily average</p><p className="mt-2 text-2xl font-semibold">{(revenue / 30).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></article>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Revenue by day</h3><div className="mt-5 flex h-48 items-end gap-1 border-b border-l border-slate-200 px-2">
        {(data?.daily || []).map((point) => { const max = Math.max(1, ...(data?.daily.map((entry) => entry.revenue) || [1])); return <div key={point.date} title={`${point.date}: ${point.revenue.toFixed(2)} (${point.orders} orders)`} className="min-w-1 flex-1 rounded-t bg-indigo-500 hover:bg-indigo-700" style={{ height: `${Math.max(3, (point.revenue / max) * 100)}%` }} />; })}
        {!data?.daily.length && <p className="m-auto text-sm text-slate-500">No order activity in this period.</p>}
      </div><p className="mt-3 text-xs text-slate-500">Daily bars show paid revenue; hover for daily order totals.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Top products</h3><ol className="mt-3 divide-y divide-slate-100">{(data?.topProducts || []).map((item, index) => <li key={item.id || index} className="flex justify-between py-3 text-sm"><span>{index + 1}. {item.name || "Product"}</span><span className="text-slate-500">{item.quantity} sold</span></li>)}
        {!data?.topProducts.length && <li className="py-4 text-sm text-slate-500">No product sales yet.</li>}</ol></div>
    </div>
  </section>;
}
