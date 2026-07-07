import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, User, Loader2, AlertCircle } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable — InfoCascade" },
      { name: "description", content: "Department timetables, daily view." },
    ],
  }),
  component: TimetablePage,
});

const DATA_BASE =
  "https://raw.githubusercontent.com/Kiranjeet28/infocascade-data/main/web";

const departments: { key: string; label: string }[] = [
  { key: "appliedscience", label: "Applied Science" },
  { key: "bca", label: "BCA" },
  { key: "civil", label: "Civil Engineering" },
  { key: "cse", label: "Computer Science & Engineering" },
  { key: "ece", label: "Electronics & Communication" },
  { key: "electrical", label: "Electrical Engineering" },
  { key: "it", label: "Information Technology" },
  { key: "mechanical", label: "Mechanical Engineering" },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface EntryItem {
  subject: string | null;
  teacher: string | null;
  classRoom: string | null;
}

interface ClassEntry {
  dayOfClass: string;
  timeOfClass: string;
  data: {
    // Legacy flat shape (kept for backward compatibility)
    subject?: string | null;
    teacher?: string | null;
    classRoom?: string | null;
    // New shape from data source
    entries?: EntryItem[] | null;
    elective?: boolean;
    freeClass?: boolean;
    Lab?: boolean;
    Tut?: boolean;
    OtherDepartment?: boolean;
  };
}

interface TimetableDoc {
  url?: string;
  timetable: Record<string, { classes: ClassEntry[] }>;
}

/**
 * Class type detection order
 *
 * | Condition                                        | Label            |
 * |--------------------------------------------------|------------------|
 * | freeClass === true                               | Free             |
 * | OtherDepartment === true                         | Mandatory        |
 * | Lab === true                                     | Lab              |
 * | Tut === true                                     | Tut              |
 * | elective === true (may have multiple entries)    | Elective         |
 * | (default)                                        | Lecture          |
 */
type ClassType = "FREE" | "MAND" | "LAB" | "TUT" | "ELEC" | "LEC";

function classifyType(d: ClassEntry["data"]): ClassType {
  if (d.freeClass) return "FREE";
  if (d.OtherDepartment) return "MAND";
  if (d.Lab) return "LAB";
  if (d.Tut) return "TUT";
  if (d.elective) return "ELEC";
  return "LEC";
}

const typeStyles: Record<ClassType, string> = {
  FREE: "bg-muted text-muted-foreground",
  MAND: "bg-destructive/15 text-destructive",
  LAB: "bg-accent/15 text-accent",
  TUT: "bg-secondary/15 text-secondary",
  ELEC: "bg-primary/15 text-primary",
  LEC: "bg-primary/10 text-primary",
};

const typeLabels: Record<ClassType, string> = {
  FREE: "FREE",
  MAND: "MAND",
  LAB: "LAB",
  TUT: "TUT",
  ELEC: "ELEC",
  LEC: "LEC",
};

function getEntries(d: ClassEntry["data"]): EntryItem[] {
  if (Array.isArray(d.entries) && d.entries.length > 0) return d.entries;
  if (d.subject || d.teacher || d.classRoom) {
    return [{ subject: d.subject ?? null, teacher: d.teacher ?? null, classRoom: d.classRoom ?? null }];
  }
  return [];
}


async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load (${res.status})`);
  return res.json() as Promise<T>;
}

function TimetablePage() {
  const [dept, setDept] = useState(departments[3].key);
  const [day, setDay] = useState("Wednesday");
  const [group, setGroup] = useState<string | null>(null);

  const groupsQ = useQuery({
    queryKey: ["tt-groups", dept],
    queryFn: () => fetchJson<string[]>(`${DATA_BASE}/group/${dept}.json`),
  });

  const ttQ = useQuery({
    queryKey: ["tt-data", dept],
    queryFn: () => fetchJson<TimetableDoc>(`${DATA_BASE}/timetable_${dept}.json`),
  });

  const groups = groupsQ.data ?? [];
  const activeGroup = group && groups.includes(group) ? group : groups[0];

  const periods = useMemo(() => {
    if (!ttQ.data || !activeGroup) return [];
    const g = ttQ.data.timetable?.[activeGroup];
    if (!g) return [];
    return g.classes
      .filter((c) => c.dayOfClass === day)
      .sort((a, b) => a.timeOfClass.localeCompare(b.timeOfClass));
  }, [ttQ.data, activeGroup, day]);

  const deptLabel = departments.find((d) => d.key === dept)?.label ?? dept;
  const loading = groupsQ.isLoading || ttQ.isLoading;
  const error = groupsQ.error || ttQ.error;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft md:p-10">
          <div className="flex flex-col gap-2 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-accent" /> Department Timetables
            </div>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">Find your next class.</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Pick a department, choose your group, then switch days.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {departments.map((d) => (
              <button
                key={d.key}
                onClick={() => {
                  setDept(d.key);
                  setGroup(null);
                }}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${dept === d.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-foreground hover:bg-muted"
                  }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[240px_1fr] md:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Select group
              </label>
              <select
                value={activeGroup ?? ""}
                onChange={(e) => setGroup(e.target.value)}
                disabled={groupsQ.isLoading || groups.length === 0}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
              >
                {groups.length === 0 && <option value="">—</option>}
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl bg-hero px-5 py-4 text-primary-foreground">
              <div className="text-xs opacity-80">Now viewing</div>
              <div className="font-display text-lg font-semibold">
                {deptLabel}
                {activeGroup ? ` · ${activeGroup}` : ""}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${day === d
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-foreground hover:bg-muted"
                  }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading timetable…
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> Failed to load timetable. Please retry.
              </div>
            ) : periods.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No periods scheduled for {day}.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {periods.map((p, i) => {
                  const t = classifyType(p.data);
                  const entries = getEntries(p.data);
                  const isMand = t === "MAND";
                  const isElective = t === "ELEC";
                  const fallbackTitle =
                    t === "FREE" ? "Free Period" : isMand ? "Mandatory Course" : "—";
                  const primary = entries[0];
                  const singleTitle = primary?.subject ?? fallbackTitle;
                  return (
                    <div
                      key={`${p.timeOfClass}-${i}`}
                      className="grid grid-cols-[70px_1fr] gap-4 px-4 py-4 md:grid-cols-[100px_90px_1fr] md:px-5"
                    >
                      <div className="font-display text-sm font-semibold">{p.timeOfClass}</div>
                      <div className="hidden md:block">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ${typeStyles[t]}`}
                        >
                          {typeLabels[t]}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide md:hidden ${typeStyles[t]}`}
                          >
                            {typeLabels[t]}
                          </span>
                          <div className="font-display text-sm font-semibold uppercase tracking-wide">
                            {isElective && entries.length > 1 ? "Elective — choose one" : singleTitle}
                          </div>
                        </div>

                        {isElective && entries.length > 1 ? (
                          <ul className="mt-2 space-y-2">
                            {entries.map((e, idx) => (
                              <li
                                key={idx}
                                className="rounded-lg border border-border bg-surface px-3 py-2"
                              >
                                <div className="text-sm font-semibold">{e.subject ?? "—"}</div>
                                <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                                  {e.teacher && (
                                    <span className="inline-flex items-center gap-1">
                                      <User className="h-3 w-3" /> {e.teacher}
                                    </span>
                                  )}
                                  {e.classRoom && (
                                    <span className="inline-flex items-center gap-1">
                                      <MapPin className="h-3 w-3" /> {e.classRoom}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          primary && (primary.teacher || primary.classRoom) && (
                            <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                              {primary.teacher && (
                                <span className="inline-flex items-center gap-1">
                                  <User className="h-3 w-3" /> {primary.teacher}
                                </span>
                              )}
                              {primary.classRoom && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {primary.classRoom}
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}

              </div>
            )}
          </div>

          {ttQ.data?.url && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Source:{" "}
              <a
                href={ttQ.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                official timetable
              </a>
            </p>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
