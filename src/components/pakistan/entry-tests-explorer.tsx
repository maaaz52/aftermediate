"use client";

import * as React from "react";
import Link from "next/link";
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

function TestCard({ t }: { t: EntryTest }) {
  return (
    <Link
      href={`/pakistan/entry-tests/${t.id}`}
      className="card-glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-ink">{t.short}</span>
          <Badge variant="muted">{t.conductingBody}</Badge>
          <Badge variant="info">{t.streams.length} stream{t.streams.length > 1 ? "s" : ""}</Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{t.name}</p>
      </div>
    </Link>
  );
}

export function EntryTestsExplorer() {
  const { profile } = useStudent();
  const [stream, setStream] = React.useState<Stream | "all">(profile.stream ?? "all");

  const filtered = filterEntryTests(data.tests, stream);

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
          <TestCard key={t.id} t={t} />
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
