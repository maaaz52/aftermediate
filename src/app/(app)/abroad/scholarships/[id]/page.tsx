import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Clock, ExternalLink, FileText, Lightbulb, Mail, Star } from "lucide-react";
import Link from "next/link";
import json from "@/data/abroad-scholarships.json";
import countriesJson from "@/data/abroad-countries.json";
import type { AbroadScholarship, AbroadCountry } from "@/lib/types";

const data = json as unknown as { dataYear: number; scholarships: AbroadScholarship[] };
const countryData = countriesJson as unknown as { countries: AbroadCountry[] };
const COUNTRY_NAMES = new Map(countryData.countries.map((c) => [c.id, c.name]));

function countryLabel(c: string): string {
  if (c === "multiple") return "Multiple countries";
  return COUNTRY_NAMES.get(c) ?? c;
}

const CATEGORY_LABEL: Record<string, string> = {
  hec: "HEC Pakistan",
  "host-government": "Host Government",
  "university-specific": "University-specific",
  "merit-based": "Merit-based",
  "need-based": "Need-based",
};

const LEVEL_LABEL: Record<string, string> = {
  bachelors: "Bachelor's",
  masters: "Master's",
  phd: "PhD",
  multiple: "All levels",
};

export function generateStaticParams() {
  return data.scholarships.map((s) => ({ id: s.id }));
}

function getScholarship(id: string): AbroadScholarship | undefined {
  return data.scholarships.find((s) => s.id === id);
}

export default async function ScholarshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getScholarship(id);
  if (!s) notFound();

  const countryLabels = s.countries.map(countryLabel).join(", ");
  const levelLabel = LEVEL_LABEL[s.level] ?? s.level;
  const catLabel = CATEGORY_LABEL[s.category] ?? s.category;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/abroad/scholarships"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All scholarships
      </Link>

      {/* Header */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="saffron">{catLabel}</Badge>
          <Badge variant={s.coverage === "full" ? "emerald" : "info"}>
            {s.coverage === "full" ? "Full coverage" : "Partial coverage"}
          </Badge>
          <Badge variant="muted">{levelLabel}</Badge>
          {s.ivyLeague && <Badge variant="saffron">Ivy League</Badge>}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {s.name}
        </h1>
        <p className="mt-1 text-sm text-muted">{s.funder}</p>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Coverage</p>
          <p className="mt-1 text-sm font-bold text-ink">
            {s.coverage === "full" ? "Full" : "Partial"}
          </p>
          <p className="mt-0.5 text-xs text-muted">{s.coverageDetail}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Level</p>
          <p className="mt-1 text-sm font-bold text-ink">{levelLabel}</p>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {s.countries.map((cid) => (
              <Link
                key={cid}
                href={cid === "multiple" ? "/abroad/countries" : `/abroad/countries/${cid}`}
                className="inline-flex items-center gap-1 text-xs text-saffron transition-colors hover:underline"
              >
                {countryLabel(cid)}{cid !== "multiple" ? " →" : " →"}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Duration</p>
          <p className="mt-1 text-sm font-bold text-ink">{s.duration ?? "Varies"}</p>
          {s.renewable !== undefined && (
            <p className="mt-0.5 text-xs text-muted">{s.renewable ? "Renewable" : "Non-renewable"}</p>
          )}
        </div>
      </div>

      {/* Coverage detail */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
          <Star className="h-3.5 w-3.5" />
          What it covers
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink">{s.coverageDetail}</p>
      </section>

      {/* Deadline */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
          <Clock className="h-3.5 w-3.5" />
          Deadline
        </h2>
        <div className="mt-3 rounded-xl border border-saffron/30 bg-saffron/5 px-4 py-3">
          <p className="text-sm text-ink">{s.deadline}</p>
        </div>
      </section>

      {/* Eligibility */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Eligibility for Pakistani students</h2>
        <ul className="mt-3 space-y-2">
          {s.eligibility.map((e) => (
            <li key={e} className="flex gap-2 text-xs text-muted">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
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
              <li key={d} className="flex gap-2 text-xs text-muted">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                {d}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How to apply */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">How to apply</h2>
        <ol className="mt-3 space-y-3">
          {s.howToApply.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-xs font-bold text-saffron">
                {i + 1}
              </span>
              <p className="text-sm text-ink">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Tips */}
      {s.tips && s.tips.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
            <Lightbulb className="h-3.5 w-3.5" />
            Tips for Pakistani applicants
          </h2>
          <div className="mt-3 space-y-2">
            {s.tips.map((tip) => (
              <div key={tip} className="flex gap-2 text-xs text-muted">
                <span className="mt-1 text-saffron">→</span>
                {tip}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Exclusive for */}
      {s.exclusiveFor && (
        <section className="mt-8 rounded-xl border border-line bg-surface-2/60 px-4 py-3">
          <p className="text-xs text-muted">{s.exclusiveFor}</p>
        </section>
      )}

      {/* Contact info */}
      {s.contactInfo && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
            <Mail className="h-3.5 w-3.5" />
            Contact
          </h2>
          <p className="mt-3 text-sm text-ink">{s.contactInfo}</p>
        </section>
      )}

      {/* Source links */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {s.sourceUrls.map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-saffron transition-colors hover:bg-saffron/5"
          >
            <ExternalLink className="h-3 w-3" />
            Official source
          </a>
        ))}
      </div>

      <p className="mt-10 text-xs text-faint">
        Data compiled {data.dataYear}. Deadlines and details change per cycle — verify on official sources before applying.
      </p>
    </div>
  );
}
