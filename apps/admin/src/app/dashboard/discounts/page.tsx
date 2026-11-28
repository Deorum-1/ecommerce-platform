"use client";

import { useAuth } from "@clerk/nextjs";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminApi } from "@/lib/admin-api";

type Discount = { id: string; code: string; type: "PERCENTAGE" | "FIXED_AMOUNT"; value: string | number; active: boolean; usageCount: number; usageLimit: number | null; startsAt: string | null; endsAt: string | null };
export default function DiscountsPage() {
  const { isLoaded, orgId, orgRole } = useAuth();
  const api = useAdminApi();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<Discount["type"]>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try { setDiscounts(await api("/admin/discounts")); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load discounts."); }
  }, [api]);
  useEffect(() => { if (isLoaded && orgId) void load(); }, [isLoaded, orgId, load]);
  async function create(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/admin/discounts", { method: "POST", body: JSON.stringify({ code, type, value: Number(value) }) });
      setCode(""); setValue(""); setNotice("Coupon created."); setError(""); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create coupon."); }
  }
  async function toggle(item: Discount) {
    try { await api(`/admin/discounts/${item.id}`, { method: "PATCH", body: JSON.stringify({ active: !item.active }) }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update coupon."); }
  }
  async function remove(item: Discount) {
    if (!window.confirm(`Delete coupon ${item.code}?`)) return;
    try { await api(`/admin/discounts/${item.id}`, { method: "DELETE" }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete coupon."); }
  }
  const canManage = orgRole === "org:admin";
  return <section>
    <h2 className="text-2xl font-semibold text-slate-950">Discounts & coupons</h2>
    <p className="mt-1 text-sm text-slate-500">Create codes and control whether they are available.</p>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-4 text-sm text-emerald-700">{notice}</p>}
    {canManage && <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
      <label className="text-sm font-medium">Coupon code<input required maxLength={40} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="SUMMER15" /></label>
      <label className="text-sm font-medium">Discount type<select value={type} onChange={(e) => setType(e.target.value as Discount["type"])} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option></select></label>
      <label className="text-sm font-medium">{type === "PERCENTAGE" ? "Percent off" : "Amount off"}<input required type="number" min="0.01" step="0.01" max={type === "PERCENTAGE" ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <button className="self-end rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Create coupon</button>
    </form>}
    <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Code</th><th className="p-4">Offer</th><th className="p-4">Usage</th><th className="p-4">Status</th>{canManage && <th className="p-4">Actions</th>}</tr></thead>
        <tbody className="divide-y divide-slate-100">{discounts.map((item) => <tr key={item.id}><td className="p-4 font-semibold">{item.code}</td><td className="p-4">{item.type === "PERCENTAGE" ? `${item.value}% off` : `${item.value} off`}</td><td className="p-4">{item.usageCount}{item.usageLimit ? ` / ${item.usageLimit}` : ""}</td><td className="p-4">{item.active ? "Active" : "Inactive"}</td>{canManage && <td className="space-x-3 p-4"><button onClick={() => void toggle(item)} className="font-medium text-indigo-700">{item.active ? "Deactivate" : "Activate"}</button><button onClick={() => void remove(item)} className="font-medium text-red-700">Delete</button></td>}</tr>)}
        {!discounts.length && <tr><td colSpan={canManage ? 5 : 4} className="p-8 text-center text-slate-500">No coupons created yet.</td></tr>}</tbody>
      </table>
    </div>
    <p className="mt-3 text-xs text-slate-500">Coupons are currently for administration only and are not applied during checkout.</p>
  </section>;
}
