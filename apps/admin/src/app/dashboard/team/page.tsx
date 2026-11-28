"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useState, type FormEvent } from "react";
import { isRecord, postWithClerkToken } from "@/lib/api";

export default function TeamPage() {
  const { getToken, isLoaded, orgRole } = useAuth();
  const [emailAddress, setEmailAddress] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const [setupUrl, setSetupUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  async function createStaffAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSetupUrl("");
    setIsSubmitting(true);

    try {
      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const result = await postWithClerkToken("/tenants/members", token, {
        emailAddress,
        firstName,
        lastName,
      });
      if (!isRecord(result) || typeof result.setupUrl !== "string") {
        throw new Error("The staff account was created without a setup link.");
      }

      setCreatedEmail(emailAddress);
      setSetupUrl(result.setupUrl);
      setMessage(
        `Login created for ${emailAddress}. Share the one-time setup link below.`,
      );
      setEmailAddress("");
      setFirstName("");
      setLastName("");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "The staff login could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copySetupLink() {
    setError("");
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(setupUrl);
      setMessage(`Setup link copied for ${createdEmail}.`);
    } catch {
      setError("Could not copy the setup link. Select and copy it manually.");
    } finally {
      setIsCopying(false);
    }
  }

  if (!isLoaded) {
    return <main className="p-8 text-slate-600">Loading team settings...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <header className="flex h-20 items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8">
        <Link
          className="flex items-center gap-3 font-semibold text-slate-950"
          href="/dashboard"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5b5ce2] text-white">
            S
          </span>
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
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Create a staff login
          </h1>
        </div>
        {orgRole !== "org:admin" ? (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            Only company owners can create staff logins.
          </p>
        ) : (
          <form
            className="mt-6 space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(30,41,59,.05)] sm:p-8"
            onSubmit={createStaffAccount}
          >
            <label className="block space-y-2 text-sm font-medium text-slate-800">
              First name
              <input
                autoComplete="given-name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-normal text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none"
                maxLength={80}
                onChange={(event) => setFirstName(event.target.value)}
                required
                value={firstName}
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-800">
              Last name
              <input
                autoComplete="family-name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-normal text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none"
                maxLength={80}
                onChange={(event) => setLastName(event.target.value)}
                required
                value={lastName}
              />
            </label>
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
              The account is added to this company as staff immediately. Create
              a one-time password setup link and share it directly; no
              organization invitation is sent.
            </p>
            {message && (
              <p
                role="status"
                className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
              >
                {message}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            {setupUrl && (
              <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                <label className="block space-y-2 text-sm font-medium text-slate-800">
                  One-time password setup link
                  <input
                    className="w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 font-normal text-slate-700"
                    readOnly
                    value={setupUrl}
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-lg bg-[#5b5ce2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4546bb] disabled:opacity-60"
                    disabled={isCopying}
                    onClick={() => void copySetupLink()}
                    type="button"
                  >
                    {isCopying ? "Copying..." : "Copy setup link"}
                  </button>
                  <span className="text-xs text-slate-500">
                    Expires in 24 hours and can only be used once.
                  </span>
                </div>
              </div>
            )}
            <button
              className="w-full rounded-xl bg-[#5b5ce2] px-5 py-3.5 font-semibold text-white shadow-[0_8px_24px_rgba(91,92,226,.18)] hover:bg-[#4546bb] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating login..." : "Create staff login"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
