import { request } from "./client";
import { normalizePage, pickId, toQuery, type Paginated } from "./pagination";

/**
 * User record — mirrors the Mongoose User schema.
 * URN and CRN must be exactly 7 digits.
 */
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role?: "student" | "admin";
  branch?: string;
  batch?: string;
  year?: string;
  urn?: string;
  crn?: string;
  group?: string;
  department?: string;
  subscribedAt?: string;
}

export const URN_REGEX = /^\d{7}$/;
export const CRN_REGEX = /^\d{7}$/;

export interface UsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: "admin" | "student" | "";
}

function mapUser(u: Record<string, unknown>): UserRecord {
  return {
    id: pickId(u),
    name: (u.name as string) ?? "",
    email: (u.email as string) ?? "",
    role: u.role as UserRecord["role"],
    branch: u.branch as string | undefined,
    batch: u.batch as string | undefined,
    year: u.year as string | undefined,
    urn: u.urn as string | undefined,
    crn: u.crn as string | undefined,
    group: u.group as string | undefined,
    department: u.department as string | undefined,
    subscribedAt: u.subscribedAt as string | undefined,
  };
}

export const usersApi = {
  /** Server-side paginated list. Always sends page & pageSize. */
  list: async (q: UsersQuery = {}): Promise<Paginated<UserRecord>> => {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const raw = await request<unknown>(
      `/api/users${toQuery({ page, pageSize, search: q.search, role: q.role })}`,
    );
    return normalizePage<UserRecord>(raw, { page, pageSize }, mapUser);
  },

  get: (id: string) => request<UserRecord | null>(`/api/users/${id}`),
  create: (payload: Partial<UserRecord> & { password?: string }) =>
    request<UserRecord>(`/api/users`, {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    }),
  update: (id: string, payload: Partial<UserRecord>) =>
    request<UserRecord>(`/api/users/${id}`, {
      method: "PUT",
      body: payload as Record<string, unknown>,
    }),
  remove: (id: string) =>
    request<{ ok: true }>(`/api/users/${id}`, { method: "DELETE" }),
  updateRole: (id: string, role: "admin" | "student") =>
    request<UserRecord>(`/api/users/${id}/role`, {
      method: "PATCH",
      body: { role },
    }),

  profile: () => request<UserRecord>(`/api/users/profile`),
  updateProfile: (payload: Partial<UserRecord>) =>
    request<UserRecord>(`/api/users/profile`, {
      method: "PUT",
      body: payload as Record<string, unknown>,
    }),

  count: async (): Promise<number> => {
    const raw = await request<unknown>(`/api/users/count`);
    if (typeof raw === "number") return raw;
    const obj = (raw ?? {}) as Record<string, unknown>;
    return (obj.count as number) ?? (obj.total as number) ?? 0;
  },
};
