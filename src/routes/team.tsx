import { SectionError } from "@/components/section-error";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertCircle, Github, Linkedin, Loader2, Mail, ShieldCheck, Sparkles, Users } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { teamApi, type TeamMember } from "@/api/team";
import { TEAM_BATCHES, DEFAULT_TEAM_BATCH } from "@/constants/team/batches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — InfoCascade" },
      { name: "description", content: "Meet the student-led crew building and maintaining InfoCascade." },
      { property: "og:title", content: "Team — InfoCascade" },
      { property: "og:description", content: "Meet the crew behind InfoCascade." },
    ],
  }),
  component: TeamPage,
  errorComponent: SectionError,
});

function Avatar({ name, src, large = false }: { name: string; src?: string | null; large?: boolean }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const size = large ? "h-28 w-28 text-2xl" : "h-20 w-20 text-xl";
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shadow-elevated ring-4 ring-background ${size}`}
      />
    );
  }
  return (
    <div
      className={`grid place-items-center rounded-full bg-hero font-display font-semibold text-primary-foreground shadow-elevated ring-4 ring-background ${size}`}
    >
      {initials}
    </div>
  );
}

function SocialRow({ m }: { m: TeamMember }) {
  const items: { icon: typeof Linkedin; href?: string | null }[] = [
    { icon: Linkedin, href: m.linkedin },
    { icon: Github, href: m.github },
    { icon: Mail, href: m.email ? `mailto:${m.email}` : null },
  ];
  return (
    <div className="mt-4 flex justify-center gap-2">
      {items.map(({ icon: Icon, href }, i) =>
        href ? (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-foreground hover:text-background"
          >
            <Icon className="h-4 w-4" />
          </a>
        ) : (
          <span
            key={i}
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-muted-foreground/40"
          >
            <Icon className="h-4 w-4" />
          </span>
        ),
      )}
    </div>
  );
}

function TeamPage() {
  // Public team page: request a large page from the server. Server-side batch
  // filtering isn't exposed; we still filter locally for the batch dropdown.
  const { data, isLoading, error } = useQuery({
    queryKey: ["team", { pageSize: 100 }],
    queryFn: () => teamApi.list({ page: 1, pageSize: 100 }),
  });

  const [selectedBatch, setSelectedBatch] = useState<string>(DEFAULT_TEAM_BATCH);

  const items = data?.items ?? [];
  const admins = items.filter((m) => m.isAdmin);

  const members = useMemo(() => {
    const all = items.filter((m) => !m.isAdmin);
    const filtered = selectedBatch
      ? all.filter((m) => String(m.batch) === selectedBatch)
      : all;
    return [...filtered].sort((a, b) =>
      String(b.batch).localeCompare(String(a.batch), undefined, { numeric: true }),
    );
  }, [items, selectedBatch]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-mint-gradient opacity-25 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Users className="h-3.5 w-3.5 text-accent" /> The crew
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            The people keeping the <span className="bg-hero bg-clip-text text-transparent">stream clean</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            A small student-led team verifies every notice, maintains timetables, and ships InfoCascade week after week.
          </p>
        </div>
      </section>

      {isLoading && (
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
        </div>
      )}

      {error && (
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-16 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> Failed to load team. Please retry.
        </div>
      )}

      {!isLoading && !error && admins.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-12">
          <div className="text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-accent">Admin</div>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              {admins.length > 1 ? "Administrators" : "Primary administrator"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Manages notices & announcements</p>
          </div>

          <div className={`mx-auto mt-8 grid gap-6 ${admins.length > 1 ? "md:grid-cols-2" : "max-w-md"}`}>
            {admins.map((a) => (
              <div
                key={a.id}
                className="rounded-3xl border border-border bg-surface p-8 text-center shadow-elevated"
              >
                <div className="flex justify-center">
                  <Avatar name={a.name} src={a.avatarUrl} large />
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold">{a.name}</h3>
                <div className="text-xs text-muted-foreground">{a.department} · Batch {a.batch}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-hero px-3 py-1 text-xs font-medium text-primary-foreground">
                  <ShieldCheck className="h-3 w-3" /> {a.role}
                </div>

                {a.bio && <p className="mt-4 text-sm text-muted-foreground">{a.bio}</p>}
                <SocialRow m={a} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!isLoading && !error && (
        <section className="mx-auto max-w-7xl px-6 pb-20">
          {members.length > 0 && (
            <>
              <div className="flex flex-col items-center gap-6 text-center">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-accent">Our team</div>
                  <h2 className="mt-2 font-display text-3xl font-semibold">
                    Dedicated team that builds and maintains InfoCascade
                  </h2>
                </div>
                <div className="w-full max-w-[200px]">
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_BATCHES.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-5">
                {members.map((m) => (
                  <article
                    key={m.id}
                    className="group relative w-full overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-elevated sm:w-[calc(50%-0.625rem)] md:w-[calc(33.333%-0.834rem)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-mint-gradient" />
                    <div className="flex justify-center">
                      <Avatar name={m.name} src={m.avatarUrl} />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold">{m.name}</h3>
                    <div className="text-xs text-muted-foreground">{m.department} · Batch {m.batch}</div>
                    <div className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      {m.role}
                    </div>

                    {m.bio && <p className="mt-4 text-sm text-muted-foreground">{m.bio}</p>}
                    <SocialRow m={m} />
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-3xl bg-hero p-8 text-primary-foreground md:flex-row md:p-10">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" />
              <div>
                <div className="font-display text-xl font-semibold">Want to join the crew?</div>
                <div className="text-sm opacity-80">We're always looking for curious students.</div>
              </div>
            </div>
            <a
              href="/hiring"
              className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:opacity-90"
            >
              See open roles →
            </a>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
