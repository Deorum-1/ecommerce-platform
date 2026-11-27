"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

export function useAdminApi() {
  const { getToken } = useAuth();

  return useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string | string[] }
          | null;
        const message = Array.isArray(payload?.message)
          ? payload.message.join(", ")
          : payload?.message;
        throw new Error(message || `Request failed (${response.status})`);
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    },
    [getToken],
  );
}
