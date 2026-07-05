// Centralized axios instance for the InfoCascade backend.
// Reads the JWT from localStorage["token"] and attaches it as a Bearer token.
import axios, { AxiosError } from "axios";
import { BASE_URL as CONFIG_BASE_URL } from "./config";
import { toast } from "sonner";
import { queryClient } from "@/lib/query-client";
import { getAppRouter } from "@/lib/router-registry";

export const BASE_URL: string = CONFIG_BASE_URL;

export const TOKEN_STORAGE_KEY = "token";
export const USER_STORAGE_KEY = "user";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401, clear session and redirect to /login (skip if already there or on the login flow itself).
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (typeof window !== "undefined" && err.response?.status === 401) {
      const url = (err.config?.url ?? "").toString();
      const isAuthCall =
        url.includes("/api/auth/login") ||
        url.includes("/api/auth/register") ||
        url.includes("/api/auth/me");
      if (!isAuthCall) {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new Event("infocascade:auth"));
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/student-login") {
          window.location.replace("/login");
        }
      }
    }

    if (typeof window !== "undefined" && err.response?.status === 403) {
      const url = (err.config?.url ?? "").toString();
      const isAuthCall =
        url.includes("/api/auth/login") ||
        url.includes("/api/auth/register") ||
        url.includes("/api/auth/me");
      if (!isAuthCall) {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new Event("infocascade:auth"));
        queryClient.clear();
        toast.error("Access denied. Please sign in again.");

        const router = getAppRouter();
        if (router) {
          router.invalidate();
          void router.navigate({ to: "/", replace: true });
        } else {
          window.location.replace("/");
        }
      }
    }
    return Promise.reject(err);
  },
);

/** Extract a backend-provided message from an axios error, or fall back to a generic one. */
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ message?: string; error?: string }>;
    return ax.response?.data?.message ?? ax.response?.data?.error ?? ax.message ?? "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export default api;
