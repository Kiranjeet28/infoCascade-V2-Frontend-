import { request } from "./client";
import { normalizePage, pickId, toQuery, type Paginated } from "./pagination";

/**
 * Notification (Notice) shape matches the Mongoose schema on the backend:
 *   { title, author, date, url, htmlContent, createdAt, updatedAt }
 */
export interface Notice {
  id: string;
  title: string;
  author: string;
  date: string;
  url: string;
  htmlContent: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NoticeQuery {
  search?: string;
  sort?: "latest" | "oldest";
  page?: number;
  pageSize?: number;
}

export type NoticeDraft = Omit<Notice, "id" | "createdAt" | "updatedAt">;

function mapNotice(n: Record<string, unknown>): Notice {
  return {
    id: pickId(n),
    title: (n.title as string) ?? "",
    author: (n.author as string) ?? "",
    date: (n.date as string) ?? "",
    url: (n.url as string) ?? "",
    htmlContent: (n.htmlContent as string) ?? (n.message as string) ?? "",
    createdAt: n.createdAt as string | undefined,
    updatedAt: n.updatedAt as string | undefined,
  };
}

export const noticesApi = {
  list: async (q: NoticeQuery = {}): Promise<Paginated<Notice>> => {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const raw = await request<unknown>(
      `/api/notices${toQuery({ page, pageSize, search: q.search, sort: q.sort })}`,
    );
    return normalizePage<Notice>(raw, { page, pageSize }, mapNotice);
  },

  get: (id: string) => request<Notice | null>(`/api/notices/${id}`),

  create: (payload: NoticeDraft) =>
    request<Notice>(`/api/notices`, {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    }),

  update: (id: string, payload: Partial<NoticeDraft>) =>
    request<Notice>(`/api/notices/${id}`, {
      method: "PUT",
      body: payload as Record<string, unknown>,
    }),

  remove: (id: string) =>
    request<{ ok: true }>(`/api/notices/${id}`, { method: "DELETE" }),

  sync: () =>
    request<{ inserted?: number; message?: string; [k: string]: unknown }>(
      `/api/notices/sync`,
      { method: "POST" },
    ),
};
