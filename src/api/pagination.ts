/** Shared pagination helpers used by every list API. */

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export function toQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Normalize a backend list response into a `Paginated<T>` envelope. */
export function normalizePage<T>(
  raw: unknown,
  fallback: { page: number; pageSize: number },
  map: (row: Record<string, unknown>) => T,
): Paginated<T> {
  const obj = (raw ?? {}) as Record<string, unknown>;
  let itemsRaw: unknown[] = [];
  if (Array.isArray(raw)) {
    itemsRaw = raw;
  } else {
    itemsRaw = (obj.items ??
      obj.results ??
      obj.data ??
      obj.users ??
      obj.notices ??
      obj.team ??
      obj.hiring ??
      obj.feedback ??
      []) as unknown[];
  }
  const items = itemsRaw.map((x) => map((x ?? {}) as Record<string, unknown>));
  const total = typeof obj.total === "number" ? (obj.total as number) : items.length;
  const page = typeof obj.page === "number" ? (obj.page as number) : fallback.page;
  const pageSize =
    typeof obj.pageSize === "number" ? (obj.pageSize as number) : fallback.pageSize;
  const totalPages =
    typeof obj.totalPages === "number"
      ? (obj.totalPages as number)
      : Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return { items, total, page, pageSize, totalPages };
}

export function pickId(row: Record<string, unknown>): string {
  return (row.id as string) ?? (row._id as string) ?? "";
}
