import { request } from "./client";
import { normalizePage, pickId, toQuery, type Paginated } from "./pagination";

export type HiringStatus = "pending" | "approved" | "rejected";

export interface HiringRequest {
  id: string;
  fullName: string;
  email: string;
  department: string;
  batch: string;
  urn: string;
  status: HiringStatus;
  submittedAt: string;
}

export interface HiringInput {
  fullName: string;
  email: string;
  department: string;
  batch: string;
  urn: string;
}

export interface HiringQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const AVAILABLE_BATCHES = ["2028", "2027", "2026", "2025"] as const;
export const LATEST_BATCH = AVAILABLE_BATCHES[0];

function mapHiring(h: Record<string, unknown>): HiringRequest {
  return {
    id: pickId(h),
    fullName: (h.fullName as string) ?? "",
    email: (h.email as string) ?? "",
    department: (h.department as string) ?? "",
    batch: (h.batch as string) ?? "",
    urn: (h.urn as string) ?? "",
    status: ((h.status as HiringStatus) ?? "pending") as HiringStatus,
    submittedAt: (h.submittedAt as string) ?? (h.createdAt as string) ?? "",
  };
}

export const hiringApi = {
  list: async (q: HiringQuery = {}): Promise<Paginated<HiringRequest>> => {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const raw = await request<unknown>(
      `/api/hiring${toQuery({ page, pageSize, search: q.search })}`,
    );
    return normalizePage<HiringRequest>(raw, { page, pageSize }, mapHiring);
  },
  get: (id: string) => request<HiringRequest | null>(`/api/hiring/${id}`),
  count: async (): Promise<number> => {
    const raw = await request<unknown>(`/api/hiring/count`);
    if (typeof raw === "number") return raw;
    const obj = (raw ?? {}) as Record<string, unknown>;
    return (obj.count as number) ?? (obj.total as number) ?? 0;
  },

  create: (payload: HiringInput) =>
    request<HiringRequest>(`/api/hiring`, {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    }),

  remove: (id: string) =>
    request<{ ok: true }>(`/api/hiring/${id}`, { method: "DELETE" }),
};
