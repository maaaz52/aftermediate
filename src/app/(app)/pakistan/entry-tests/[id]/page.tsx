import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import json from "@/data/entry-tests.json";
import type { EntryTest } from "@/lib/types";

const data = json as unknown as { dataYear: number; tests: EntryTest[] };

export function generateStaticParams() {
  return data.tests.map((t) => ({ id: t.id }));
}

function getTest(id: string): EntryTest | undefined {
  return data.tests.find((t) => t.id === id);
}

export default async function EntryTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const test = getTest(id);
  if (!test) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Back link */}
      <Link
        href="/pakistan/entry-tests"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All entry tests
      </Link>

      {/* Header */}
      <div className="mt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {test.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-saffron">{test.short}</span>
          <Badge variant="muted">{test.conductingBody}</Badge>
          <Badge variant="info">{test.streams.length} stream{test.streams.length > 1 ? "s" : ""}</Badge>
        </div>
      </div>

      {/* Quick facts */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Fee</p>
          <p className="mt-1 text-sm font-medium text-ink">{test.fee}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Frequency</p>
          <p className="mt-1 text-sm font-medium text-ink">{test.frequency}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Validity</p>
          <p className="mt-1 text-sm font-medium text-ink">{test.validity}</p>
        </div>
      </div>

      {/* Accepted by */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Accepted by
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {test.acceptedBy.map((a) => (
            <Badge key={a} variant="muted">{a}</Badge>
          ))}
        </div>
      </section>

      {/* Pattern */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Paper pattern
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-faint">
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {test.pattern.map((p) => (
                <tr key={p.section} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{p.section}</td>
                  <td className="px-4 py-3 font-mono text-muted">{p.questions ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-muted">{p.marks ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-muted">{p.time ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Syllabus */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Syllabus
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {test.syllabus.map((s) => (
            <div key={s.subject} className="rounded-xl bg-surface-2/60 px-4 py-3">
              <p className="text-sm font-semibold text-ink">{s.subject}</p>
              <p className="mt-1 text-xs text-muted">{s.topics.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to apply */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          How to apply
        </h2>
        <ol className="mt-3 space-y-3">
          {test.howToApply.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-xs font-bold text-saffron">
                {i + 1}
              </span>
              <p className="text-sm text-muted">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Note */}
      {test.note && (
        <p className="mt-6 rounded-xl bg-saffron/5 px-4 py-3 text-xs italic text-faint">
          {test.note}
        </p>
      )}

      {/* Official links */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Official links
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {test.sourceUrls.map((url) => (
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

      <p className="mt-10 text-xs text-faint">
        Data compiled {data.dataYear} from official test-conducting bodies. Patterns and fees
        change per cycle — confirm on the official source before registering.
      </p>
    </div>
  );
}
