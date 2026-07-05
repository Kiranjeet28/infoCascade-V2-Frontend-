import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calculator,
  GraduationCap,
  Info,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "GNDEC SGPA & CGPA Calculator — InfoCascade" },
      {
        name: "description",
        content:
          "Free GNDEC SGPA and CGPA calculator. Per-semester grade points using the official Guru Nanak Dev Engineering College formula.",
      },
      { property: "og:title", content: "GNDEC SGPA & CGPA Calculator — InfoCascade" },
      {
        property: "og:description",
        content: "Compute your SGPA and CGPA the GNDEC way, in seconds.",
      },
    ],
  }),
  component: CalculatorPage,
});

/* ------------------------------------------------------------------ */
/* GNDEC formula
   - normalise marks to /100  →  percentage = marks / max * 100
   - gradePoint = min(10, floor(percentage / 10) + 1)
   - SGPA = Σ(gradePoint × credit) / Σ(credit)
   - CGPA = Σ(SGPA × semesterCredits) / Σ(semesterCredits)
     (when every semester has the same weight, this is just the mean)
------------------------------------------------------------------- */
function gradePoint(marks: number, max: number): number {
  if (!Number.isFinite(marks) || !Number.isFinite(max) || max <= 0) return 0;
  const pct = (marks / max) * 100;
  if (pct < 0) return 0;
  const gp = Math.floor(pct / 10) + 1;
  return Math.min(10, Math.max(0, gp));
}

interface Subject {
  id: string;
  name: string;
  marks: string; // controlled input as string
  max: string;
  credit: string;
}

const newSubject = (init: Partial<Subject> = {}): Subject => ({
  id: crypto.randomUUID(),
  name: "",
  marks: "",
  max: "100",
  credit: "3",
  ...init,
});

/* ---- Presets pulled from CoderRaushan/RausNotes39 ---- */
type Preset = { id: string; label: string; subjects: Omit<Subject, "id" | "marks">[] };

const PRESETS: Preset[] = [
  {
    id: "cse-sem3",
    label: "CSE · Sem 3",
    subjects: [
      { name: "PAS", max: "100", credit: "3" },
      { name: "DBMS", max: "100", credit: "3" },
      { name: "PY (Python)", max: "100", credit: "3" },
      { name: "OS", max: "100", credit: "4" },
      { name: "WT", max: "100", credit: "3" },
      { name: "CAM", max: "100", credit: "1" },
      { name: "DBMS Lab", max: "50", credit: "2" },
      { name: "PY Lab", max: "50", credit: "1" },
      { name: "OS Lab", max: "50", credit: "1" },
      { name: "DCLD Lab", max: "50", credit: "1" },
    ],
  },
  {
    id: "cse-sem4",
    label: "CSE · Sem 4",
    subjects: [
      { name: "Discrete Mathematics", max: "100", credit: "3" },
      { name: "CAM", max: "100", credit: "3" },
      { name: "OS", max: "100", credit: "3" },
      { name: "DS", max: "100", credit: "3" },
      { name: "SE", max: "100", credit: "3" },
      { name: "CAM Lab", max: "50", credit: "1" },
      { name: "OS Lab", max: "50", credit: "1" },
      { name: "DS Lab", max: "50", credit: "1" },
      { name: "MPD", max: "50", credit: "1" },
    ],
  },
  {
    id: "cse-sem5",
    label: "CSE · Sem 5",
    subjects: [
      { name: "AI", max: "100", credit: "3" },
      { name: "DBMS", max: "100", credit: "3" },
      { name: "FL & AT", max: "100", credit: "3" },
      { name: "D&AA", max: "100", credit: "3" },
      { name: "Elective-1", max: "100", credit: "3" },
      { name: "Training-2", max: "100", credit: "1" },
      { name: "AI Lab", max: "50", credit: "1" },
      { name: "DBMS Lab", max: "50", credit: "1" },
      { name: "D&AA Lab", max: "50", credit: "1" },
    ],
  },
  {
    id: "cse-sem6",
    label: "CSE · Sem 6",
    subjects: [
      { name: "CD", max: "100", credit: "3" },
      { name: "CG", max: "100", credit: "3" },
      { name: "ML", max: "100", credit: "3" },
      { name: "Cyber Security", max: "100", credit: "3" },
      { name: "Elective-II", max: "100", credit: "3" },
      { name: "Open Elective-I", max: "100", credit: "3" },
      { name: "CG Lab", max: "50", credit: "1" },
      { name: "ML Lab", max: "50", credit: "1" },
      { name: "Elective-II Lab", max: "50", credit: "1" },
      { name: "Minor Project", max: "100", credit: "2" },
      { name: "MPD", max: "50", credit: "1" },
    ],
  },
  {
    id: "blank",
    label: "Custom — add your own subjects",
    subjects: [
      { name: "Subject 1", max: "100", credit: "3" },
      { name: "Subject 2", max: "100", credit: "3" },
      { name: "Lab 1", max: "50", credit: "1" },
    ],
  },
];

function CalculatorPage() {
  const [mode, setMode] = useState<"sgpa" | "cgpa">("sgpa");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-mint-gradient opacity-25 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-6 py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Calculator className="h-3.5 w-3.5 text-accent" /> GNDEC formula
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            SGPA &amp; CGPA Calculator
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Uses the official Guru Nanak Dev Engineering College grading: marks → percentage →
            grade point <code className="rounded bg-muted px-1.5 py-0.5 text-xs">min(10, ⌊%/10⌋ + 1)</code> → credit-weighted SGPA.
          </p>

          <div className="mt-6 inline-flex rounded-full border border-border bg-surface p-1 shadow-soft">
            <button
              type="button"
              onClick={() => setMode("sgpa")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                mode === "sgpa"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SGPA
            </button>
            <button
              type="button"
              onClick={() => setMode("cgpa")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                mode === "cgpa"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              CGPA
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {mode === "sgpa" ? <SgpaCalculator /> : <CgpaCalculator />}

        <div className="mt-10 flex flex-col items-start gap-3 rounded-3xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2 text-foreground">
            <Info className="h-4 w-4 text-accent" />
            <span className="font-medium">How the GNDEC formula works</span>
          </div>
          <ol className="ml-5 list-decimal space-y-1">
            <li>Convert each subject's marks to a percentage out of 100.</li>
            <li>Grade point = <code className="rounded bg-muted px-1.5 py-0.5 text-xs">min(10, ⌊percentage / 10⌋ + 1)</code>.</li>
            <li>Multiply each grade point by the subject credit.</li>
            <li>SGPA = (Σ grade × credit) / (Σ credits).</li>
            <li>CGPA = credit-weighted average of all semester SGPAs.</li>
          </ol>
          <p>
            Calculator logic adapted from{" "}
            <a
              href="https://github.com/CoderRaushan/RausNotes39"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              CoderRaushan/RausNotes39
            </a>
            . Need a different syllabus? Pick <span className="font-medium text-foreground">Custom</span> and add rows.
          </p>
          <Link to="/timetable" className="text-foreground underline-offset-2 hover:underline">
            ← Back to timetable
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* -------------------- SGPA ---------------------- */
function SgpaCalculator() {
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    PRESETS[0].subjects.map((s) => newSubject(s)),
  );

  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
    setPresetId(id);
    setSubjects(p.subjects.map((s) => newSubject(s)));
  }

  function update(id: string, patch: Partial<Subject>) {
    setSubjects((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function add() {
    setSubjects((arr) => [...arr, newSubject({ name: `Subject ${arr.length + 1}` })]);
  }

  function remove(id: string) {
    setSubjects((arr) => arr.filter((s) => s.id !== id));
  }

  const { sgpa, totalCredits, breakdown } = useMemo(() => {
    let weighted = 0;
    let total = 0;
    const rows = subjects.map((s) => {
      const m = parseFloat(s.marks);
      const max = parseFloat(s.max);
      const cr = parseFloat(s.credit);
      const gp = gradePoint(m, max);
      const ok = Number.isFinite(m) && Number.isFinite(cr) && cr > 0;
      if (ok) {
        weighted += gp * cr;
        total += cr;
      }
      return { id: s.id, gp, contribution: ok ? gp * cr : 0, valid: ok };
    });
    const sgpaValue = total > 0 ? weighted / total : 0;
    return {
      sgpa: Math.floor(sgpaValue * 100) / 100,
      totalCredits: total,
      breakdown: rows,
    };
  }, [subjects]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Branch &amp; Semester
          </label>
          <select
            value={presetId}
            onChange={(e) => applyPreset(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => applyPreset(presetId)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Add subject
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
        <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_0.6fr_auto] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
          <span>Subject</span>
          <span>Marks</span>
          <span>Out of</span>
          <span>Credits</span>
          <span>Grade</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {subjects.map((s, i) => {
            const row = breakdown[i];
            return (
              <div
                key={s.id}
                className="grid grid-cols-2 gap-2 px-4 py-3 md:grid-cols-[1.6fr_1fr_1fr_1fr_0.6fr_auto] md:items-center md:gap-3"
              >
                <input
                  className="col-span-2 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 md:col-span-1"
                  value={s.name}
                  onChange={(e) => update(s.id, { name: e.target.value })}
                  placeholder="Subject name"
                />
                <input
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  inputMode="decimal"
                  placeholder="Marks"
                  value={s.marks}
                  onChange={(e) => update(s.id, { marks: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  inputMode="decimal"
                  placeholder="Max"
                  value={s.max}
                  onChange={(e) => update(s.id, { max: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  inputMode="decimal"
                  placeholder="Credit"
                  value={s.credit}
                  onChange={(e) => update(s.id, { credit: e.target.value })}
                />
                <span
                  className={`grid h-9 place-items-center rounded-lg text-sm font-semibold ${
                    row?.valid
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                  aria-label="Grade point"
                >
                  {row?.valid ? row.gp : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="grid h-9 w-9 place-items-center justify-self-end rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Remove subject"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {subjects.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No subjects yet — add one.
            </div>
          )}
        </div>
      </div>

      <ResultCard
        title="Your SGPA"
        value={sgpa.toFixed(2)}
        subtitle={`Across ${subjects.length} subjects · ${totalCredits} credits`}
      />
    </div>
  );
}

/* -------------------- CGPA ---------------------- */
interface SemRow {
  id: string;
  label: string;
  sgpa: string;
  credits: string;
}
const newSem = (i: number): SemRow => ({
  id: crypto.randomUUID(),
  label: `Semester ${i}`,
  sgpa: "",
  credits: "24",
});

function CgpaCalculator() {
  const [sems, setSems] = useState<SemRow[]>(() => [1, 2, 3, 4].map(newSem));

  function update(id: string, patch: Partial<SemRow>) {
    setSems((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function add() {
    setSems((arr) => [...arr, newSem(arr.length + 1)]);
  }
  function remove(id: string) {
    setSems((arr) => arr.filter((s) => s.id !== id));
  }
  function reset() {
    setSems([1, 2, 3, 4].map(newSem));
  }

  const { cgpa, totalCredits, count } = useMemo(() => {
    let weighted = 0;
    let total = 0;
    let n = 0;
    for (const s of sems) {
      const g = parseFloat(s.sgpa);
      const c = parseFloat(s.credits);
      if (Number.isFinite(g) && Number.isFinite(c) && c > 0 && g >= 0 && g <= 10) {
        weighted += g * c;
        total += c;
        n++;
      }
    }
    const v = total > 0 ? weighted / total : 0;
    return { cgpa: Math.floor(v * 100) / 100, totalCredits: total, count: n };
  }, [sems]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col items-stretch gap-3 rounded-3xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Enter each semester's SGPA and total credits. Use the SGPA tab above to compute any
          missing semester first.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Add semester
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
          <span>Semester</span>
          <span>SGPA (0–10)</span>
          <span>Credits</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {sems.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-2 gap-2 px-4 py-3 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center md:gap-3"
            >
              <input
                className="col-span-2 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 md:col-span-1"
                value={s.label}
                onChange={(e) => update(s.id, { label: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                inputMode="decimal"
                placeholder="e.g. 8.45"
                value={s.sgpa}
                onChange={(e) => update(s.id, { sgpa: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                inputMode="decimal"
                placeholder="Credits"
                value={s.credits}
                onChange={(e) => update(s.id, { credits: e.target.value })}
              />
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="grid h-9 w-9 place-items-center justify-self-end rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Remove semester"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ResultCard
        title="Your CGPA"
        value={cgpa.toFixed(2)}
        subtitle={`${count} semester${count === 1 ? "" : "s"} · ${totalCredits} credits`}
      />
    </div>
  );
}

function ResultCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-hero p-6 text-primary-foreground shadow-elevated md:flex-row md:items-center md:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-background/15">
          <GraduationCap className="h-6 w-6" />
        </span>
        <div>
          <div className="text-sm opacity-80">{title}</div>
          <div className="font-display text-4xl font-semibold md:text-5xl">{value}</div>
        </div>
      </div>
      <div className="text-sm opacity-80">{subtitle}</div>
    </div>
  );
}

