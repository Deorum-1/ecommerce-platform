"use client";

import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

export default function AccountSetupPage() {
  const { signIn } = useSignIn();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const started = useRef(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded || isSignedIn || !signIn || started.current) return;
    started.current = true;

    const ticket = new URLSearchParams(window.location.hash.slice(1)).get(
      "ticket",
    );
    if (!ticket) {
      setError(
        "This setup link is invalid or expired. Ask the company owner for a new one.",
      );
      return;
    }

    void (async () => {
      const result = await signIn.ticket({ ticket });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (signIn.status !== "complete") {
        setError(
          "This setup link could not be completed. Ask the company owner for a new one.",
        );
        return;
      }

      await signIn.finalize({
        navigate: async ({ session }) => {
          if (session?.currentTask) {
            setError(
              "Your account requires an additional sign-in step. Contact the company owner.",
            );
            return;
          }
          setReady(true);
        },
      });
    })().catch((cause: unknown) => {
      setError(
        cause instanceof Error
          ? cause.message
          : "The setup link could not be used.",
      );
    });
  }, [isLoaded, isSignedIn, signIn]);

  async function setAccountPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (!user) {
      setError("Your account session is unavailable. Reopen the setup link.");
      return;
    }

    setIsSubmitting(true);
    try {
      await user.updatePassword({ newPassword: password });
      router.replace("/dashboard");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The password could not be set.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoaded && isSignedIn && !ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5 py-10">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_60px_rgba(30,41,59,.08)]">
          <h1 className="text-2xl font-semibold text-slate-950">
            Open this link in a private window
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            You are already signed in. To avoid switching the current account,
            open the staff setup link in a private or incognito window.
          </p>
        </section>
      </main>
    );
  }

  if (!ready || !isLoaded || !isSignedIn || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5 py-10">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_60px_rgba(30,41,59,.08)]">
          <p className="text-sm font-semibold text-indigo-600">Store Admin</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Set up your staff login
          </h1>
          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : (
            <p className="mt-3 text-slate-600">Verifying your setup link...</p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5 py-10">
      <form
        className="w-full max-w-lg space-y-5 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_60px_rgba(30,41,59,.08)]"
        onSubmit={setAccountPassword}
      >
        <div>
          <p className="text-sm font-semibold text-indigo-600">Store Admin</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Set your password
          </h1>
          <p className="mt-2 text-slate-600">
            Choose a password to finish setting up your staff login.
          </p>
        </div>
        <label className="block space-y-2 text-sm font-medium text-slate-800">
          Password
          <input
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-normal text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium text-slate-800">
          Confirm password
          <input
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-normal text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <button
          className="w-full rounded-xl bg-[#5b5ce2] px-5 py-3.5 font-semibold text-white hover:bg-[#4546bb] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving password..." : "Finish account setup"}
        </button>
      </form>
    </main>
  );
}
