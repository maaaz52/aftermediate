import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { ExternalLink, ArrowLeft, CheckCircle2, FileText, GraduationCap, Lightbulb, Mail } from "lucide-react";
import Link from "next/link";
import json from "@/data/pakistan-scholarships.json";
import type { PakistanScholarship } from "@/lib/types";

const data = json as unknown as { dataYear: number; scholarships: PakistanScholarship[] };

export function generateStaticParams() {
  return data.scholarships.map((s) => ({ id: s.id }));
}

function getScholarship(id: string): PakistanScholarship | undefined {
  return data.scholarships.find((s) => s.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = getScholarship(id);
  if (!s) return pageMetadata({ title: "Scholarship", description: "Scholarship details.", path: `/pakistan/scholarships/${id}` });
  return pageMetadata({
    title: `${s.name} — eligibility & how to apply`,
    description: `${s.name}: coverage, eligibility for Pakistani students, documents, deadlines and how to apply. Funded by ${s.funder}.`,
    path: `/pakistan/scholarships/${s.id}`,
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  hec: "HEC General",
  "need-based": "Need-Based",
  "merit-based": "Merit-Based",
  "university-specific": "University-Specific",
  provincial: "Provincial",
};

export default async function ScholarshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getScholarship(id);
  if (!s) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Scholarships", path: "/pakistan/scholarships" },
          { name: s.name, path: `/pakistan/scholarships/${s.id}` },
        ])}
      />
      <Link
        href="/pakistan/scholarships"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All scholarships
      </Link>

      {/* Header */}
      <div className="mt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {s.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="saffron">{CATEGORY_LABELS[s.category] ?? s.category}</Badge>
          <Badge variant="muted">{s.funder}</Badge>
          <Badge variant="info">{s.level}</Badge>
        </div>
      </div>

      {/* Coverage highlight */}
      <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4">
        <p className="text-[11px] uppercase tracking-widest text-emerald-600">Coverage</p>
        <p className="mt-1 text-lg font-bold text-ink">{s.coverage}</p>
      </div>

      {/* Quick facts */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Duration</p>
          <p className="mt-1 text-sm font-medium text-ink">{s.duration ?? "Varies by program"}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Renewable</p>
          <p className="mt-1 text-sm font-medium text-ink">{s.renewable ? "Yes — maintain required GPA" : "No"}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Deadline</p>
          <p className="mt-1 text-sm font-medium text-ink">{s.deadline}</p>
        </div>
      </div>

      {s.exclusiveFor && (
        <div className="mt-4 rounded-xl bg-saffron/5 px-4 py-3">
          <p className="text-xs text-muted"><span className="font-semibold text-ink">Exclusive for:</span> {s.exclusiveFor}</p>
        </div>
      )}

      {s.awardCount && (
        <p className="mt-3 text-xs text-faint">{s.awardCount}</p>
      )}

      {/* Eligibility */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Eligibility criteria
        </h2>
        <ul className="mt-3 space-y-2">
          {s.eligibility.map((e) => (
            <li key={e} className="flex gap-3 text-sm text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              {e}
            </li>
          ))}
        </ul>
      </section>

      {/* Documents required */}
      {s.documentsRequired && s.documentsRequired.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
            <FileText className="h-3.5 w-3.5" />
            Documents required
          </h2>
          <ul className="mt-3 space-y-2">
            {s.documentsRequired.map((d) => (
              <li key={d} className="flex gap-3 text-sm text-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />
                {d}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How to apply */}
      {s.howToApply && s.howToApply.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            How to apply
          </h2>
          <ol className="mt-3 space-y-3">
            {s.howToApply.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-xs font-bold text-saffron">
                  {i + 1}
                </span>
                <p className="text-sm text-muted">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Tips */}
      {s.tips && s.tips.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
            <Lightbulb className="h-3.5 w-3.5" />
            Tips
          </h2>
          <div className="mt-3 space-y-2">
            {s.tips.map((tip) => (
              <div key={tip} className="rounded-xl bg-saffron/5 px-4 py-3 text-sm text-muted">
                {tip}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Note */}
      {s.note && (
        <div className="mt-6 rounded-xl bg-info/5 px-4 py-3">
          <p className="text-xs text-muted">{s.note}</p>
        </div>
      )}

      {/* Related */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/pakistan/universities"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
        >
          <GraduationCap className="h-4 w-4" />
          Browse universities
        </Link>
        <Link
          href="/pakistan/entry-tests"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
        >
          <FileText className="h-4 w-4" />
          Entry tests
        </Link>
      </div>

      {/* Contact + Official link */}
      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <a
          href={s.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-xs font-medium text-saffron transition-colors hover:bg-saffron/5"
        >
          <ExternalLink className="h-3 w-3" />
          Official page
        </a>
        {s.contactInfo && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Mail className="h-3 w-3" />
            {s.contactInfo}
          </span>
        )}
      </div>

      <p className="mt-10 text-xs text-faint">
        Data compiled {data.dataYear} from official scholarship pages. Deadlines change every
        cycle — check the official link before applying.
      </p>
    </div>
  );
}
