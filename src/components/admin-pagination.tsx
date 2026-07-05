import { RefreshCw } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/api/pagination";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh?: () => void;
  isFetching?: boolean;
}

export function AdminPagination({
  page,
  pageSize,
  total,
  totalPages,
  disabled,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  isFetching,
}: Props) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface/60 px-4 py-3 text-sm backdrop-blur-xl">
      <div className="text-muted-foreground">
        {total === 0 ? "No records" : `Showing ${from}–${to} of ${total}`}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={disabled}
            className="rounded-lg border border-white/10 bg-background/60 px-2 py-1 text-xs outline-none disabled:opacity-40"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n} className="bg-background">
                {n}
              </option>
            ))}
          </select>
        </label>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={disabled || page <= 1}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs text-muted-foreground">
          Page {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={disabled || page >= totalPages}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-white/5 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-3 w-full max-w-[160px] animate-pulse rounded bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
