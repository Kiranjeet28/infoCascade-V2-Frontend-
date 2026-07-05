import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Megaphone,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Globe,
  Users,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { noticesApi } from "@/api/notices";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InfoCascade — One stream of trusted campus information" },
      { name: "description", content: "Academic updates, results, fees, events and live class info — all in one place." },
      { property: "og:title", content: "InfoCascade" },
      { property: "og:description", content: "One stream of trusted campus information." },
    ],
  }),
  component: Home,
});

const noticeAccents = ["from-accent to-mint", "from-secondary to-accent", "from-primary to-secondary"];

function plainPreview(html: string, max = 150): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function displayDate(date: string, createdAt?: string): string {
  if (date) return date;
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Home() {
  const latestNotices = useQuery({
    queryKey: ["home-latest-notices"],
    queryFn: () => noticesApi.list({ sort: "latest", page: 1, pageSize: 3 }),
  });
  const notices = latestNotices.data?.items ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
        <div className="absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-mint-gradient opacity-20 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Live · {latestNotices.data?.total ?? 0} notices from backend
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              One stream of <span className="bg-hero bg-clip-text text-transparent">trusted</span> campus information.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Academic notices, results, fees, events and timetables — flowing into a single, calm feed built for students and faculty.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/timetable"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
              >
                <Calendar className="h-4 w-4" />
                Open Timetable
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                to="/links"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Useful Links
              </Link>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
              <div>
                <div className="font-display text-2xl font-semibold">39k+</div>
                <div className="text-muted-foreground">Total visits</div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold">8</div>
                <div className="text-muted-foreground">Departments</div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold">24/7</div>
                <div className="text-muted-foreground">Always live</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick access bento - commented out
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Calendar, label: "Timetables", desc: "8 departments · daily view", to: "/timetable" },
            { icon: Megaphone, label: "Notices", desc: "Verified by admins", to: "/notices" },
            { icon: Globe, label: "Useful Links", desc: "Departments & portals", to: "/links" },
            { icon: BookOpen, label: "Results", desc: "Sem & re-eval updates", to: "/notices" },
            { icon: Users, label: "Hiring", desc: "Join the team", to: "/hiring" },
          ].map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="group rounded-2xl border border-border bg-surface p-5 transition hover:shadow-elevated hover:-translate-y-0.5"
            >
              <c.icon className="h-5 w-5 text-accent" />
              <div className="mt-4 font-display text-lg font-semibold">{c.label}</div>
              <div className="text-sm text-muted-foreground">{c.desc}</div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground opacity-0 transition group-hover:opacity-100">
                Open <ArrowUpRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>
      */}


      {/* Latest updates */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-accent">Latest updates</div>
            <h2 className="mt-2 font-display text-4xl font-semibold">The feed, freshly poured.</h2>
          </div>
          <Link to="/notices" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline">
            View archive →
          </Link>
        </div>

        {latestNotices.isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        ) : latestNotices.isError ? (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
            Failed to load latest notices from backend.
          </div>
        ) : notices.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            No notices available from backend yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {notices.map((u, index) => (
            <article
              key={u.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${noticeAccents[index % noticeAccents.length]}`} />
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {u.author || "GNDEC"}
                </span>
                <span className="text-xs text-muted-foreground">{displayDate(u.date, u.createdAt)}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold leading-snug">
                {u.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{plainPreview(u.htmlContent)}</p>
              <div className="mt-6 flex items-center border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-hero text-[10px] font-semibold text-primary-foreground">
                    {(u.author || "GNDEC").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                  {u.author || "GNDEC"}
                </span>
              </div>
            </article>
            ))}
          </div>
        )}
      </section>

      {/* Team teaser */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-border bg-surface p-8 shadow-soft md:flex-row md:p-10">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {["KS", "KK", "JK", "AS"].map((i) => (
                <div key={i} className="grid h-11 w-11 place-items-center rounded-full bg-hero font-display text-xs font-semibold text-primary-foreground ring-4 ring-surface">
                  {i}
                </div>
              ))}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                <ShieldCheck className="h-3 w-3 text-accent" /> Admin verified
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold">Built and maintained by students.</h2>
              <p className="text-sm text-muted-foreground">Meet the crew keeping every notice verified and timely.</p>
            </div>
          </div>
          <Link
            to="/team"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            Meet the team <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
