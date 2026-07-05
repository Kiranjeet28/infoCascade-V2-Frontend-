import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  Loader2,
  LogOut,
  Megaphone,
  MessageSquareHeart,
  Users,
  UsersRound,
  UserSquare2,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";

function AdminSectionError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-surface/60 p-8 text-center backdrop-blur-xl">
      <h2 className="font-display text-xl font-semibold">Couldn't load this section</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error?.message?.includes("Network") || error?.message?.includes("fetch")
          ? "We couldn't reach the server. Check your connection and try again."
          : "There's no data yet or the request failed. You can try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        Try again
      </button>
    </div>
  );
}

function AdminAccessPending() {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-surface/70 px-4 py-3 text-sm text-muted-foreground backdrop-blur-xl">
        <Loader2 className="h-4 w-4 animate-spin" /> Verifying admin access…
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · InfoCascade" },
      { name: "description", content: "Manage notices, hiring, feedback, users and team." },
    ],
  }),
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;

    const user = await authApi.me().catch(() => null);
    if (!user || user.role !== "admin") {
      throw redirect({
        to: "/login",
        search: { redirect: location.href } as never,
      });
    }
  },
  pendingComponent: AdminAccessPending,
  component: AdminLayout,
  errorComponent: AdminSectionError,
});


const items: { to: string; label: string; icon: typeof Megaphone; exact?: boolean }[] = [
  { to: "/admin/notices", label: "Notices", icon: Megaphone },
  { to: "/admin/hiring", label: "Hiring", icon: UserSquare2 },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquareHeart },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/team", label: "Team", icon: UsersRound },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Ambient gradients */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-mint-gradient opacity-20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[460px] w-[460px] rounded-full bg-hero opacity-30 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-60 shrink-0 rounded-3xl border border-white/10 bg-surface/60 p-4 backdrop-blur-xl md:flex md:flex-col">
          <Link to="/" className="flex items-center gap-2 px-2 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-hero text-primary-foreground">
              <Waves className="h-4 w-4" />
            </span>
            <span className="font-display font-semibold">InfoCascade</span>
          </Link>

          <nav className="mt-6 grid gap-1">
            {items.map((it) => {
              const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${active
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-2">
            <button
              type="button"
              onClick={async () => {
                await authApi.logout();
                toast.success("Signed out");
                navigate({ to: "/login" });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            <Link
              to="/"
              className="rounded-xl px-3 py-2 text-center text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back to site
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="fixed inset-x-0 bottom-3 z-50 mx-3 rounded-2xl border border-white/10 bg-surface/80 p-1 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between">
            {items.map((it) => {
              const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition ${active ? "bg-white/10 text-foreground" : "text-muted-foreground"
                    }`}
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
