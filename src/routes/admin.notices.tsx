import { SectionError } from "@/components/section-error";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { noticesApi, type Notice, type NoticeDraft } from "@/api/notices";
import { AdminPagination, TableSkeleton } from "@/components/admin-pagination";
import { DEFAULT_PAGE_SIZE } from "@/api/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { requireAdminAccess } from "@/lib/admin-access";

export const Route = createFileRoute("/admin/notices")({
  beforeLoad: async ({ location }) => {
    await requireAdminAccess(location.href);
  },
  component: AdminNotices,
  errorComponent: SectionError,
});

const emptyDraft = (): NoticeDraft => ({
  title: "",
  author: "",
  date: new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
  url: "",
  htmlContent: "",
});

function AdminNotices() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [draft, setDraft] = useState<NoticeDraft>(emptyDraft());
  const [mode, setMode] = useState<"manual" | "advanced">("manual");
  const [manualBody, setManualBody] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, sort, pageSize]);

  const list = useQuery({
    queryKey: ["notices", { page, pageSize, search, sort }],
    queryFn: () => noticesApi.list({ page, pageSize, search, sort }),
    placeholderData: keepPreviousData,
  });

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = list.data?.totalPages ?? 1;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notices"] });

  const createMut = useMutation({
    mutationFn: (d: NoticeDraft) => noticesApi.create(d),
    onSuccess: () => {
      toast.success("Notice published");
      setPage(1);
      invalidate();
      setOpenForm(false);
      setDraft(emptyDraft());
      setManualBody("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<NoticeDraft> }) => noticesApi.update(id, d),
    onSuccess: () => {
      toast.success("Notice updated");
      invalidate();
      setEditing(null);
      setOpenForm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => noticesApi.remove(id),
    onSuccess: () => {
      toast.success("Notice deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(n: Notice) {
    setEditing(n);
    setMode("advanced");
    setDraft({
      title: n.title,
      author: n.author,
      date: n.date,
      url: n.url,
      htmlContent: n.htmlContent,
    });
    setOpenForm(true);
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    let payload = draft;
    if (mode === "manual" && !editing) {
      if (!draft.title.trim() || !manualBody.trim()) {
        toast.error("Title and message are required.");
        return;
      }
      const html = manualBody
        .split(/\n{2,}/)
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
        .join("\n");
      payload = {
        ...draft,
        author: draft.author.trim() || "Admin",
        url: draft.url.trim() || `manual://notice-${Date.now()}`,
        htmlContent: html,
      };
    } else if (!draft.title.trim() || !draft.url.trim() || !draft.htmlContent.trim()) {
      toast.error("Title, URL and HTML content are required.");
      return;
    }
    if (editing) updateMut.mutate({ id: editing.id, d: payload });
    else createMut.mutate(payload);
  }

  const busy = list.isFetching || createMut.isPending || updateMut.isPending || deleteMut.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-accent">Manage</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Notices</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setDraft(emptyDraft());
              setManualBody("");
              setMode("manual");
              setOpenForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
          >
            <Plus className="h-4 w-4" /> Add notice
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-surface/60 px-4 py-2.5 backdrop-blur-xl">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title or author…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-2xl border border-white/10 bg-surface/60 px-3 py-2.5 text-sm outline-none backdrop-blur-xl"
        >
          <option value="latest" className="bg-background">
            Latest first
          </option>
          <option value="oldest" className="bg-background">
            Oldest first
          </option>
        </select>
      </div>

      {list.isError && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>Failed to load notices.</span>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {openForm && (
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-3xl border border-white/10 bg-surface/60 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              {editing ? "Edit notice" : "New notice"}
            </h3>
            <button
              type="button"
              onClick={() => setOpenForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          {!editing && (
            <div className="inline-flex w-fit rounded-xl border border-white/10 bg-background/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`rounded-lg px-3 py-1.5 transition ${mode === "manual" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Manual entry
              </button>
              <button
                type="button"
                onClick={() => setMode("advanced")}
                className={`rounded-lg px-3 py-1.5 transition ${mode === "advanced" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Advanced (HTML + URL)
              </button>
            </div>
          )}

          <AdminInput
            label="Title"
            value={draft.title}
            onChange={(v) => setDraft({ ...draft, title: v })}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <AdminInput
              label="Author"
              value={draft.author}
              onChange={(v) => setDraft({ ...draft, author: v })}
            />
            <AdminInput
              label="Date"
              value={draft.date}
              onChange={(v) => setDraft({ ...draft, date: v })}
            />
          </div>

          {mode === "manual" && !editing ? (
            <AdminTextarea
              label="Message (plain text — line breaks become paragraphs)"
              value={manualBody}
              onChange={setManualBody}
              rows={8}
            />
          ) : (
            <>
              <AdminInput
                label="Source URL (unique)"
                value={draft.url}
                onChange={(v) => setDraft({ ...draft, url: v })}
              />
              <AdminTextarea
                label="HTML content"
                value={draft.htmlContent}
                onChange={(v) => setDraft({ ...draft, htmlContent: v })}
                rows={8}
              />
            </>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              {editing
                ? updateMut.isPending
                  ? "Saving…"
                  : "Save changes"
                : createMut.isPending
                  ? "Publishing…"
                  : "Publish"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-surface/60 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <TableSkeleton rows={pageSize} cols={4} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No notices found.
                </td>
              </tr>
            ) : (
              items.map((n) => (
                <tr key={n.id} className="border-b border-white/5 last:border-0">
                  <td className="max-w-xs truncate px-4 py-3 font-medium">{n.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.author}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(n)}
                        disabled={busy}
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10 disabled:opacity-40"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete "${n.title}"?`)) deleteMut.mutate(n.id);
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

function AdminInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-background/50 px-3 py-2 text-sm outline-none focus:border-white/30"
      />
    </label>
  );
}

function AdminTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-white/10 bg-background/50 px-3 py-2 font-mono text-xs outline-none focus:border-white/30"
      />
    </label>
  );
}
