import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, GraduationCap, KeyRound, Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { ApiError } from "@/api/client";

export const Route = createFileRoute("/student-login")({
  head: () => ({
    meta: [
      { title: "Sign in — InfoCascade" },
      { name: "description", content: "Sign in or create your InfoCascade account." },
    ],
  }),
  component: StudentAuthPage,
});

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "student";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  const pretty = cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return pretty.length >= 2 ? pretty : "Student";
}

function isMissingAccountError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 401 || err.status === 404) return true;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("no user") ||
    msg.includes("invalid credentials") ||
    msg.includes("incorrect")
  );
}

function StudentAuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as "email" | "password";
        fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      // Try to sign in first.
      try {
        const s = await authApi.login(parsed.data);
        toast.success("Signed in. Welcome back!");
        navigate({ to: s.user.role === "admin" ? "/admin" : "/" });
        return;
      } catch (err) {
        if (!isMissingAccountError(err)) throw err;
      }

      // No account: create one, then sign in.
      await authApi.register({
        name: nameFromEmail(parsed.data.email),
        email: parsed.data.email,
        password: parsed.data.password,
        role: "student",
      });
      try {
        await authApi.login(parsed.data);
      } catch {
        /* already logged in via register token */
      }
      toast.success("Account created. Welcome!");
      navigate({ to: "/" });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not sign in. Try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
      <div className="absolute -right-40 -top-40 h-[460px] w-[460px] rounded-full bg-mint-gradient opacity-25 blur-3xl" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="mt-12 rounded-3xl border border-border bg-surface shadow-elevated">
          <div className="rounded-t-3xl bg-hero px-8 py-8 text-center text-primary-foreground">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-background/15 backdrop-blur">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold">Continue to InfoCascade</h1>
            <p className="mt-1 text-sm opacity-80">
              Enter your email and password. New here? We'll create your account.
            </p>
          </div>

          <form className="space-y-5 px-8 py-8" onSubmit={onSubmit} noValidate>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:border-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gndec.ac.in"
                  autoComplete="email"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:border-foreground">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
              )}
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Please wait…" : "Continue →"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to receive campus notices in your feed.
            </p>

            <p className="text-center text-sm text-muted-foreground">
              New to InfoCascade?{" "}
              <Link to="/student-signup" className="font-medium text-foreground hover:underline">
                Create an account
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
