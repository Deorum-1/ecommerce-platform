"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import { getErrorMessage } from "@/lib/api";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

export function useAdminApi() {
  const { getToken } = useAuth();

  return useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken({ skipCache: true });
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
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(
          getErrorMessage(payload, `Request failed (${response.status})`),
        );
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    },
    [getToken],
  );
}
