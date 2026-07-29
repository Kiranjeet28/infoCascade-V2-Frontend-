import { useEffect } from "react";
import { Eye, Users, Activity } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getVisitorStats } from "@/lib/visitor-stats.functions";

const COUNTER_RENDER_URL =
    "https://www.freevisitorcounters.com/en/counter/render/1607868/t/0";

// Registers one hit per browser page load (the vendor counts image loads).
let hitRegistered = false;

type VisitorCounterProps = {
    className?: string;
    size?: "sm" | "lg";
};

function formatNumber(n: number): string {
    return n.toLocaleString("en-IN");
}

export function VisitorCounter({ className = "", size = "sm" }: VisitorCounterProps) {
    const fetchStats = useServerFn(getVisitorStats);
    const queryClient = useQueryClient();
    const { data } = useQuery({
        queryKey: ["visitor-stats"],
        queryFn: () => fetchStats(),
        refetchInterval: 60_000,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (hitRegistered) return;
        hitRegistered = true;
        const img = new Image();
        img.onload = () => {
            // Give the vendor a moment to persist the hit, then re-read live stats.
            setTimeout(
                () => queryClient.invalidateQueries({ queryKey: ["visitor-stats"] }),
                1500,
            );
        };
        img.src = `${COUNTER_RENDER_URL}?t=${Date.now()}`;
    }, [queryClient]);


    const today = data?.today ?? 0;
    const all = data?.all ?? 0;
    const online = data?.online ?? 0;

    if (size === "lg") {
        return (
            <div
                aria-label="Live visitor stats"
                title="Live visitor stats"
                className={
                    "group relative flex flex-wrap items-center gap-5 rounded-2xl border border-border/70 bg-surface/80 px-6 py-4 shadow-soft backdrop-blur-md " +
                    className
                }
            >
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Live
                    </span>
                </div>

                <Stat icon={Activity} label="Online now" value={data ? formatNumber(online) : "—"} />
                <span className="hidden h-8 w-px bg-border/80 sm:block" aria-hidden />
                <Stat icon={Eye} label="Today" value={data ? formatNumber(today) : "—"} />
                <span className="hidden h-8 w-px bg-border/80 sm:block" aria-hidden />
                <Stat icon={Users} label="All time" value={data ? formatNumber(all) : "—"} />
            </div>
        );
    }

    return (
        <div
            aria-label="Live visitor counter"
            title={data ? `${formatNumber(online)} online · ${formatNumber(all)} all time` : "Live visitors"}
            className={
                "group relative inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/70 px-3 py-1.5 text-xs font-medium text-foreground shadow-soft backdrop-blur-md " +
                className
            }
        >
            <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <Eye className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Live
            </span>
            <span className="h-4 w-px bg-border/80" aria-hidden />
            <span className="tabular-nums">{data ? formatNumber(all) : "—"}</span>
        </div>
    );
}

function Stat({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Eye;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground transition group-hover:text-accent" />
            <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
                <span className="font-display text-lg font-semibold tabular-nums text-foreground">
                    {value}
                </span>
            </div>
        </div>
    );
}
