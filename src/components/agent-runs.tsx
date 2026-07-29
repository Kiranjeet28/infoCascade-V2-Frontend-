import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, ExternalLink, RefreshCw, XCircle } from "lucide-react";
import { TableSkeleton } from "@/components/admin-pagination";

export interface WorkflowRun {
    id: number;
    name: string | null;
    display_title: string;
    status: string;
    conclusion: string | null;
    run_number: number;
    event: string;
    head_branch: string | null;
    created_at: string;
    updated_at: string;
    html_url: string;
}

async function fetchRuns(repo: string): Promise<{
    total_count: number;
    workflow_runs: WorkflowRun[];
}> {
    const response = await fetch(
        `https://api.github.com/repos/${repo}/actions/runs?per_page=30`,
        { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!response.ok) {
        throw new Error(`GitHub request failed [${response.status}]: ${await response.text()}`);
    }
    return response.json();
}

function StatusBadge({ run }: { run: WorkflowRun }) {
    const state = run.status !== "completed" ? "running" : (run.conclusion ?? "unknown");
    const map: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
        success: {
            label: "Success",
            cls: "border-accent/40 bg-accent/10 text-accent",
            Icon: CheckCircle2,
        },
        failure: {
            label: "Failed",
            cls: "border-destructive/40 bg-destructive/10 text-destructive",
            Icon: XCircle,
        },
        running: {
            label: "Running",
            cls: "border-white/20 bg-white/10 text-foreground",
            Icon: CircleDashed,
        },
    };
    const v = map[state] ?? {
        label: state.replace(/_/g, " "),
        cls: "border-white/10 bg-white/5 text-muted-foreground",
        Icon: CircleDashed,
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${v.cls}`}
        >
            <v.Icon className="h-3.5 w-3.5" /> {v.label}
        </span>
    );
}

function fmt(dt: string) {
    const d = new Date(dt);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function duration(a: string, b: string) {
    const ms = new Date(b).getTime() - new Date(a).getTime();
    if (!Number.isFinite(ms) || ms < 0) return "—";
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function AgentRuns({
    repo,
    eyebrow,
    title,
    queryKey,
}: {
    repo: string;
    eyebrow: string;
    title: string;
    queryKey: string;
}) {
    const runs = useQuery({
        queryKey: [queryKey, repo],
        queryFn: () => fetchRuns(repo),
        refetchInterval: 60_000,
    });

    const items = runs.data?.workflow_runs ?? [];
    const success = items.filter((r) => r.conclusion === "success").length;
    const failed = items.filter((r) => r.conclusion === "failure").length;
    const running = items.filter((r) => r.status !== "completed").length;

    const stats = [
        { label: "Total runs", value: runs.data?.total_count ?? 0 },
        { label: "Success", value: success },
        { label: "Failed", value: failed },
        { label: "In progress", value: running },
    ];

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-accent">{eyebrow}</div>
                    <h1 className="mt-1 font-display text-3xl font-semibold">{title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Workflow activity from {repo}.</p>
                </div>
                <button
                    type="button"
                    onClick={() => runs.refetch()}
                    disabled={runs.isFetching}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${runs.isFetching ? "animate-spin" : ""}`} /> Refresh
                </button>
            </header>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="rounded-2xl border border-white/10 bg-surface/60 p-4 backdrop-blur-xl"
                    >
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                        <div className="mt-1 font-display text-2xl font-semibold">{s.value}</div>
                    </div>
                ))}
            </div>

            {runs.isError && (
                <div className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <span>Failed to load workflow runs.</span>
                    <button
                        type="button"
                        onClick={() => runs.refetch()}
                        className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-surface/60 backdrop-blur-xl">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">Run</th>
                            <th className="px-4 py-3">Workflow</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Trigger</th>
                            <th className="px-4 py-3">Started</th>
                            <th className="px-4 py-3">Duration</th>
                            <th className="px-4 py-3 text-right">Logs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.isLoading ? (
                            <TableSkeleton rows={8} cols={7} />
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                    No runs found.
                                </td>
                            </tr>
                        ) : (
                            items.map((r) => (
                                <tr key={r.id} className="border-b border-white/5 last:border-0">
                                    <td className="px-4 py-3 font-medium">#{r.run_number}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{r.name ?? "Workflow"}</div>
                                        <div className="text-xs text-muted-foreground">{r.display_title}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge run={r} />
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {r.event}
                                        {r.head_branch ? ` · ${r.head_branch}` : ""}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{fmt(r.created_at)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {duration(r.created_at, r.updated_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            <a
                                                href={r.html_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs hover:bg-white/10"
                                            >
                                                View <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
