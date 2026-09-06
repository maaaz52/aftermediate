"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { filterAbroadTests, testsForCountry } from "@/lib/abroad-filters";
import { formatPkr } from "@/lib/abroad-planner";
import type { AbroadCountry, AbroadTest, AbroadTestKind } from "@/lib/types";
import tJson from "@/data/abroad-tests.json";
import cJson from "@/data/abroad-countries.json";

const data = tJson as unknown as { dataYear: number; tests: AbroadTest[] };
const countryData = cJson as unknown as { countries: AbroadCountry[] };

const KIND_TABS: { value: AbroadTestKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "english", label: "English" },
  { value: "aptitude", label: "Aptitude" },
  { value: "graduate", label: "Graduate" },
  { value: "language", label: "Language" },
];

const KIND_LABEL: Record<AbroadTestKind, string> = {
  english: "English proficiency",
  aptitude: "Aptitude / admission",
  graduate: "Graduate admission",
  language: "Country language",
};

function kindCount(kind: AbroadTestKind | "all"): number {
  if (kind === "all") return data.tests.length;
  return data.tests.filter((t) => t.kind === kind).length;
}

function TestCard({ t }: { t: AbroadTest }) {
  return (
    <Link
      href={`/abroad/test-prep/${t.id}`}
      className="card-glass block rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-bold text-ink">{t.short}</span>
        <Badge variant="muted">{KIND_LABEL[t.kind]}</Badge>
        <Badge variant="saffron">{t.competitiveScore}</Badge>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted">{t.name}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
          {formatPkr(t.feePkr)}
        </span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
          {t.frequency}
        </span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
          Valid: {t.validity}
        </span>
      </div>
    </Link>
  );
}

export function TestPrepExplorer({ initialCountry }: { initialCountry: string | null }) {
  const validInitial =
    initialCountry && countryData.countries.some((c) => c.id === initialCountry)
      ? initialCountry
      : "all";
  const [kind, setKind] = React.useState<AbroadTestKind | "all">("all");
  const [country, setCountry] = React.useState<string>(validInitial);
  const [query, setQuery] = React.useState("");

  const filtered = filterAbroadTests(data.tests, { kind, country, query });
  const required = country === "all" ? [] : testsForCountry(data.tests, country);
  const countryName = countryData.countries.find((c) => c.id === country)?.name;

  return (
    <div>
      <div className="card-glass rounded-2xl p-4">
        <label htmlFor="which-tests" className="text-xs font-semibold uppercase tracking-widest text-faint">
          Which tests do I need?
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            id="which-tests"
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
          {country !== "all" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">{countryName} requires / accepts:</span>
              {required.map((t) => (
                <Link
                  key={t.id}
                  href={`/abroad/test-prep/${t.id}`}
                  className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-xs font-medium text-saffron transition-colors hover:bg-saffron/20"
                >
                  {t.short} →
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {KIND_TABS.map((k) => (
          <button
            key={k.value}
            type="button"
            aria-pressed={kind === k.value}
            onClick={() => setKind(k.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              kind === k.value
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {k.label} ({kindCount(k.value)})
          </button>
        ))}
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          className="pl-9"
          placeholder="Search tests..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-5 space-y-4">
        {filtered.length === 0 && (
          <div className="card-glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted">No tests match these filters.</p>
          </div>
        )}
        {filtered.map((t) => (
          <TestCard key={t.id} t={t} />
        ))}
      </div>

      <p className="mt-8 font-mono text-[11px] text-faint">
        Data compiled {data.dataYear}. Fees and formats change — confirm on the official test site before booking.
      </p>
    </div>
  );
}
