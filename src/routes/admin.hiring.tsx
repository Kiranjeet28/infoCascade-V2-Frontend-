import { SectionError } from "@/components/section-error";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Download, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { hiringApi, type HiringRequest } from "@/api/hiring";
import { AdminPagination, TableSkeleton } from "@/components/admin-pagination";
import { DEFAULT_PAGE_SIZE } from "@/api/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { requireAdminAccess } from "@/lib/admin-access";

export const Route = createFileRoute("/admin/hiring")({
  beforeLoad: async ({ location }) => {
    await requireAdminAccess(location.href);
  },
  component: AdminHiring,
  errorComponent: SectionError,
});

function toCsv(rows: HiringRequest[]): string {
  const head = ["Name", "Email", "Department", "Batch", "URN", "Status", "Submitted"];
  const body = rows.map((r) => [
    r.fullName,
    r.email,
    r.department,
    r.batch,
    r.urn,
    r.status,
    r.submittedAt ? new Date(r.submittedAt).toISOString() : "",
  ]);
  return [head, ...body]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function AdminHiring() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const list = useQuery({
    queryKey: ["hiring", { page, pageSize, search }],
    queryFn: () => hiringApi.list({ page, pageSize, search }),
    placeholderData: keepPreviousData,
  });

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = list.data?.totalPages ?? 1;

  const deleteMut = useMutation({
    mutationFn: (id: string) => hiringApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hiring"] });
      toast.success("Application removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function download() {
    const blob = new Blob([toCsv(items)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hiring-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Current page exported");
  }

  const busy = list.isFetching || deleteMut.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-accent">Manage</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Hiring requests</h1>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={items.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10 disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Export page
        </button>
      </header>

      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-surface/60 px-4 py-2.5 backdrop-blur-xl">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, email, URN…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {list.isError && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>Failed to load hiring requests.</span>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-surface/60 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Dept</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">URN</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <TableSkeleton rows={pageSize} cols={7} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No applications found.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{r.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.department}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.batch}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.urn}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        r.status === "approved"
                          ? "bg-accent/15 text-accent"
                          : r.status === "rejected"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove application from ${r.fullName}?`))
                            deleteMut.mutate(r.id);
                        }}
                        disabled={busy}
                        className="rounded-lg border border-destructive/30 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
