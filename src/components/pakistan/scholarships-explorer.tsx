"use client";

import * as React from "react";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { filterScholarships } from "@/lib/pakistan-filters";
import type { PakistanScholarship, ScholarshipCategory } from "@/lib/types";
import json from "@/data/pakistan-scholarships.json";

const data = json as unknown as { dataYear: number; scholarships: PakistanScholarship[] };

const CATEGORY_TABS: { value: ScholarshipCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hec", label: "HEC" },
  { value: "need-based", label: "Need-based" },
  { value: "merit-based", label: "Merit-based" },
  { value: "university-specific", label: "University" },
  { value: "provincial", label: "Provincial" },
];

const GROUP_ORDER: ScholarshipCategory[] = [
  "hec",
  "need-based",
  "merit-based",
  "university-specific",
  "provincial",
];

const GROUP_META: Record<ScholarshipCategory, { title: string; blurb: string }> = {
  hec: {
    title: "HEC General",
    blurb: "National-level programs run by the Higher Education Commission.",
  },
  "need-based": {
    title: "Need-Based",
    blurb: "For students whose family income can't cover university — proof of need required.",
  },
  "merit-based": {
    title: "Merit-Based",
    blurb: "Awarded on marks, board position, or talent — income doesn't matter.",
  },
  "university-specific": {
    title: "University-Specific",
    blurb: "Run by individual universities for their own admitted students.",
  },
  provincial: {
    title: "Provincial",
    blurb: "Endowment funds and programs by provincial governments.",
  },
};

function ScholarshipCard({ s }: { s: PakistanScholarship }) {
  return (
    <div className="card-glass flex h-full flex-col rounded-2xl p-5">
      <h3 className="text-base font-bold text-ink">{s.name}</h3>
      <p className="mt-1 text-xs text-muted">
        {s.funder} · {s.level}
      </p>
      <p className="mt-1.5 text-xs font-medium text-emerald">{s.coverage}</p>
      <ul className="mt-3 flex-1 space-y-1.5">
        {s.eligibility.map((e) => (
          <li key={e} className="flex gap-2 text-xs text-muted">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-saffron" />
            {e}
          </li>
        ))}
      </ul>
      {s.note && <p className="mt-3 text-[11px] italic text-faint">{s.note}</p>}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="font-mono text-[11px] text-faint">{s.deadline}</span>
        <a
          href={s.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Official page
        </a>
      </div>
    </div>
  );
}

export function ScholarshipsExplorer() {
  const [category, setCategory] = React.useState<ScholarshipCategory | "all">("all");
  const [query, setQuery] = React.useState("");

  const filtered = filterScholarships(data.scholarships, { category, query });
  const groups =
    category === "all"
      ? GROUP_ORDER
      : [category as ScholarshipCategory];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search by name, funder, or eligibility..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setCategory(t.value)}
            aria-pressed={category === t.value}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === t.value
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {t.label}
            {t.value !== "all" && (
              <span className="ml-1.5 text-[10px] opacity-70">
                {data.scholarships.filter((s) => s.category === t.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {groups.map((g) => {
        const items = filtered.filter((s) => s.category === g);
        if (items.length === 0) return null;
        const meta = GROUP_META[g];
        return (
          <section key={g} className="mt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {meta.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{meta.blurb}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <ScholarshipCard key={s.id} s={s} />
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-faint">
          No scholarships match these filters.
        </p>
      )}

      <p className="mt-8 text-xs text-faint">
        Data compiled {data.dataYear} from official scholarship pages. Deadlines change every
        cycle — check the official link before applying.
      </p>
    </div>
  );
}
