"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAdminApi } from "@/lib/admin-api";

type Order = {
  id: string;
  status: string;
  total: string | number;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  createdAt: string;
  items: { id: string; productName: string | null; variantName: string | null; quantity: number; unitPrice: string | number }[];
};

const nextStatus: Record<string, string> = { PAID: "PROCESSING", PROCESSING: "SHIPPED", SHIPPED: "DELIVERED" };

export default function OrderDetailPage() {
  const { isLoaded, orgId } = useAuth();
  const params = useParams<{ orderId: string }>();
  const api = useAdminApi();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setOrder(await api(`/orders/${params.orderId}`)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load order."); }
  }, [api, params.orderId]);
  useEffect(() => { if (isLoaded && orgId) void load(); }, [isLoaded, orgId, load]);
  async function advance() {
    if (!order || !nextStatus[order.status]) return;
    try {
      await api(`/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus[order.status] }) });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update order."); }
  }
  if (error && !order) return <p role="alert" className="text-red-700">{error}</p>;
  if (!order) return <p className="text-slate-500">Loading order…</p>;
  return <section>
    <Link href="/dashboard/orders" className="text-sm font-medium text-indigo-700 hover:underline">← All orders</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-semibold">Order #{order.id.slice(-8)}</h2><p className="mt-1 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</p></div>
      {nextStatus[order.status] && <button onClick={advance} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Mark {nextStatus[order.status].toLowerCase()}</button>}
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Items</h3><div className="mt-4 divide-y divide-slate-100">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><div>{item.productName || "Product"}{item.variantName && <span className="text-slate-500"> · {item.variantName}</span>}<p className="mt-1 text-xs text-slate-500">Qty {item.quantity}</p></div><span>{new Intl.NumberFormat(undefined, { style: "currency", currency: order.currency }).format(Number(item.unitPrice) * item.quantity)}</span></div>)}</div><div className="mt-4 flex justify-between border-t pt-4 font-semibold"><span>Total</span><span>{new Intl.NumberFormat(undefined, { style: "currency", currency: order.currency }).format(Number(order.total))}</span></div></div>
      <div className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Customer</h3><p className="mt-3 text-sm">{order.customerName || "Guest"}</p><p className="mt-1 text-sm text-slate-500">{order.customerEmail}</p><p className="mt-1 text-sm text-slate-500">{order.customerPhone}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Delivery</h3><p className="mt-3 text-sm leading-6 text-slate-600">{[order.shippingAddress, order.shippingCity, order.shippingState].filter(Boolean).join(", ") || "No delivery address provided."}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p><p className="mt-1 text-sm">{order.status}</p></div></div>
    </div>
  </section>;
}
