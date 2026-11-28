"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { useAdminApi } from "@/lib/admin-api";

type Order = {
  id: string;
  status: string;
  total: string | number;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string;
};

export default function OrdersPage() {
  const { isLoaded, orgId } = useAuth();
  const api = useAdminApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setOrders(await api("/orders"));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load orders.");
    }
  }, [api]);
  useEffect(() => {
    if (isLoaded && orgId) void load();
  }, [isLoaded, orgId, load]);

  return (
    <section>
      <h2 className="text-2xl font-semibold text-slate-950">Orders</h2>
      <p className="mt-1 text-sm text-slate-500">Review purchases and fulfillment progress.</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Date</th><th className="p-4">Total</th><th className="p-4">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => <tr key={order.id}>
              <td className="p-4"><Link className="font-semibold text-indigo-700 hover:underline" href={`/dashboard/orders/${order.id}`}>#{order.id.slice(-8)}</Link></td>
              <td className="p-4">{order.customerName || order.customerEmail || "Guest"}</td>
              <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
              <td className="p-4">{new Intl.NumberFormat(undefined, { style: "currency", currency: order.currency }).format(Number(order.total))}</td>
              <td className="p-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">{order.status}</span></td>
            </tr>)}
            {!orders.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
