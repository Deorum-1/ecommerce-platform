"use client";

import { useAuth } from "@clerk/nextjs";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminApi } from "@/lib/admin-api";

type Settings = { name: string; slug: string; logoUrl: string | null; currency: string; description: string | null; contactEmail: string | null; website: string | null };
export default function SettingsPage() {
  const { isLoaded, orgId, orgRole } = useAuth();
  const api = useAdminApi();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try { setSettings(await api("/admin/settings")); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load settings."); }
  }, [api]);
  useEffect(() => { if (isLoaded && orgId) void load(); }, [isLoaded, orgId, load]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    try {
      await api("/admin/settings", { method: "PATCH", body: JSON.stringify({
        name: settings.name,
        logoUrl: settings.logoUrl || "",
        currency: settings.currency,
        description: settings.description || "",
        contactEmail: settings.contactEmail || "",
        website: settings.website || "",
      }) });
      setNotice("Store settings saved."); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save settings."); }
  }
  if (!settings) return <section>{error ? <p role="alert" className="text-red-700">{error}</p> : <p className="text-slate-500">Loading settings…</p>}</section>;
  const canManage = orgRole === "org:admin";
  const update = (key: keyof Settings, value: string) => setSettings((current) => current ? { ...current, [key]: value } : current);
  return <section>
    <h2 className="text-2xl font-semibold text-slate-950">Store settings</h2>
    <p className="mt-1 text-sm text-slate-500">Manage your store identity and regional defaults.</p>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-4 text-sm text-emerald-700">{notice}</p>}
    <form onSubmit={save} className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <label className="block text-sm font-medium">Store name<input required maxLength={80} disabled={!canManage} value={settings.name} onChange={(e) => update("name", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" /></label>
      <label className="block text-sm font-medium">Store address<input disabled value={`${settings.slug}`} className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500" /></label>
      <label className="block text-sm font-medium">Currency<input required minLength={3} maxLength={3} disabled={!canManage} value={settings.currency} onChange={(e) => update("currency", e.target.value.toUpperCase())} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" /></label>
      <label className="block text-sm font-medium">Logo URL<input type="url" disabled={!canManage} value={settings.logoUrl || ""} onChange={(e) => update("logoUrl", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" placeholder="https://…" /></label>
      {settings.logoUrl && <div role="img" aria-label="Store logo preview" className="h-16 w-48 rounded-lg border border-slate-200 bg-contain bg-center bg-no-repeat p-2" style={{ backgroundImage: `url("${settings.logoUrl}")` }} />}
      <label className="block text-sm font-medium">Description<textarea maxLength={1000} disabled={!canManage} value={settings.description || ""} onChange={(e) => update("description", e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" /></label>
      <label className="block text-sm font-medium">Contact email<input type="email" disabled={!canManage} value={settings.contactEmail || ""} onChange={(e) => update("contactEmail", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" /></label>
      <label className="block text-sm font-medium">Website<input type="url" disabled={!canManage} value={settings.website || ""} onChange={(e) => update("website", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" /></label>
      {canManage && <button className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Save settings</button>}
      {!canManage && <p className="text-sm text-slate-500">Only workspace owners can change store settings.</p>}
    </form>
  </section>;
}
