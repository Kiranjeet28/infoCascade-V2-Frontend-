import { request } from "./client";
import { normalizePage, pickId, toQuery, type Paginated } from "./pagination";

export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  rating: number;
  category: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

export interface FeedbackQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
}

function mapFeedback(f: Record<string, unknown>): FeedbackItem {
  return {
    id: pickId(f),
    name: (f.name as string) ?? "",
    email: (f.email as string) ?? "",
    rating: (f.rating as number) ?? 0,
    category: (f.category as string) ?? "",
    message: (f.message as string) ?? "",
    createdAt: (f.createdAt as string) ?? "",
    resolved: Boolean(f.resolved),
  };
}

export const feedbackApi = {
  list: async (q: FeedbackQuery = {}): Promise<Paginated<FeedbackItem>> => {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const raw = await request<unknown>(
      `/api/feedback${toQuery({
        page,
        pageSize,
        search: q.search,
        category: q.category,
      })}`,
    );
    return normalizePage<FeedbackItem>(raw, { page, pageSize }, mapFeedback);
  },
  get: (id: string) => request<FeedbackItem | null>(`/api/feedback/${id}`),
  count: async (): Promise<number> => {
    const raw = await request<unknown>(`/api/feedback/count`);
    if (typeof raw === "number") return raw;
    const obj = (raw ?? {}) as Record<string, unknown>;
    return (obj.count as number) ?? (obj.total as number) ?? 0;
  },

  create: (payload: Omit<FeedbackItem, "id" | "createdAt" | "resolved">) =>
    request<FeedbackItem>(`/api/feedback`, {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    }),

  resolve: (id: string) =>
    request<FeedbackItem>(`/api/feedback/${id}/resolve`, { method: "PUT" }),

  remove: (id: string) =>
    request<{ ok: true }>(`/api/feedback/${id}`, { method: "DELETE" }),
};
