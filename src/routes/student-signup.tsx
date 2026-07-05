import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, GraduationCap, KeyRound, Mail, User, BookOpen, Calendar } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { ApiError } from "@/api/client";

export const Route = createFileRoute("/student-signup")({
  head: () => ({
    meta: [
      { title: "Create Student Account — InfoCascade" },
      { name: "description", content: "Register for InfoCascade as a student." },
    ],
  }),
  component: StudentSignupPage,
});

const BRANCH_OPTIONS = [
  "Applied Science",
  "BCA",
  "Civil Engineering",
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Electrical Engineering",
  "Information Technology",
  "Mechanical Engineering",
  "Other",
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  branch: z.string().trim().max(40).optional().or(z.literal("")),
  batch: z.string().trim().max(20).optional().or(z.literal("")),
});

type FormState = z.infer<typeof schema>;
type Errors = Partial<Record<keyof FormState, string>>;

const empty: FormState = {
  name: "",
  email: "",
  password: "",
  branch: "",
  batch: "",
};

function StudentSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [branchSelect, setBranchSelect] = useState<string>("");
  const [otherBranch, setOtherBranch] = useState<string>("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);


  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const branchValue = branchSelect === "Other" ? otherBranch.trim() : branchSelect;
    const parsed = schema.safeParse({ ...form, branch: branchValue });

    if (!parsed.success) {
      const fe: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState;
        fe[k] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      // Role is always "student" — admins are created from the admin dashboard.
      await authApi.register({ ...parsed.data, role: "student" });
      try {
        await authApi.studentLogin({ email: parsed.data.email, password: parsed.data.password });
      } catch {
        /* already logged in via register token */
      }
      toast.success("Account created. Welcome!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Sign-up failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
      <div className="absolute -right-40 -top-40 h-[460px] w-[460px] rounded-full bg-mint-gradient opacity-25 blur-3xl" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col px-6 py-8">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="mt-8 rounded-3xl border border-border bg-surface shadow-elevated">
          <div className="rounded-t-3xl bg-hero px-8 py-8 text-center text-white">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-background/15 backdrop-blur">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold">Create your account</h1>
            <p className="mt-1 text-sm opacity-80">
              Subscribe to notices, save your timetable, and more.
            </p>
          </div>

          <form className="grid gap-4 px-8 py-8 md:grid-cols-2" onSubmit={onSubmit} noValidate>
            <Field label="Full name" icon={User} error={errors.name} className="md:col-span-2">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Jaspreet Kaur"
                className="w-full bg-transparent text-sm outline-none"
              />
            </Field>

            <Field label="Email" icon={Mail} error={errors.email} className="md:col-span-2">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@gndec.ac.in"
                className="w-full bg-transparent text-sm outline-none"
              />
            </Field>

            <Field label="Password" icon={KeyRound} error={errors.password} className="md:col-span-2">
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-transparent text-sm outline-none"
              />
            </Field>

            <Field label="Branch" icon={BookOpen} error={errors.branch}>
              <select
                value={branchSelect}
                onChange={(e) => setBranchSelect(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="" disabled>
                  Select your branch
                </option>
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b} className="bg-background text-foreground">
                    {b}
                  </option>
                ))}
              </select>

            </Field>

            {branchSelect === "Other" && (
              <Field label="Other branch" icon={BookOpen}>
                <input
                  value={otherBranch}
                  onChange={(e) => setOtherBranch(e.target.value)}
                  placeholder="Type your branch / department"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </Field>
            )}


            <Field label="Batch" icon={Calendar} error={errors.batch}>
              <input
                value={form.batch}
                onChange={(e) => update("batch", e.target.value)}
                placeholder="e.g. 2024-2028"
                className="w-full bg-transparent text-sm outline-none"
              />
            </Field>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create account →"}
              </button>

              <div className="mt-3 text-center text-xs text-muted-foreground">
                Already registered?{" "}
                <Link to="/student-login" className="text-foreground underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  error,
  className = "",
  children,
}: {
  label: string;
  icon?: typeof Mail;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:border-foreground">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </label>
  );
}
