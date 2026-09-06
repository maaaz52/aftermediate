import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Check, Clock, ExternalLink, FileText, Lightbulb, MapPin, Monitor, Target, Users } from "lucide-react";
import Link from "next/link";
import json from "@/data/abroad-tests.json";
import countriesJson from "@/data/abroad-countries.json";
import contentJson from "@/data/test-prep-content.json";
import type { AbroadTest, AbroadCountry } from "@/lib/types";
import { formatPkr } from "@/lib/abroad-planner";

const data = json as unknown as { tests: AbroadTest[] };
const countryData = countriesJson as unknown as { countries: AbroadCountry[] };
const COUNTRY_NAMES = new Map(countryData.countries.map((c) => [c.id, c.name]));
const HAS_LECTURES = new Set(contentJson.content.map((c: { testId: string }) => c.testId));

function countryLabel(c: string): string {
  return COUNTRY_NAMES.get(c) ?? c;
}

const KIND_LABEL: Record<string, string> = {
  english: "English Proficiency",
  aptitude: "Aptitude Test",
  graduate: "Graduate Admission",
  language: "Language Certificate",
};

export function generateStaticParams() {
  return data.tests.map((t) => ({ id: t.id }));
}

function getTest(id: string): AbroadTest | undefined {
  return data.tests.find((t) => t.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = getTest(id);
  return { title: t ? `${t.name} — format, fees & prep` : "Test prep" };
}

export default async function TestPrepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = getTest(id);
  if (!t) notFound();

  const kindLabel = KIND_LABEL[t.kind] ?? t.kind;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/abroad/test-prep"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All tests
      </Link>

      {/* Header */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="saffron">{kindLabel}</Badge>
          <Badge variant="muted">{t.short}</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {t.name}
        </h1>
      </div>

      {/* Overview */}
      {t.overview && (
        <p className="mt-4 text-sm leading-relaxed text-muted">{t.overview}</p>
      )}

      {/* Quick stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Fee (Pakistan)</p>
          <p className="mt-1 text-sm font-bold text-ink">{formatPkr(t.feePkr)}</p>
          <p className="mt-0.5 text-xs text-muted">{t.feeNote}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Validity</p>
          <p className="mt-1 text-sm font-bold text-ink">{t.validity}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Frequency</p>
          <p className="mt-1 text-sm font-bold text-ink">{t.frequency}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Competitive Score</p>
          <p className="mt-1 text-sm font-bold text-ink">{t.competitiveScore}</p>
        </div>
      </div>

      {/* Start preparing */}
      {HAS_LECTURES.has(t.id) && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/study/test-prep/${t.id}/lectures`}
            className="inline-flex items-center gap-2 rounded-xl border border-saffron/30 bg-saffron/10 px-4 py-2.5 text-sm font-medium text-saffron transition-colors hover:bg-saffron/20"
          >
            <BookOpen className="h-4 w-4" />
            Watch lectures
          </Link>
          <Link
            href={`/study/test-prep/${t.id}/documents`}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
          >
            <FileText className="h-4 w-4" />
            Resources &amp; documents
          </Link>
          <Link
            href={`/abroad/self-assessment/${t.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
          >
            <Target className="h-4 w-4" />
            Practice exam
          </Link>
        </div>
      )}

      {/* Test format */}
      {t.format && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
            <Monitor className="h-3.5 w-3.5" />
            Test format
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink">{t.format}</p>
        </section>
      )}

      {/* Scoring */}
      {t.scoring && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Scoring</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink">{t.scoring}</p>
        </section>
      )}

      {/* Pattern table */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
          <FileText className="h-3.5 w-3.5" />
          Section breakdown
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-2/60">
                <th className="px-4 py-2 font-semibold text-faint">Section</th>
                <th className="px-4 py-2 font-semibold text-faint">Content</th>
                <th className="px-4 py-2 font-semibold text-faint">Duration</th>
              </tr>
            </thead>
            <tbody>
              {t.pattern.map((p) => (
                <tr key={p.section} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-2 font-medium text-ink">{p.section}</td>
                  <td className="px-4 py-2 text-muted">{p.content}</td>
                  <td className="px-4 py-2 text-muted">{p.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Registration steps */}
      {t.registrationSteps && t.registrationSteps.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">How to register</h2>
          <ol className="mt-3 space-y-3">
            {t.registrationSteps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-xs font-bold text-saffron">
                  {i + 1}
                </span>
                <p className="text-sm text-ink">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Test day */}
      {t.testDay && t.testDay.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
            <Clock className="h-3.5 w-3.5" />
            On test day
          </h2>
          <ul className="mt-3 space-y-2">
            {t.testDay.map((item) => (
              <li key={item} className="flex gap-2 text-xs text-muted">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Results & Score sending */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {t.resultsTimeline && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Results timeline</h2>
            <p className="mt-3 text-sm text-ink">{t.resultsTimeline}</p>
          </section>
        )}
        {t.scoreSending && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Sending scores</h2>
            <p className="mt-3 text-sm text-ink">{t.scoreSending}</p>
          </section>
        )}
      </div>

      {/* Preparation tips */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
          <Lightbulb className="h-3.5 w-3.5" />
          Preparation tips
        </h2>
        <ul className="mt-3 space-y-2">
          {t.prep.tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-xs text-muted">
              <span className="mt-1 text-saffron">→</span>
              {tip}
            </li>
          ))}
        </ul>
        {t.preparationTimeline && (
          <p className="mt-3 text-xs text-muted">Recommended timeline: {t.preparationTimeline}</p>
        )}
      </section>

      {/* Common mistakes */}
      {t.commonMistakes && t.commonMistakes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Common mistakes to avoid</h2>
          <ul className="mt-3 space-y-2">
            {t.commonMistakes.map((mistake) => (
              <li key={mistake} className="flex gap-2 text-xs text-muted">
                <span className="mt-1 text-danger">!</span>
                {mistake}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Country requirements */}
      {t.countryRequirements && t.countryRequirements.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
            <MapPin className="h-3.5 w-3.5" />
            Score requirements by country
          </h2>
          <div className="mt-3 space-y-3">
            {t.countryRequirements.map((cr) => (
              <div key={cr.country} className="flex items-start gap-3 rounded-xl border border-line px-4 py-3">
                <span className="text-lg">{countryData.countries.find((c) => c.id === cr.country)?.flag ?? "🌍"}</span>
                <div>
                  <p className="text-sm font-bold text-ink">{countryLabel(cr.country)}</p>
                  <p className="text-xs text-saffron">Min: {cr.minScore}</p>
                  <p className="mt-0.5 text-xs text-muted">{cr.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Accommodations & Retake */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {t.accommodations && (
          <section>
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
              <Users className="h-3.5 w-3.5" />
              Accommodations
            </h2>
            <p className="mt-3 text-sm text-ink">{t.accommodations}</p>
          </section>
        )}
        {t.retakePolicy && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Retake policy</h2>
            <p className="mt-3 text-sm text-ink">{t.retakePolicy}</p>
          </section>
        )}
      </div>

      {/* Accepted countries */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Accepted in</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {t.countries.map((cid) => {
            const c = countryData.countries.find((x) => x.id === cid);
            return (
              <Link
                key={cid}
                href={`/abroad/countries/${cid}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
              >
                {c?.flag} {countryLabel(cid)} →
              </Link>
            );
          })}
        </div>
      </section>

      {/* Resources */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Official resources</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {t.prep.resources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-saffron transition-colors hover:bg-saffron/5"
            >
              <ExternalLink className="h-3 w-3" />
              {r.label}
            </a>
          ))}
          {t.sourceUrls.map((url) => (
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
      </section>
    </div>
  );
}
