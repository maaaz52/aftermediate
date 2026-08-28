"use client";

import * as React from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { filterAbroadScholarships } from "@/lib/abroad-filters";
import type { AbroadCountry, AbroadScholarship, AbroadScholarshipCategory } from "@/lib/types";
import sJson from "@/data/abroad-scholarships.json";
import cJson from "@/data/abroad-countries.json";

const data = sJson as unknown as { dataYear: number; scholarships: AbroadScholarship[] };
const countryData = cJson as unknown as { countries: AbroadCountry[] };
const COUNTRY_NAMES = new Map(countryData.countries.map((c) => [c.id, c.name]));

const CATEGORY_TABS: { value: AbroadScholarshipCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hec", label: "HEC Pakistan" },
  { value: "host-government", label: "Host Government" },
  { value: "university-specific", label: "University-specific" },
  { value: "merit-based", label: "Merit-based" },
  { value: "need-based", label: "Need-based" },
];

const LEVELS: { value: AbroadScholarship["level"] | "all"; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "bachelors", label: "Bachelors" },
  { value: "masters", label: "Masters" },
  { value: "phd", label: "PhD" },
];

function categoryCount(cat: AbroadScholarshipCategory | "all"): number {
  if (cat === "all") return data.scholarships.length;
  return data.scholarships.filter((s) => s.category === cat).length;
}

function countryLabel(c: string): string {
  if (c === "multiple") return "Multiple countries";
  return COUNTRY_NAMES.get(c) ?? c;
}

function ScholarshipCard({
  s,
  open,
  onToggle,
}: {
  s: AbroadScholarship;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `scholarship-panel-${s.id}`;
  const triggerId = `scholarship-trigger-${s.id}`;
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <h3>
        <button
          type="button"
          id={triggerId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-ink">{s.name}</span>
              <Badge variant={s.coverage === "full" ? "emerald" : "saffron"}>
                {s.coverage === "full" ? "Full funding" : "Partial funding"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {s.funder} · {s.level === "multiple" ? "All levels" : s.level} ·{" "}
              {s.countries.map(countryLabel).join(", ")}
            </p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
          />
        </button>
      </h3>

      <div id={panelId} hidden={!open} role="region" aria-labelledby={triggerId} className="border-t border-line p-5">
        <p className="text-sm text-ink">{s.coverageDetail}</p>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-faint">
          Eligibility (Pakistan-specific)
        </p>
        <ul className="mt-2 space-y-1.5">
          {s.eligibility.map((e) => (
            <li key={e} className="flex gap-2 text-xs text-muted">
              <span className="text-saffron">•</span>
              {e}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge variant="muted">Deadline: {s.deadline}</Badge>
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-faint">
          How to apply
        </p>
        <ol className="mt-2 space-y-2">
          {s.howToApply.map((step, i) => (
            <li key={step} className="flex gap-2 text-xs text-muted">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[9px] font-bold text-saffron">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {s.sourceUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Official page
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AbroadScholarshipsExplorer() {
  const [category, setCategory] = React.useState<AbroadScholarshipCategory | "all">("all");
  const [country, setCountry] = React.useState<string>("all");
  const [level, setLevel] = React.useState<AbroadScholarship["level"] | "all">("all");
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = filterAbroadScholarships(data.scholarships, { category, country, level, query });

  const groups =
    category === "all"
      ? CATEGORY_TABS.filter((t) => t.value !== "all").map((t) => ({
          label: t.label,
          items: filtered.filter((s) => s.category === t.value),
        }))
      : [{ label: CATEGORY_TABS.find((t) => t.value === category)?.label ?? "", items: filtered }];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={category === t.value}
            onClick={() => setCategory(t.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === t.value
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {t.label} ({categoryCount(t.value)})
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search by name, funder, or eligibility..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="h-10 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-saffron/50"
        >
          <option value="all">All countries</option>
          {countryData.countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              aria-pressed={level === l.value}
              onClick={() => setLevel(l.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                level === l.value
                  ? "border-saffron/40 bg-saffron/10 text-saffron"
                  : "border-line bg-surface text-muted hover:text-ink"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {groups.every((g) => g.items.length === 0) && (
          <div className="card-glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted">No scholarships match these filters.</p>
          </div>
        )}
        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <section key={g.label}>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-faint">
                  {g.label} · {g.items.length}
                </h2>
                <div className="space-y-4">
                  {g.items.map((s) => (
                    <ScholarshipCard
                      key={s.id}
                      s={s}
                      open={openId === s.id}
                      onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                    />
                  ))}
                </div>
              </section>
            )
        )}
      </div>

      <p className="mt-8 font-mono text-[11px] text-faint">
        Data compiled {data.dataYear}. Deadlines are approximate — always confirm on the official
        program page before applying.
      </p>
    </div>
  );
}
