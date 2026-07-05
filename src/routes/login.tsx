import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — InfoCascade" },
      { name: "description", content: "Sign in to manage notices." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      await authApi.login({ email: email.trim(), password });
      const me = await authApi.me();
      toast.success("Signed in");
      navigate({ to: me.role === "admin" ? "/admin" : "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-background px-6">
      <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
      <form
        onSubmit={onSubmit}
        className="relative grid w-full max-w-md gap-5 rounded-3xl border border-border bg-surface px-8 py-10 shadow-elevated"
      >
        <div className="grid place-items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-hero text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Admin sign in</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Restricted access. Use your administrator credentials.
          </p>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-accent">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="admin@example.com"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Password
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-accent">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="••••••••"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Not an admin?{" "}
          <Link to="/" className="text-accent hover:underline">
            Back to home
          </Link>
        </p>
      </form>
    </div>
  );
}
