"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import {
  buildCatalog,
  banks,
  catalog,
  bestPercent,
  attemptsFor,
  mockAttempts,
} from "@/lib/practice";
import type { PracticeBank } from "@/lib/practice";
import type { EntryTest, Stream } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STREAM_FILTERS: { value: Stream | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...(Object.keys(STREAM_LABEL) as Stream[]).map((s) => ({
    value: s,
    label: STREAM_LABEL[s],
  })),
];

const CATEGORY_LABEL: Record<string, string> = {
  "english-proficiency": "English Proficiency",
  "graduate-admission": "Graduate Admission",
  "undergraduate-admission": "Undergraduate Admission",
};

// ---------------------------------------------------------------------------
// Card sub-components
// ---------------------------------------------------------------------------

function ReadyCard({
  test,
  bank,
  basePath,
}: {
  test: EntryTest;
  bank: PracticeBank;
  basePath: string;
}) {
  const { profile } = useStudent();
  const mockHistory = mockAttempts(profile.practice);
  const best = bestPercent(mockHistory, test.id);
  const attempts = attemptsFor(mockHistory, test.id);
  const hasNegative = bank.marking.negativeMarks > 0;

  return (
    <div className="card-glass rounded-2xl p-5">
      <h3 className="font-semibold text-ink">{test.short}</h3>
      <p className="mt-0.5 text-xs text-faint">{test.conductingBody}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge variant="muted">
          {test.pattern.length > 0
            ? `${test.pattern.length} sections`
            : "—"}
        </Badge>
        <span className="text-xs text-muted">{bank.questions.length} questions</span>
        <span className="text-xs text-muted">{bank.durationMinutes} min</span>
      </div>

      <div className="mt-2">
        {hasNegative ? (
          <Badge variant="danger">Negative marking</Badge>
        ) : (
          <p className="line-clamp-2 text-xs text-muted">{bank.marking.note}</p>
        )}
      </div>

      {attempts.length > 0 && best !== null && (
        <p className="mt-2 text-xs text-muted">
          Best: {best.toFixed(1)}% &middot; {attempts.length} attempt
          {attempts.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="mt-4">
        <Link href={`${basePath}/${test.id}`}>
          <Button type="button" variant="default" size="sm">
            Start test &rarr;
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PreparationCard({ test }: { test: EntryTest }) {
  return (
    <div className="card-glass rounded-2xl bg-surface-2 p-5 opacity-60">
      <h3 className="font-semibold text-ink">{test.short}</h3>
      <p className="mt-0.5 text-xs text-faint">{test.conductingBody}</p>

      <div className="mt-3">
        <Badge variant="info">Question bank in preparation</Badge>
      </div>

      <p className="mt-2 text-xs text-muted">
        Pattern listed in Entry Tests &middot; questions being authored
      </p>

      <div className="mt-4">
        <span className="inline-flex cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-line bg-transparent px-3 py-2 text-sm font-semibold text-ink opacity-50">
          Start test
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function PracticeCatalog({
  tests: testsProp,
  basePath = "/pakistan/self-assessment",
}: {
  tests?: EntryTest[];
  basePath?: string;
}) {
  const { profile } = useStudent();
  const [stream, setStream] = React.useState<Stream | "all">(
    () => (testsProp ? "all" : profile.stream ?? "all")
  );
  const [category, setCategory] = React.useState<string>("all");
  const items = React.useMemo(
    () => (testsProp ? buildCatalog(testsProp, banks) : catalog()),
    [testsProp],
  );

  const ready = items.filter((i) => i.status === "ready");
  const inPrep = items.filter((i) => i.status === "preparation");
  const totalQs = ready.reduce(
    (sum, i) => sum + (i.bank?.questions.length ?? 0),
    0,
  );

  const filtered = React.useMemo(() => {
    if (testsProp) {
      // abroad: filter by category
      return category === "all"
        ? items
        : items.filter((i) => i.test.category === category);
    }
    // Pakistan: filter by stream
    return stream === "all"
      ? items
      : items.filter((i) => i.test.streams.includes(stream));
  }, [items, testsProp, category, stream]);

  return (
    <div>
      {/* Stat chips */}
      <div
        className="animate-reveal mb-6 flex flex-wrap gap-3"
        style={{ animationDelay: "0ms" }}
      >
        <div className="rounded-lg border border-line bg-surface-2 px-3 py-1.5">
          <span className="text-sm font-semibold text-ink">{ready.length}</span>
          <span className="ml-1.5 text-xs text-muted">tests ready</span>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 px-3 py-1.5">
          <span className="text-sm font-semibold text-ink">{totalQs}</span>
          <span className="ml-1.5 text-xs text-muted">questions</span>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 px-3 py-1.5">
          <span className="text-sm font-semibold text-ink">{inPrep.length}</span>
          <span className="ml-1.5 text-xs text-muted">in preparation</span>
        </div>
      </div>

      {/* Stream filter chips (Pakistan) */}
      {!testsProp && (
        <div
          className="animate-reveal mb-6 flex flex-wrap gap-2"
          style={{ animationDelay: "60ms" }}
        >
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
                  : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Category filter (abroad mode) */}
      {testsProp && (
        <div
          className="animate-reveal mb-6 flex flex-wrap gap-2"
          style={{ animationDelay: "60ms" }}
        >
          <button
            type="button"
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === "all"
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink",
            )}
          >
            All
          </button>
          {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              aria-pressed={category === key}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                category === key
                  ? "border-saffron/40 bg-saffron/10 text-saffron"
                  : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Card grid */}
      <div
        className="animate-reveal grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        style={{ animationDelay: "120ms" }}
      >
        {filtered.map((item) =>
          item.status === "ready" ? (
            <ReadyCard
              key={item.test.id}
              test={item.test}
              bank={item.bank!}
              basePath={basePath}
            />
          ) : (
            <PreparationCard key={item.test.id} test={item.test} />
          ),
        )}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-faint">
            {testsProp
              ? "No self-assessment tests in this category yet."
              : "No self-assessment tests for this stream yet."}
          </p>
        )}
      </div>

      {/* Footer disclaimer */}
      <p
        className="animate-reveal mt-8 text-xs text-faint"
        style={{ animationDelay: "240ms" }}
      >
        {testsProp
          ? "Practice platform — not affiliated with ETS, British Council, College Board, or any testing body. Test patterns change per cycle; confirm on official sources."
          : "Practice platform — not affiliated with PM&DC, NUST, or any conducting body. Patterns change per cycle; confirm on official sources."}
      </p>
    </div>
  );
}