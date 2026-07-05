import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Linkedin,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { hiringApi, type HiringInput } from "@/api/hiring";
import { useSubmissionLock } from "@/hooks/use-submission-lock";
import {
  HIRING_BATCHES,
  DEFAULT_HIRING_BATCH,
  LATEST_HIRING_BATCH,
} from "@/constants/hiring/batches";

const DEPARTMENT_OPTIONS = [
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


export const Route = createFileRoute("/hiring")({
  head: () => ({
    meta: [
      { title: "Hiring — InfoCascade" },
      {
        name: "description",
        content: "Apply to join the InfoCascade student team for the 2028 batch.",
      },
      { property: "og:title", content: "Hiring — InfoCascade" },
      {
        property: "og:description",
        content: "Open roles for students. Engineering, design, content and outreach.",
      },
    ],
  }),
  component: HiringPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2, "Full name is too short").max(100),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .max(255),
  department: z.string().min(1, "Choose a department"),
  batch: z.string().min(1, "Choose a batch"),
  urn: z
    .string()
    .trim()
    .min(6, "URN must be at least 6 characters")
    .max(15, "URN is too long")
    .regex(/^[A-Za-z0-9-]+$/, "URN can only contain letters, numbers and hyphens"),
});

type FieldErrors = Partial<Record<keyof HiringInput, string>>;

function HiringPage() {


  const [form, setForm] = useState<HiringInput>({
    fullName: "",
    email: "",
    department: "",
    batch: DEFAULT_HIRING_BATCH,
    urn: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const lock = useSubmissionLock("hiring");
  const [lastAttempt, setLastAttempt] = useState(0);

  const mutation = useMutation({
    mutationFn: (input: HiringInput) => hiringApi.create(input),
    onSuccess: () => {
      toast.success("Application submitted. We'll be in touch!");
      lock.markSubmitted();
      setSubmitted(true);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not submit application.");
    },
  });

  function set<K extends keyof HiringInput>(key: K, value: HiringInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.alreadySubmitted) {
      toast.error("You've already submitted an application from this device.");
      return;
    }
    const now = Date.now();
    if (now - lastAttempt < 3000) {
      toast.error("Please wait a few seconds before retrying.");
      return;
    }
    setLastAttempt(now);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        fe[issue.path[0] as keyof HiringInput] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> We're hiring for batch {LATEST_HIRING_BATCH}
          </span>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight md:text-6xl">
            Build the campus information layer with us.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Engineering, design, content and outreach. Open to all departments — register below
            and our coordinator will get in touch.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.2fr_1fr]">
        {/* Form */}
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent">
            <Briefcase className="h-3.5 w-3.5" /> Student Registration
          </div>
          <h2 className="mt-2 font-display text-3xl font-semibold">Apply for the team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll review applications batch by batch. Make sure your URN matches your college records.
          </p>

          {submitted || lock.alreadySubmitted ? (
            <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
              <h3 className="mt-3 font-display text-xl font-semibold">Application received</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {submitted && form.fullName
                  ? <>Thanks {form.fullName.split(" ")[0]}. Coordinator Kiranjeet Kour will reach out at <span className="text-foreground">{form.email}</span>.</>
                  : "We've already recorded an application from this device. Only one submission per person is allowed."}
              </p>
            </div>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
              <Field
                label="Full name"
                value={form.fullName}
                onChange={(v) => set("fullName", v)}
                placeholder="Jane Singh"
                error={errors.fullName}
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="you@gndec.ac.in"
                error={errors.email}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Department"
                  value={form.department}
                  onChange={(v) => set("department", v)}
                  options={["", ...DEPARTMENT_OPTIONS]}
                  placeholder="Select department"
                  error={errors.department}
                />
                <SelectField
                  label="Batch"
                  value={form.batch}
                  onChange={(v) => set("batch", v)}
                  options={[...HIRING_BATCHES]}
                  error={errors.batch}

                />
              </div>
              <Field
                label="URN"
                value={form.urn}
                onChange={(v) => set("urn", v)}
                placeholder="2410123"
                error={errors.urn}
              />
              <button
                type="submit"
                disabled={mutation.isPending}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
              >
                {mutation.isPending ? "Submitting…" : "Submit application"}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* Coordinator + roles */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent">
              <Users className="h-3.5 w-3.5" /> Contact
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-hero font-display text-base font-semibold text-primary-foreground">
                KK
              </div>
              <div>
                <div className="font-display text-lg font-semibold">Kiranjeet Kour</div>
                <div className="text-sm text-muted-foreground">Hiring Coordinator</div>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              <a
                href="https://www.linkedin.com/in/kiranjeet28/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                <Linkedin className="h-4 w-4 text-accent" /> LinkedIn
              </a>
              <a
                href="mailto:kiranjeetkour144@gmail.com"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
              >
                <Mail className="h-4 w-4" /> Email Kiranjeet
              </a>
            </div>
          </div>



          <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted-foreground shadow-soft">
            Already a member?{" "}
            <Link to="/student-login" className="font-medium text-foreground underline underline-offset-4">
              Sign in
            </Link>{" "}
            to your student account.
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground"
      >
        {options.map((o) =>
          o === "" ? (
            <option key="placeholder" value="">
              {placeholder ?? "Select…"}
            </option>
          ) : (
            <option key={o} value={o}>
              {o}
            </option>
          ),
        )}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </label>
  );
}
