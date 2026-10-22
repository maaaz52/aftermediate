import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { ExternalLink, ArrowLeft, BookOpen, Target, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";
import json from "@/data/pakistan-universities.json";
import entryTestsJson from "@/data/entry-tests.json";
import type { PakistanUniversity, EntryTest } from "@/lib/types";
import { admissionCalendarFor, withConfirmedAdmissionDates, type ConfirmedAdmissionCalendarEvent } from "@/lib/admission-calendar";
import { createAdminClient } from "@/lib/supabase/admin";

const data = json as unknown as { dataYear: number; universities: PakistanUniversity[] };
const testsData = entryTestsJson as unknown as { tests: EntryTest[] };
const CALENDAR_EVENT_TYPES = new Set(["announcement", "application", "test", "merit", "fee", "intake"]);

export const dynamic = "force-dynamic";

/** Find the entry test ID that matches a university's entryTest field. */
function findTestId(entryTest: string): string | undefined {
  const lower = entryTest.toLowerCase();
  return testsData.tests.find((t) => lower.includes(t.id) || lower.includes(t.short.toLowerCase()))?.id;
}

export function generateStaticParams() {
  return data.universities.map((u) => ({ id: u.id }));
}

function getUni(id: string): PakistanUniversity | undefined {
  return data.universities.find((u) => u.id === id);
}

async function confirmedCalendarEvents(universityId: string): Promise<ConfirmedAdmissionCalendarEvent[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("admission_calendar_events")
      .select("event_type, timing_label, source_url, confirmed_at")
      .eq("university_id", universityId);
    if (error) {
      // The page remains useful with estimates until the one-time review
      // migration has been run in a deployment environment.
      console.error("admission calendar overrides unavailable", error.message);
      return [];
    }
    return (data ?? []).flatMap((event) => (
      typeof event.event_type === "string" && CALENDAR_EVENT_TYPES.has(event.event_type) &&
      typeof event.timing_label === "string" && typeof event.source_url === "string" && typeof event.confirmed_at === "string"
        ? [{
            eventType: event.event_type as ConfirmedAdmissionCalendarEvent["eventType"],
            timingLabel: event.timing_label,
            sourceUrl: event.source_url,
            confirmedAt: event.confirmed_at,
          }]
        : []
    ));
  } catch (error) {
    console.error("admission calendar override lookup failed", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const uni = getUni(id);
  if (!uni) return pageMetadata({ title: "University", description: "University details.", path: `/pakistan/universities/${id}` });
  return pageMetadata({
    title: `${uni.name} — admissions & merit`,
    description: `${uni.name} (${uni.short}) in ${uni.city}: admission steps, real fees, ranking, entry test and the fields it's known for — with official links.`,
    path: `/pakistan/universities/${uni.id}`,
    ogDescription: uni.intro,
  });
}

export default async function UniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uni = getUni(id);
  if (!uni) notFound();
  const calendar = withConfirmedAdmissionDates(admissionCalendarFor(uni), await confirmedCalendarEvents(uni.id));
  const hasConfirmedDates = calendar.events.some((event) => event.confidence === "confirmed");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Universities", path: "/pakistan/universities" },
          { name: uni.name, path: `/pakistan/universities/${uni.id}` },
        ])}
      />
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

      {/* Admission calendar */}
      <section className="mt-8 border-y border-line py-6" aria-labelledby="admission-calendar-heading">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-saffron">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Admission calendar
            </p>
            <h2 id="admission-calendar-heading" className="mt-1 text-lg font-bold tracking-tight text-ink">
              {calendar.cycle}
            </h2>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-saffron/25 bg-saffron/10 px-2.5 py-1 text-xs font-medium text-saffron">
            {hasConfirmedDates ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
            {hasConfirmedDates ? "Confirmed dates included" : "Estimated windows"}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
          Confirmed dates are taken from a reviewed official-source update. All remaining entries are typical annual windows, so confirm them before applying.
        </p>
        <ol className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {calendar.events.map((event, index) => (
            <li key={event.id} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-saffron/25 bg-saffron/10 font-mono text-[11px] font-bold text-saffron">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{event.label}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs font-medium text-saffron">
                  {event.confidence === "confirmed" && <CheckCircle2 className="h-3 w-3" aria-label="Confirmed" />}
                  {event.timing}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{event.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <a
          href={calendar.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-saffron underline-offset-4 hover:underline"
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Confirm the current cycle on the official page
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </section>

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
