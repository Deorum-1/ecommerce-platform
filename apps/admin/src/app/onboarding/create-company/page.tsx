"use client";

import { useState, type FormEvent } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { isRecord, postWithClerkToken } from "@/lib/api";

export default function CreateCompanyPage() {
  const { getToken } = useAuth();
  const { setActive } = useClerk();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const companyData: Record<string, string> = { name };
      if (slug.trim()) {
        companyData.slug = slug;
      }
      const result = await postWithClerkToken(
        "/auth/register-company",
        token,
        companyData,
      );
      if (!isRecord(result) || typeof result.organizationId !== "string") {
        throw new Error(
          "The company was created but the response was invalid.",
        );
      }

      await setActive({ organization: result.organizationId });
      router.replace("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Company registration failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="hidden flex-col justify-between bg-[#172033] p-10 text-white lg:flex">
        <div className="flex items-center gap-3 font-semibold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5b5ce2]">S</span> Store Admin</div>
        <div>
          <p className="text-sm font-medium text-indigo-300">Your workspace</p>
          <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight">Everything you need to manage the store.</h2>
        </div>
        <p className="text-sm text-slate-400">Secure company workspace</p>
      </section>
      <section className="flex items-center justify-center bg-[#f5f7fb] px-5 py-10 sm:px-8">
        <form className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(30,41,59,.08)] sm:p-8" onSubmit={submit}>
          <div>
            <p className="text-sm font-semibold text-indigo-600">Store setup</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Create your company</h1>
            <p className="mt-2 text-slate-600">Your account will become the owner of this store.</p>
          </div>

        <label className="block space-y-2 text-sm font-medium text-slate-800">
          Company name
          <input
            autoComplete="organization"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-normal focus:border-indigo-400 focus:bg-white focus:outline-none"
            maxLength={80}
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>

        <label className="block space-y-2 text-sm font-medium text-slate-800">
          Store address (optional)
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-normal focus:border-indigo-400 focus:bg-white focus:outline-none"
            maxLength={48}
            onChange={(event) =>
              setSlug(
                event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              )
            }
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="your-company"
            value={slug}
          />
          <span className="block font-normal text-slate-500">
            Used to identify your store: {slug || "generated from company name"}
          </span>
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          className="w-full rounded-xl bg-[#5b5ce2] px-4 py-3.5 font-semibold text-white shadow-[0_8px_24px_rgba(91,92,226,.18)] hover:bg-[#4546bb] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating company..." : "Create company"}
        </button>
      </form>
      </section>
    </main>
  );
}
