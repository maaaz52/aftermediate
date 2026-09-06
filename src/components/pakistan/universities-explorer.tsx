"use client";

import * as React from "react";
import { Search } from "lucide-react";
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

function UniversityCard({ u }: { u: PakistanUniversity }) {
  return (
    <Link
      href={`/pakistan/universities/${u.id}`}
      className="card-glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
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
  );
}

export function UniversitiesExplorer() {
  const { profile } = useStudent();
  const [query, setQuery] = React.useState("");
  const [stream, setStream] = React.useState<Stream | "all">(profile.stream ?? "all");
  const [type, setType] = React.useState<"all" | "public" | "private">("all");

  const filtered = filterUniversities(data.universities, { query, stream, type });

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

      <div className="mt-5 space-y-3">
        {filtered.map((u) => (
          <UniversityCard key={u.id} u={u} />
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
