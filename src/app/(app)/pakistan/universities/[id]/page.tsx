import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowLeft, BookOpen, Target } from "lucide-react";
import Link from "next/link";
import json from "@/data/pakistan-universities.json";
import entryTestsJson from "@/data/entry-tests.json";
import scholarshipsJson from "@/data/pakistan-scholarships.json";
import type { PakistanUniversity, EntryTest, PakistanScholarship } from "@/lib/types";

const data = json as unknown as { dataYear: number; universities: PakistanUniversity[] };
const testsData = entryTestsJson as unknown as { tests: EntryTest[] };
const scholarshipsData = scholarshipsJson as unknown as { scholarships: PakistanScholarship[] };

/** Find the entry test ID that matches a university's entryTest field. */
function findTestId(entryTest: string): string | undefined {
  const lower = entryTest.toLowerCase();
  return testsData.tests.find((t) => lower.includes(t.id) || lower.includes(t.short.toLowerCase()))?.id;
}

/** Find scholarships relevant to a university's streams. */
function scholarshipsForUni(uni: PakistanUniversity): PakistanScholarship[] {
  return scholarshipsData.scholarships.filter((s) => {
    const level = s.level.toLowerCase();
    if (level === "all levels" || level === "undergraduate" || level === "graduate") return true;
    if (uni.streams.includes("pre-medical") && /medical|mbbs|health/.test(level)) return true;
    if (uni.streams.includes("pre-engineering") && /engineer|tech|cs/.test(level)) return true;
    return false;
  });
}

export function generateStaticParams() {
  return data.universities.map((u) => ({ id: u.id }));
}

function getUni(id: string): PakistanUniversity | undefined {
  return data.universities.find((u) => u.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const uni = getUni(id);
  return { title: uni ? `${uni.name} — admissions & merit` : "University" };
}

export default async function UniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uni = getUni(id);
  if (!uni) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Back link */}
      <Link
        href="/pakistan/universities"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All universities
      </Link>

      {/* Header */}
      <div className="mt-6 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-saffron/15 font-mono text-2xl font-bold text-saffron">
          {uni.short.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {uni.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-saffron">{uni.short}</span>
            <Badge variant="muted">{uni.city}</Badge>
            <Badge variant={uni.type === "public" ? "emerald" : "info"}>{uni.type}</Badge>
            <Badge variant="saffron">{uni.ranking.label}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">Entry test: {uni.entryTest}</p>
        </div>
      </div>

      {/* Intro */}
      <p className="mt-6 text-sm leading-relaxed text-muted">{uni.intro}</p>

      {/* Admission process */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Admission process
        </h2>
        <ol className="mt-4 space-y-4">
          {uni.admissionSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-xs font-bold text-saffron">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="text-xs text-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Ranking + Fees side by side */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            Ranking
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="saffron">{uni.ranking.label}</Badge>
            <a
              href={uni.ranking.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted underline-offset-2 hover:text-saffron hover:underline"
            >
              source
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            Fees
          </h2>
          <p className="mt-3 text-sm text-ink">{uni.fees.summary}</p>
          {uni.fees.programFees && uni.fees.programFees.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-lg border border-line">
              {uni.fees.programFees.map((pf) => (
                <div
                  key={pf.program}
                  className="flex items-center justify-between border-b border-line/60 px-3 py-2 text-xs last:border-0"
                >
                  <span className="text-muted">{pf.program}</span>
                  <span className="font-mono text-ink">
                    PKR {pf.perYear.toLocaleString()}/yr
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Best fields */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Best for
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {uni.bestFields.map((bf) => (
            <div key={bf.field} className="rounded-xl bg-surface-2/60 px-4 py-3">
              <p className="text-sm font-semibold text-ink">{bf.field}</p>
              <p className="mt-1 text-xs text-muted">{bf.why}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related links */}
      <div className="mt-8 flex flex-wrap gap-3">
        {(() => {
          const testId = findTestId(uni.entryTest);
          return testId ? (
            <Link
              href={`/pakistan/entry-tests/${testId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-saffron/30 bg-saffron/10 px-4 py-2.5 text-sm font-medium text-saffron transition-colors hover:bg-saffron/20"
            >
              <BookOpen className="h-4 w-4" />
              {uni.entryTest} — details &amp; prep
            </Link>
          ) : null;
        })()}
        <Link
          href={`/pakistan/scholarships`}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
        >
          <Target className="h-4 w-4" />
          Scholarships
        </Link>
      </div>

      {/* Official links */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Official links
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {uni.sourceUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-saffron transition-colors hover:bg-saffron/5"
            >
              <ExternalLink className="h-3 w-3" />
              {new URL(url).hostname.replace("www.", "")}
            </a>
          ))}
        </div>
      </section>

      {/* Data year note */}
      <p className="mt-10 text-xs text-faint">
        Data compiled {data.dataYear} from official university pages. Always confirm fees and
        deadlines on the official links before applying.
      </p>
    </div>
  );
}
