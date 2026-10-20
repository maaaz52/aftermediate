"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { filterUniversities } from "@/lib/pakistan-filters";
import type { PakistanUniversity, Stream } from "@/lib/types";
import json from "@/data/pakistan-universities.json";

const data = json as unknown as { dataYear: number; universities: PakistanUniversity[] };

const STREAM_FILTERS: { value: Stream | "all"; label: string }[] = [
  { value: "all", label: "All streams" },
  ...(Object.keys(STREAM_LABEL) as Stream[]).map((s) => ({
    value: s,
    label: STREAM_LABEL[s],
  })),
];

const TYPE_FILTERS: { value: "all" | "public" | "private"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-saffron/40 bg-saffron/10 text-saffron"
          : "border-line bg-surface text-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function formatPkr(value: number | undefined) {
  return typeof value === "number" ? `PKR ${new Intl.NumberFormat("en-PK").format(value)}/yr` : "See fee details";
}

function UniversityComparison({ universities, onClear }: { universities: PakistanUniversity[]; onClear: () => void }) {
  const rows: { label: string; get: (university: PakistanUniversity) => string }[] = [
    { label: "City", get: (university) => university.city },
    { label: "Type", get: (university) => university.type },
    { label: "Eligible streams", get: (university) => university.streams.map((item) => STREAM_LABEL[item]).join(", ") },
    { label: "Entry test", get: (university) => university.entryTest },
    { label: "Ranking / recognition", get: (university) => university.ranking.label },
    { label: "Example annual fee", get: (university) => formatPkr(university.fees.programFees?.[0]?.perYear) },
    { label: "Fee note", get: (university) => university.fees.summary },
    { label: "Known for", get: (university) => university.bestFields.map((item) => item.field).join(", ") },
  ];

  return (
    <div className="card-glass overflow-hidden rounded-2xl border-saffron/30">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="text-sm font-bold text-ink">Comparing two universities</p>
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-2 font-semibold text-faint"> </th>
              {universities.map((university) => <th key={university.id} className="px-4 py-2 font-bold text-ink">{university.short}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-2 align-top font-semibold text-faint">{row.label}</td>
                {universities.map((university) => <td key={university.id} className="px-4 py-2 align-top leading-relaxed text-muted">{row.get(university)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UniversityCard({ u, compare, onToggleCompare }: { u: PakistanUniversity; compare: boolean; onToggleCompare: () => void }) {
  return (
    <div className="card-glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/pakistan/universities/${u.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron/15 font-mono text-lg font-bold text-saffron">
          {u.short.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-ink">{u.short}</span>
            <Badge variant="muted">{u.city}</Badge>
            <Badge variant={u.type === "public" ? "emerald" : "info"}>{u.type}</Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{u.name}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-mono text-xs text-saffron">{u.ranking.label}</p>
          <p className="mt-0.5 text-[11px] text-faint">Test: {u.entryTest}</p>
        </div>
      </Link>
      <button
        type="button"
        aria-pressed={compare}
        onClick={onToggleCompare}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          compare ? "border-saffron/40 bg-saffron/10 text-saffron" : "border-line text-muted hover:text-ink"
        )}
      >
        {compare && <Check className="h-3 w-3" aria-hidden="true" />}
        Compare
      </button>
    </div>
  );
}

export function UniversitiesExplorer() {
  const { profile } = useStudent();
  const [query, setQuery] = React.useState("");
  const [stream, setStream] = React.useState<Stream | "all">(profile.stream ?? "all");
  const [type, setType] = React.useState<"all" | "public" | "private">("all");
  const [compareIds, setCompareIds] = React.useState<string[]>([]);

  const filtered = filterUniversities(data.universities, { query, stream, type });
  const comparison = data.universities.filter((university) => compareIds.includes(university.id));

  function toggleCompare(id: string) {
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length === 2 ? current : [...current, id]);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search by name, city, or field..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STREAM_FILTERS.map((f) => (
          <Chip key={f.value} active={stream === f.value} onClick={() => setStream(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <Chip key={f.value} active={type === f.value} onClick={() => setType(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {compareIds.length > 0 && <p className="mt-3 text-xs text-muted">{compareIds.length}/2 selected. Choose two universities to compare them side by side.</p>}

      {comparison.length === 2 && <div className="mt-5"><UniversityComparison universities={comparison} onClear={() => setCompareIds([])} /></div>}

      <div className="mt-5 space-y-3">
        {filtered.map((u) => (
          <UniversityCard key={u.id} u={u} compare={compareIds.includes(u.id)} onToggleCompare={() => toggleCompare(u.id)} />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-faint">
            No universities match these filters.
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-faint">
        Data compiled {data.dataYear} from official university pages. Always confirm fees and
        deadlines on the official links before applying.
      </p>
    </div>
  );
}
