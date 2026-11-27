"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useState, type FormEvent } from "react";
import { postWithClerkToken } from "@/lib/api";

export default function TeamPage() {
  const { getToken, isLoaded, orgRole } = useAuth();
  const [emailAddress, setEmailAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await postWithClerkToken("/tenants/invitations", token, {
        emailAddress,
      });
      setMessage(`An invitation was sent to ${emailAddress}.`);
      setEmailAddress("");
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "The invitation could not be sent.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isLoaded) {
    return <main className="p-8 text-slate-600">Loading team settings...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <header className="flex h-20 items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8">
        <Link className="flex items-center gap-3 font-semibold text-slate-950" href="/dashboard">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5b5ce2] text-white">S</span>
          <span className="hidden sm:inline">Store Admin</span>
        </Link>
        <UserButton />
      </header>
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          href="/dashboard"
        >
          <span aria-hidden="true">←</span> Back to dashboard
        </Link>
        <div className="mt-5">
          <p className="text-sm font-medium text-indigo-600">Team settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Invite staff</h1>
        </div>
        {orgRole !== "org:admin" ? (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            Only company owners can invite staff.
          </p>
        ) : (
          <form
            className="mt-6 space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(30,41,59,.05)] sm:p-8"
            onSubmit={invite}
          >
            <label className="block space-y-2 text-sm font-medium text-slate-800">
              Staff email address
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-normal text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none"
                onChange={(event) => setEmailAddress(event.target.value)}
                placeholder="person@company.com"
                required
                type="email"
                value={emailAddress}
              />
            </label>
            <p className="text-sm text-slate-600">
              Staff can access this company but cannot invite or manage other
              members.
            </p>
            {message && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                {message}
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              className="w-full rounded-xl bg-[#5b5ce2] px-5 py-3.5 font-semibold text-white shadow-[0_8px_24px_rgba(91,92,226,.18)] hover:bg-[#4546bb] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Sending invitation..." : "Send invitation"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
