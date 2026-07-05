import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, LogIn, LogOut, UserCircle2 } from "lucide-react";
import logoAsset from "@/assets/Infocascade.png";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/api/auth";

const nav = [
  { to: "/", label: "Home" },
  { to: "/notices", label: "Notices" },
  { to: "/timetable", label: "Timetable" },
  { to: "/calculator", label: "SGPA" },
  { to: "/links", label: "Links" },
  { to: "/team", label: "Team" },

  { to: "/hiring", label: "Hiring" },
  { to: "/feedback", label: "Feedback" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, isHydrating } = useAuth();

  async function handleLogout() {
    setOpen(false);
    try {
      await authApi.logout();
      toast.success("Signed out");
      navigate({ to: "/" });
    } catch {
      toast.error("Sign out failed");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold tracking-tight"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-hero p-1 shadow-soft sm:h-11 sm:w-11">
            <img src={logoAsset} alt="InfoCascade" className="h-full w-full object-contain" />
          </span>
          <span className="truncate">InfoCascade</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {isHydrating ? (
            <div className="hidden h-8 w-28 animate-pulse rounded-full bg-muted/60 sm:block" />
          ) : isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground hover:text-background"
              >
                <UserCircle2 className="h-3.5 w-3.5 text-accent" />
                {user?.name || user?.email}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          ) : (
            <Link
              to="/student-login"
              className="hidden items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 sm:inline-flex"
            >
              <LogIn className="h-3.5 w-3.5" /> Login
            </Link>
          )}

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:bg-muted md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-muted text-foreground" }}
              >
                {n.label}
              </Link>
            ))}

            {isHydrating ? (
              <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
                Verifying session...
              </div>
            ) : isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="mt-1 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm"
                >
                  <UserCircle2 className="h-4 w-4 text-accent" />
                  <span className="font-medium">{user?.name || user?.email}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/student-login"
                  onClick={() => setOpen(false)}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background"
                >
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link
                  to="/student-signup"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm font-medium"
                >
                  Create account
                </Link>
              </>
            )}

            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-xs text-muted-foreground"
            >
              Admin Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-36 shrink-0 place-items-center overflow-hidden rounded-md bg-hero px-2 py-1 shadow-soft">
            <img src={logoAsset} alt="InfoCascade" className="h-full w-full object-contain" />
          </span>
          <span>· One stream of trusted campus information.</span>
        </div>
        <div className="flex gap-4">
          <Link to="/hiring" className="hover:text-foreground">
            Hiring
          </Link>
          <Link to="/timetable" className="hover:text-foreground">
            Timetable
          </Link>
          <Link to="/login" className="hidden hover:text-foreground md:inline">
            Admin login
          </Link>
        </div>
      </div>
    </footer>
  );
}
