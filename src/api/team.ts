import { request } from "./client";
import { normalizePage, pickId, toQuery, type Paginated } from "./pagination";

export interface TeamMember {
  id: string;
  name: string;
  department: string;
  role: string;
  batch: string;
  bio?: string;
  isAdmin?: boolean;
  linkedin?: string | null;
  github?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export type TeamDraft = Omit<TeamMember, "id">;

export interface TeamQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  role?: string;
}

function mapTeam(t: Record<string, unknown>): TeamMember {
  return {
    id: pickId(t),
    name: (t.name as string) ?? "",
    department: (t.department as string) ?? "",
    role: (t.role as string) ?? "",
    batch: (t.batch as string) ?? "",
    bio: t.bio as string | undefined,
    isAdmin: Boolean(t.isAdmin),
    linkedin: (t.linkedin as string | null) ?? null,
    github: (t.github as string | null) ?? null,
    email: (t.email as string | null) ?? null,
    avatarUrl: (t.avatarUrl as string | null) ?? null,
  };
}

export const teamApi = {
  list: async (q: TeamQuery = {}): Promise<Paginated<TeamMember>> => {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const raw = await request<unknown>(
      `/api/team${toQuery({
        page,
        pageSize,
        search: q.search,
        department: q.department,
        role: q.role,
      })}`,
    );
    return normalizePage<TeamMember>(raw, { page, pageSize }, mapTeam);
  },
  get: (id: string) => request<TeamMember | null>(`/api/team/${id}`),
  count: async (): Promise<number> => {
    const raw = await request<unknown>(`/api/team/count`);
    if (typeof raw === "number") return raw;
    const obj = (raw ?? {}) as Record<string, unknown>;
    return (obj.count as number) ?? (obj.total as number) ?? 0;
  },

  create: (payload: TeamDraft) =>
    request<TeamMember>(`/api/team`, {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    }),
  update: (id: string, payload: Partial<TeamDraft>) =>
    request<TeamMember>(`/api/team/${id}`, {
      method: "PUT",
      body: payload as Record<string, unknown>,
    }),
  remove: (id: string) =>
    request<{ ok: true }>(`/api/team/${id}`, { method: "DELETE" }),
};
