"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type PaymentResult = {
  status: string;
  orderId?: string;
};

export default function CheckoutCompletePage() {
  const [reference, setReference] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReference(params.get("reference") || params.get("trxref") || "");
    setStoreSlug(
      params.get("store") ||
        process.env.NEXT_PUBLIC_STOREFRONT_TENANT_SLUG ||
        "",
    );
  }, []);

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setError("The payment reference is missing.");
      return;
    }

    setChecking(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/storefront/orders/${encodeURIComponent(reference)}/verify`,
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : "Could not verify the payment.";
        throw new Error(message);
      }
      if (
        typeof body !== "object" ||
        body === null ||
        !("status" in body) ||
        typeof body.status !== "string"
      ) {
        throw new Error("The payment verification response was invalid.");
      }

      const payment = body as PaymentResult;
      setResult(payment);
      if (payment.status === "paid" && storeSlug) {
        window.localStorage.removeItem(`store-cart:${storeSlug}`);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not verify the payment.",
      );
    } finally {
      setChecking(false);
    }
  }, [reference, storeSlug]);

  useEffect(() => {
    if (reference) void verifyPayment();
  }, [reference, verifyPayment]);

  const paid = result?.status === "paid";
  const pending = result?.status === "pending" || result?.status === "ongoing";

  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-5 text-[#29271f]">
      <section className="w-full max-w-lg rounded-3xl border border-[#eae7df] bg-white p-8 text-center shadow-sm sm:p-12">
        <span
          aria-hidden="true"
          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e9eee7] text-2xl text-[#263b30]"
        >
          {paid ? "✓" : checking ? "…" : "✳"}
        </span>
        <h1 className="mt-5 font-serif text-3xl text-[#263b30]">
          {paid
            ? "Thank you for your order"
            : checking
              ? "Confirming your payment"
              : pending
                ? "Payment is still processing"
                : "We couldn’t confirm payment"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#77756e]">
          {paid
            ? `Order ${result.orderId || ""} is confirmed. A confirmation will be sent to your email.`
            : pending
              ? "Your payment provider has not marked this transaction as complete yet."
              : error || "Please check your payment status or try again."}
        </p>
        {error && result && (
          <p className="mt-3 text-sm text-rose-700">{error}</p>
        )}
        {!paid && (
          <button
            className="mt-7 rounded-full bg-[#263b30] px-6 py-3 text-sm font-semibold text-white hover:bg-[#395443] disabled:opacity-50"
            disabled={checking || !reference}
            onClick={() => void verifyPayment()}
            type="button"
          >
            {checking ? "Checking…" : "Check payment again"}
          </button>
        )}
        <Link
          className="mt-5 block text-sm font-semibold text-[#9b5b39] underline underline-offset-4"
          href="/"
        >
          Return to store
        </Link>
      </section>
    </main>
  );
}
