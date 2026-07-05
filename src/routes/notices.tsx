import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Megaphone, Search, Share2, SortDesc, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { noticesApi, type Notice } from "@/api/notices";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/notices")({
  head: () => ({
    meta: [
      { title: "Notices — InfoCascade" },
      { name: "description", content: "Browse verified GNDEC campus notices." },
      { property: "og:title", content: "Notices — InfoCascade" },
      { property: "og:description", content: "One stream of trusted campus information." },
    ],
  }),
  component: NoticesPage,
});

const PAGE_SIZE = 9;

function plainPreview(html: string, max = 180): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function NoticeCard({ n }: { n: Notice }) {
  const preview = plainPreview(n.htmlContent);

  function openSource() {
    if (!n.url) return;
    window.open(n.url, "_blank", "noopener,noreferrer");
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    // Share our own site URL so recipients land on InfoCascade, not the
    // college site directly. From here they can click through to the source.
    const siteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/notices`
        : "/notices";
    const shareText = `📢 ${n.title}\n\n${preview}\n\n🔗 Read on InfoCascade: ${siteUrl}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: n.title, text: shareText });
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Notice copied to clipboard");
    } catch {
      toast.error("Unable to share this notice");
    }
  }

  return (
    <article
      onClick={openSource}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openSource();
        }
      }}
      className="group flex cursor-pointer flex-col rounded-2xl border border-border bg-surface p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <User className="h-3 w-3" />
          {n.author || "GNDEC"}
        </span>
        <span>{n.date || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "")}</span>
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-snug group-hover:text-accent">
        {n.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{preview}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="opacity-0 transition group-hover:opacity-100">
          Click to view on college site →
        </span>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          aria-label={`Share notice: ${n.title}`}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      </div>
    </article>
  );
}



function NoticesPage() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const noticesQuery = useQuery({
    queryKey: ["notices", { search, sort, page, pageSize: PAGE_SIZE }],
    queryFn: () => noticesApi.list({ search, sort, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const total = noticesQuery.data?.total ?? 0;
  const totalPages = noticesQuery.data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Verified campus feed
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold md:text-5xl">Notices</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every official notice, scraped and verified — in one searchable feed.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 focus-within:border-foreground">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, author or date…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => setSort((s) => (s === "latest" ? "oldest" : "latest"))}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm transition hover:bg-muted"
            >
              <SortDesc className="h-4 w-4" />
              {sort === "latest" ? "Latest first" : "Oldest first"}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {noticesQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        ) : noticesQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="font-medium text-destructive">Failed to load notices.</p>
            <button
              type="button"
              onClick={() => noticesQuery.refetch()}
              className="mt-3 rounded-full bg-foreground px-4 py-2 text-sm text-background"
            >
              Try again
            </button>
          </div>
        ) : total === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-display text-xl font-semibold">No notices match</h3>
            <p className="text-sm text-muted-foreground">
              Try clearing the search or come back later.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {noticesQuery.data!.items.map((n) => (
                <NoticeCard key={n.id} n={n} />
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {total} notice{total === 1 ? "" : "s"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}



      </section>

      <SiteFooter />
    </div>
  );
}
