import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SectionError } from "@/components/section-error";
import { teamApi, type TeamDraft, type TeamMember } from "@/api/team";
import { AdminPagination, TableSkeleton } from "@/components/admin-pagination";
import { DEFAULT_PAGE_SIZE } from "@/api/pagination";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/admin/team")({
  component: AdminTeam,
  errorComponent: SectionError,
});

const EMPTY: TeamDraft = {
  name: "",
  department: "",
  role: "",
  batch: "",
  bio: "",
  isAdmin: false,
  linkedin: "",
  github: "",
  email: "",
  avatarUrl: "",
};

function AdminTeam() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TeamDraft>(EMPTY);

  useEffect(() => {
    setPage(1);
  }, [search, department, role, pageSize]);

  const list = useQuery({
    queryKey: ["team", { page, pageSize, search, department, role }],
    queryFn: () => teamApi.list({ page, pageSize, search, department, role }),
    placeholderData: keepPreviousData,
  });

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = list.data?.totalPages ?? 1;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["team"] });

  const createMut = useMutation({
    mutationFn: (d: TeamDraft) => teamApi.create(d),
    onSuccess: () => {
      setPage(1);
      invalidate();
      resetForm();
      toast.success("Team member added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<TeamDraft> }) => teamApi.update(id, d),
    onSuccess: () => {
      invalidate();
      resetForm();
      toast.success("Team member updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => teamApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Team member removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function resetForm() {
    setDraft(EMPTY);
    setEditingId(null);
    setOpenForm(false);
  }

  function startEdit(m: TeamMember) {
    setEditingId(m.id);
    setDraft({
      name: m.name,
      department: m.department,
      role: m.role,
      batch: m.batch,
      bio: m.bio ?? "",
      isAdmin: !!m.isAdmin,
      linkedin: m.linkedin ?? "",
      github: m.github ?? "",
      email: m.email ?? "",
      avatarUrl: m.avatarUrl ?? "",
    });
    setOpenForm(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.role.trim() || !draft.department.trim() || !draft.batch) {
      toast.error("Name, role, department and batch are required");
      return;
    }
    if (editingId) updateMut.mutate({ id: editingId, d: draft });
    else createMut.mutate(draft);
  }

  const pending = createMut.isPending || updateMut.isPending;
  const busy = list.isFetching || pending || deleteMut.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-accent">Manage</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit and remove team members shown on the public Team page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (openForm ? resetForm() : setOpenForm(true))}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus className="h-4 w-4" />
          {openForm ? "Close" : "New member"}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-surface/60 px-4 py-2.5 backdrop-blur-xl">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, role, department, batch…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Department"
          className="w-40 rounded-2xl border border-white/10 bg-surface/60 px-3 py-2.5 text-sm outline-none backdrop-blur-xl"
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role"
          className="w-40 rounded-2xl border border-white/10 bg-surface/60 px-3 py-2.5 text-sm outline-none backdrop-blur-xl"
        />
      </div>

      {list.isError && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>Failed to load team.</span>
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
          className="grid gap-3 rounded-3xl border border-white/10 bg-surface/60 p-6 backdrop-blur-xl md:grid-cols-2"
        >
          {(
            [
              ["name", "Full name", true],
              ["role", "Role", true],
              ["department", "Department", true],
              ["batch", "Batch", true],
              ["email", "Email", false],
              ["avatarUrl", "Avatar URL", false],
              ["linkedin", "LinkedIn URL", false],
              ["github", "GitHub URL", false],
            ] as const
          ).map(([key, label, required]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <input
                value={(draft[key] as string) ?? ""}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                required={required}
                className="w-full rounded-xl border border-white/10 bg-background/50 px-3 py-2 text-sm outline-none focus:border-white/30"
              />
            </label>
          ))}
          <label className="md:col-span-2 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bio
            </span>
            <textarea
              value={draft.bio ?? ""}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-background/50 px-3 py-2 text-sm outline-none focus:border-white/30"
            />
          </label>
          <label className="md:col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!draft.isAdmin}
              onChange={(e) => setDraft({ ...draft, isAdmin: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-background"
            />
            Mark as administrator
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              {pending ? "Saving…" : editingId ? "Save changes" : "Add member"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-surface/60 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <TableSkeleton rows={pageSize} cols={6} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No team members found.
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.department}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.batch}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.isAdmin ? "Yes" : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        disabled={busy}
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10 disabled:opacity-40"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${m.name}?`)) deleteMut.mutate(m.id);
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
