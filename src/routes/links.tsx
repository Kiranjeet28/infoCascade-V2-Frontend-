import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Globe, Megaphone, GraduationCap, BookOpen } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "Useful Links — InfoCascade" },
      { name: "description", content: "Department websites, notices and important GNDEC links." },
      { property: "og:title", content: "Useful Links — InfoCascade" },
      { property: "og:description", content: "Department websites, notices and important GNDEC links." },
    ],
  }),
  component: LinksPage,
});

interface LinkItem {
  label: string;
  url: string;
  desc?: string;
}

const departments: LinkItem[] = [
  { label: "Applied Sciences", url: "https://appsc.gndec.ac.in/", desc: "Maths, Physics, Chemistry, Communication" },
  { label: "BCA", url: "https://bca.gndec.ac.in/", desc: "Bachelor of Computer Applications" },
  { label: "Civil Engineering", url: "https://civil.gndec.ac.in/", desc: "Department of Civil Engineering" },
  { label: "Computer Science & Engineering", url: "https://cse.gndec.ac.in/", desc: "Department of CSE" },
  { label: "Electronics & Communication", url: "https://ece.gndec.ac.in/", desc: "Department of ECE" },
  { label: "Electrical Engineering", url: "https://eed.gndec.ac.in/", desc: "Department of EE" },
  { label: "Information Technology", url: "https://it.gndec.ac.in/", desc: "Department of IT" },
  { label: "Mechanical Engineering", url: "https://mech.gndec.ac.in/", desc: "Department of Mechanical" },
];

const notices: LinkItem[] = [
  { label: "GNDEC Official Notices", url: "https://www.gndec.ac.in/notices", desc: "Central notice board" },
  { label: "Examination Cell", url: "https://www.gndec.ac.in/examination", desc: "Date sheets, results" },
  { label: "Academic Calendar", url: "https://www.gndec.ac.in/academics", desc: "Sessions, holidays" },
  { label: "Tenders & Recruitment", url: "https://www.gndec.ac.in/tenders", desc: "Latest openings" },
];

const portals: LinkItem[] = [
  { label: "GNDEC Main Website", url: "https://www.gndec.ac.in/", desc: "College homepage" },
  { label: "Student ERP", url: "https://erp.gndec.ac.in/", desc: "Fees, attendance, profile" },
  { label: "Central Library", url: "https://library.gndec.ac.in/", desc: "Catalogue & e-resources" },
  { label: "Training & Placement", url: "https://tnp.gndec.ac.in/", desc: "Placement portal" },
  { label: "IKGPTU", url: "https://ptu.ac.in/", desc: "Affiliating university" },
];

function LinkGroup({
  title,
  icon: Icon,
  items,
  accent,
}: {
  title: string;
  icon: typeof Globe;
  items: LinkItem[];
  accent: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-semibold">{item.label}</div>
              {item.desc && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.desc}</div>
              )}
            </div>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
          </a>
        ))}
      </div>
    </section>
  );
}

function LinksPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <header className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-accent" /> Quick Links
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            Every GNDEC link, in one place.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Department websites, notice boards and student portals — curated and verified.
          </p>
        </header>

        <div className="mt-10 space-y-10">
          <LinkGroup
            title="Department Websites"
            icon={GraduationCap}
            items={departments}
            accent="bg-accent/15 text-accent"
          />
          <LinkGroup
            title="Notices & Announcements"
            icon={Megaphone}
            items={notices}
            accent="bg-secondary/15 text-secondary"
          />
          <LinkGroup
            title="Portals & Resources"
            icon={BookOpen}
            items={portals}
            accent="bg-primary/10 text-primary"
          />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
