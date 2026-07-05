// Centralized HTTP client backed by axios.
// Reads JWT from localStorage["token"] and attaches Authorization: Bearer <token>.
// Backend envelope is { success, data, token, message }; `request` unwraps `data` by default.
import { AxiosError, AxiosRequestConfig } from "axios";
import { api, BASE_URL, TOKEN_STORAGE_KEY, extractErrorMessage } from "./axios";

export const API_BASE_URL = BASE_URL;
export const USE_MOCKS = false;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Json = Record<string, unknown> | unknown[] | null;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Json;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** When true (default) the `{success,data}` envelope is unwrapped to `data`. */
  unwrap?: boolean;
}


export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, headers, unwrap = true } = opts;

  const config: AxiosRequestConfig = {
    url: path,
    method,
    signal: signal as AxiosRequestConfig["signal"],
    headers,
    data: body,
  };

  try {
    const res = await api.request<unknown>(config);
    const data = res.data;
    if (unwrap && data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      if ("success" in obj && "data" in obj) return obj.data as T;
    }
    return data as T;
  } catch (err) {
    const ax = err as AxiosError<unknown>;
    const status = ax.response?.status ?? 0;
    throw new ApiError(extractErrorMessage(err), status, ax.response?.data);
  }
}

/** Raw request that does not unwrap the `{success,data}` envelope. */
export function requestRaw<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  return request<T>(path, { ...opts, unwrap: false });
}
