import { SectionError } from "@/components/section-error";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { feedbackApi } from "@/api/feedback";
import { AdminPagination } from "@/components/admin-pagination";
import { DEFAULT_PAGE_SIZE } from "@/api/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { requireAdminAccess } from "@/lib/admin-access";

export const Route = createFileRoute("/admin/feedback")({
  beforeLoad: async ({ location }) => {
    await requireAdminAccess(location.href);
  },
  component: AdminFeedback,
  errorComponent: SectionError,
});

function AdminFeedback() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, category, pageSize]);

  const list = useQuery({
    queryKey: ["feedback", { page, pageSize, search, category }],
    queryFn: () => feedbackApi.list({ page, pageSize, search, category }),
    placeholderData: keepPreviousData,
  });

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = list.data?.totalPages ?? 1;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["feedback"] });

  const resolveMut = useMutation({
    mutationFn: (id: string) => feedbackApi.resolve(id),
    onSuccess: () => {
      toast.success("Marked as resolved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => feedbackApi.remove(id),
    onSuccess: () => {
      toast.success("Feedback deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy = list.isFetching || resolveMut.isPending || deleteMut.isPending;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs font-medium uppercase tracking-wider text-accent">Manage</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Feedback</h1>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-surface/60 px-4 py-2.5 backdrop-blur-xl">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, message…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="w-40 rounded-2xl border border-white/10 bg-surface/60 px-3 py-2.5 text-sm outline-none backdrop-blur-xl"
        />
      </div>

      {list.isError && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>Failed to load feedback.</span>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {list.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-3xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-surface/60 p-8 text-center text-muted-foreground backdrop-blur-xl">
          No feedback found.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((f) => (
            <article
              key={f.id}
              className="rounded-3xl border border-white/10 bg-surface/60 p-5 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-display font-semibold">{f.name || "Anonymous"}</div>
                    <span className="text-xs text-muted-foreground">· {f.email}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-white/5 px-2 py-0.5">{f.category}</span>
                    <span className="inline-flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < f.rating ? "fill-accent text-accent" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </span>
                    <span>{f.createdAt ? new Date(f.createdAt).toLocaleString() : ""}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!f.resolved && (
                    <button
                      type="button"
                      onClick={() => resolveMut.mutate(f.id)}
                      disabled={busy}
                      className="rounded-lg border border-accent/30 bg-accent/10 p-1.5 text-accent hover:bg-accent/20 disabled:opacity-40"
                      title="Resolve"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Delete this feedback?")) deleteMut.mutate(f.id);
                    }}
                    disabled={busy}
                    className="rounded-lg border border-destructive/30 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/90">{f.message}</p>
              {f.resolved && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Resolved
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Table skeleton util isn't ideal for cards — keep pagination bar */}
      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        disabled={list.isLoading}
        isFetching={list.isFetching}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRefresh={() => list.refetch()}
      />
    </div>
  );
}
