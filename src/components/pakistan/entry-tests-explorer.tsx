"use client";

import * as React from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { filterEntryTests } from "@/lib/pakistan-filters";
import type { EntryTest, Stream } from "@/lib/types";
import json from "@/data/entry-tests.json";

const data = json as unknown as { dataYear: number; tests: EntryTest[] };

const STREAM_FILTERS: { value: Stream | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...(Object.keys(STREAM_LABEL) as Stream[]).map((s) => ({
    value: s,
    label: STREAM_LABEL[s],
  })),
];

function TestCard({
  t,
  open,
  onToggle,
}: {
  t: EntryTest;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <h3>
        <button
          type="button"
          id={`accordion-trigger-${t.id}`}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`accordion-panel-${t.id}`}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-ink">{t.short}</span>
              <Badge variant="muted">{t.conductingBody}</Badge>
              <Badge variant="info">{t.streams.length} stream{t.streams.length > 1 ? "s" : ""}</Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">{t.name}</p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-faint transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </h3>

      <div
        hidden={!open}
        id={`accordion-panel-${t.id}`}
        role="region"
        aria-labelledby={`accordion-trigger-${t.id}`}
        className="border-t border-line p-5"
      >
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-2/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-faint">Fee</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{t.fee}</p>
            </div>
            <div className="rounded-lg bg-surface-2/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-faint">Frequency</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{t.frequency}</p>
            </div>
            <div className="rounded-lg bg-surface-2/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-faint">Validity</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{t.validity}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Accepted by
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.acceptedBy.map((a) => (
                <Badge key={a} variant="muted">
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Pattern
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-faint">
                    <th className="py-2 pr-4">Section</th>
                    <th className="py-2 pr-4">Questions</th>
                    <th className="py-2 pr-4">Marks</th>
                    <th className="py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {t.pattern.map((p) => (
                    <tr key={p.section} className="border-b border-line/60">
                      <td className="py-2 pr-4 font-medium text-ink">{p.section}</td>
                      <td className="py-2 pr-4 font-mono text-muted">{p.questions ?? "—"}</td>
                      <td className="py-2 pr-4 font-mono text-muted">{p.marks ?? "—"}</td>
                      <td className="py-2 font-mono text-muted">{p.time ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Syllabus
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {t.syllabus.map((s) => (
                <div key={s.subject} className="rounded-lg bg-surface-2/60 px-3 py-2">
                  <p className="text-sm font-semibold text-ink">{s.subject}</p>
                  <p className="mt-0.5 text-xs text-muted">{s.topics.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              How to apply
            </p>
            <ol className="mt-3 space-y-2">
              {t.howToApply.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-muted">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[10px] font-bold text-saffron">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {t.note && <p className="mt-4 text-[11px] italic text-faint">{t.note}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            {t.sourceUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Official source
              </a>
            ))}
          </div>
      </div>
    </div>
  );
}

export function EntryTestsExplorer() {
  const { profile } = useStudent();
  const [stream, setStream] = React.useState<Stream | "all">(profile.stream ?? "all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = filterEntryTests(data.tests, stream);

  // Reset the open card if it is no longer in the filtered list (React's
  // render-time state adjustment pattern — do NOT use useEffect here).
  if (openId && !filtered.some((t) => t.id === openId)) {
    setOpenId(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STREAM_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStream(f.value)}
            aria-pressed={stream === f.value}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              stream === f.value
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {filtered.map((t) => (
          <TestCard
            key={t.id}
            t={t}
            open={openId === t.id}
            onToggle={() => setOpenId(openId === t.id ? null : t.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-faint">
            No entry tests for this stream yet.
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-faint">
        Data compiled {data.dataYear} from official test-conducting bodies. Patterns and fees
        change per cycle — confirm on the official source before registering.
      </p>
    </div>
  );
}
