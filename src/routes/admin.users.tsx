import { SectionError } from "@/components/section-error";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usersApi, type UserRecord } from "@/api/users";
import { AdminPagination, TableSkeleton } from "@/components/admin-pagination";
import { DEFAULT_PAGE_SIZE } from "@/api/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { requireAdminAccess } from "@/lib/admin-access";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: async ({ location }) => {
    await requireAdminAccess(location.href);
  },
  component: AdminUsers,
  errorComponent: SectionError,
});

type EditableKeys = "name" | "email" | "department" | "branch" | "year" | "urn" | "crn" | "group";
const EDITABLE: EditableKeys[] = [
  "name",
  "email",
  "department",
  "branch",
  "year",
  "urn",
  "crn",
  "group",
];

function AdminUsers() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [role, setRole] = useState<"" | "admin" | "student">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editing, setEditing] = useState<UserRecord | null>(null);

  // Reset page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, role, pageSize]);

  const queryKey = ["users", { page, pageSize, search, role }] as const;
  const list = useQuery({
    queryKey,
    queryFn: () => usersApi.list({ page, pageSize, search, role }),
    placeholderData: keepPreviousData,
  });

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = list.data?.totalPages ?? 1;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserRecord> }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success("User updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("User deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy = list.isFetching || updateMut.isPending || deleteMut.isPending;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs font-medium uppercase tracking-wider text-accent">Manage</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Users</h1>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-surface/60 px-4 py-2.5 backdrop-blur-xl">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, URN, CRN, department…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          className="rounded-2xl border border-white/10 bg-surface/60 px-3 py-2.5 text-sm outline-none backdrop-blur-xl"
        >
          <option value="" className="bg-background">
            All roles
          </option>
          <option value="admin" className="bg-background">
            Admin
          </option>
          <option value="student" className="bg-background">
            Student
          </option>
        </select>
      </div>

      {list.isError && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>Failed to load users.</span>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const payload: Partial<UserRecord> = {};
            for (const k of EDITABLE) payload[k] = editing[k] ?? "";
            updateMut.mutate({ id: editing.id, payload });
          }}
          className="grid gap-3 rounded-3xl border border-white/10 bg-surface/60 p-6 backdrop-blur-xl md:grid-cols-4"
        >
          {EDITABLE.map((k) => (
            <label key={k} className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {k}
              </span>
              <input
                value={editing[k] ?? ""}
                onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-background/50 px-3 py-2 text-sm outline-none focus:border-white/30"
              />
            </label>
          ))}
          <div className="flex items-end gap-2 md:col-span-4">
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              {updateMut.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Dept</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">URN</th>
              <th className="px-4 py-3">CRN</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <TableSkeleton rows={pageSize} cols={8} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.role ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.department ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.year ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.urn ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.crn ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(u)}
                        disabled={busy}
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10 disabled:opacity-40"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete ${u.name}?`)) deleteMut.mutate(u.id);
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
