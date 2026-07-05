import { requestRaw, setAuthToken, request } from "./client";
import type { UserRecord } from "./users";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  branch?: string;
  batch?: string;
  role?: "student";
}

export type AuthRole = "student" | "admin";

export interface AuthSession {
  token: string;
  user: UserRecord & { role: AuthRole };
}

interface RawAuthResponse {
  success: boolean;
  token?: string;
  data?: Partial<UserRecord> & { role?: AuthRole; _id?: string; id?: string; token?: string };
  message?: string;
}

const USER_KEY = "user";

export function getStoredUser(): (UserRecord & { role: AuthRole }) | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserRecord & { role: AuthRole };
  } catch {
    return null;
  }
}

export function setStoredUser(u: (UserRecord & { role: AuthRole }) | null) {
  if (typeof window === "undefined") return;
  if (u) window.localStorage.setItem(USER_KEY, JSON.stringify(u));
  else window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("infocascade:auth"));
}

function normalizeSession(raw: RawAuthResponse, fallbackRole: AuthRole): AuthSession {
  const d = raw.data ?? {};
  const user: UserRecord & { role: AuthRole } = {
    id: (d.id as string) ?? (d._id as string) ?? "",
    name: (d.name as string) ?? "",
    email: (d.email as string) ?? "",
    branch: d.branch as string | undefined,
    batch: d.batch as string | undefined,
    year: d.year as string | undefined,
    urn: d.urn as string | undefined,
    crn: d.crn as string | undefined,
    group: d.group as string | undefined,
    department: d.department as string | undefined,
    subscribedAt: d.subscribedAt as string | undefined,
    role: (d.role as AuthRole) ?? fallbackRole,
  };
  return { token: raw.token ?? d.token ?? "", user };
}

async function doLogin(input: LoginInput): Promise<AuthSession> {
  const raw = await requestRaw<RawAuthResponse>(`/api/auth/login`, {
    method: "POST",
    body: input as unknown as Record<string, unknown>,
  });
  const session = normalizeSession(raw, "student");
  setAuthToken(session.token);
  setStoredUser(session.user);
  return session;
}

export const authApi = {
  /** Unified login. Frontend redirects based on returned user.role. */
  login: (input: LoginInput) => doLogin(input),
  studentLogin: (input: LoginInput) => doLogin(input),
  adminLogin: (input: LoginInput) => doLogin(input),

  register: async (input: RegisterInput) => {
    const raw = await requestRaw<RawAuthResponse>(`/api/auth/register`, {
      method: "POST",
      body: input as unknown as Record<string, unknown>,
    });
    if (raw.token || raw.data?.token) {
      const session = normalizeSession(raw, "student");
      setAuthToken(session.token);
      setStoredUser(session.user);
    }
    return { ok: true as const };
  },

  logout: () =>
    request<{ ok: true }>(`/api/auth/logout`, { method: "POST" })
      .catch(() => ({ ok: true as const }))
      .finally(() => {
        setAuthToken(null);
        setStoredUser(null);
      }),

  me: () => request<UserRecord & { role: AuthRole }>(`/api/auth/me`),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ ok: true }>(`/api/auth/change-password`, {
      method: "PUT",
      body: { oldPassword, newPassword },
    }),
};
