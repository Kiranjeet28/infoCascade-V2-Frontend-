import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { LogOut, Mail, ShieldCheck, UserCircle2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { authApi } from "@/api/auth";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — InfoCascade" },
      { name: "description", content: "View your InfoCascade account details." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isHydrating } = useAuth();

  useEffect(() => {
    if (isHydrating) return;
    if (!isAuthenticated) navigate({ to: "/student-login" });
  }, [isAuthenticated, isHydrating, navigate]);

  async function handleLogout() {
    try {
      await authApi.logout();
      toast.success("Signed out");
      navigate({ to: "/" });
    } catch {
      toast.error("Sign out failed");
    }
  }

  if (!isAuthenticated) return null;
  if (isHydrating) return null;

  const name = user?.name ?? "Your profile";
  const email = user?.email ?? "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-6 py-14">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-hero text-primary-foreground shadow-elevated">
                <UserCircle2 className="h-8 w-8" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-accent" />
                  {user?.role === "admin" ? "Administrator" : "Student account"}
                </span>
                <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">{name}</h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-4 rounded-3xl border border-border bg-surface p-6 shadow-soft md:grid-cols-2 md:p-8">
          <Info label="Full name" value={user?.name} />
          <Info label="Email" value={user?.email} />
          <Info label="Branch" value={user?.branch} />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1 text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-foreground">{value || "—"}</span>
    </div>
  );
}
