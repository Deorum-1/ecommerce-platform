"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { useAdminApi } from "@/lib/admin-api";

type Customer = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  _count: { orders: number };
  lifetimeValue: number;
};

export default function CustomersPage() {
  const { isLoaded, orgId } = useAuth();
  const api = useAdminApi();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setCustomers(await api("/admin/customers")); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load customers."); }
  }, [api]);
  useEffect(() => { if (isLoaded && orgId) void load(); }, [isLoaded, orgId, load]);
  return <section>
    <h2 className="text-2xl font-semibold text-slate-950">Customers</h2>
    <p className="mt-1 text-sm text-slate-500">A directory of customers who have ordered from your store.</p>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Customer</th><th className="p-4">Phone</th><th className="p-4">Orders</th><th className="p-4">Lifetime spend</th><th className="p-4">Joined</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{customers.map((customer) => <tr key={customer.id}><td className="p-4"><p className="font-medium text-slate-900">{customer.name || "Unnamed customer"}</p><p className="mt-1 text-slate-500">{customer.email}</p></td><td className="p-4 text-slate-600">{customer.phone || "—"}</td><td className="p-4">{customer._count.orders}</td><td className="p-4">{customer.lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="p-4 text-slate-500">{new Date(customer.createdAt).toLocaleDateString()}</td></tr>)}
          {!customers.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Customers appear here after their first order.</td></tr>}</tbody>
      </table>
    </div>
  </section>;
}
