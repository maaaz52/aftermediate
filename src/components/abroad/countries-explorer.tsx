"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ExternalLink, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  cheapestCountry,
  compareCountries,
  filterCountries,
  lowestVisaFeeCountry,
  monthlyLivingTotal,
  mostGenerousPostStudyWork,
  sortCountries,
} from "@/lib/abroad-filters";
import { formatPkr } from "@/lib/abroad-planner";
import type { AbroadCountry, AbroadRegion } from "@/lib/types";
import json from "@/data/abroad-countries.json";

const data = json as unknown as { dataYear: number; countries: AbroadCountry[] };

const REGION_FILTERS: { value: AbroadRegion | "all"; label: string }[] = [
  { value: "all", label: "All regions" },
  { value: "europe", label: "Europe" },
  { value: "asia", label: "Asia" },
  { value: "north-america", label: "North America" },
];

const REGION_LABEL: Record<AbroadRegion, string> = {
  europe: "Europe",
  asia: "Asia",
  "north-america": "North America",
};

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
      aria-pressed={active}
      onClick={onClick}
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

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-glass rounded-2xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}

function CompareTable({
  countries,
  onClear,
}: {
  countries: AbroadCountry[];
  onClear: () => void;
}) {
  const rows: { label: string; get: (c: AbroadCountry) => string }[] = [
    { label: "Region", get: (c) => REGION_LABEL[c.region] },
    { label: "Language", get: (c) => c.language },
    { label: "Tuition — Bachelor's", get: (c) => `${formatPkr(c.tuition.ug.min)} – ${formatPkr(c.tuition.ug.max)}/yr` },
    { label: "Tuition — Master's", get: (c) => `${formatPkr(c.tuition.masters.min)} – ${formatPkr(c.tuition.masters.max)}/yr` },
    { label: "Tuition — PhD", get: (c) => `${formatPkr(c.tuition.phd.min)} – ${formatPkr(c.tuition.phd.max)}/yr` },
    { label: "Living (big city)", get: (c) => `${formatPkr(monthlyLivingTotal(c, "big"))}/mo` },
    { label: "Visa fee", get: (c) => formatPkr(c.visa.feePkr) },
    { label: "Visa processing", get: (c) => c.visa.processingTime },
    { label: "Post-study work", get: (c) => c.postStudyWork },
    { label: "Required tests", get: (c) => c.requiredTests.map((t) => t.toUpperCase()).join(", ") },
    { label: "Top fields", get: (c) => c.topFields.slice(0, 3).join(", ") },
    { label: "Pros", get: (c) => c.pros.join(" · ") },
    { label: "Cons", get: (c) => c.cons.join(" · ") },
  ];
  return (
    <div className="card-glass overflow-hidden rounded-2xl border-saffron/30">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-bold text-ink">
          Comparing {countries.length} countries
        </p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-2 font-semibold text-faint"> </th>
              {countries.map((c) => (
                <th key={c.id} className="px-4 py-2 font-bold text-ink">
                  {c.flag} {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-2 align-top font-semibold text-faint">{row.label}</td>
                {countries.map((c) => (
                  <td key={c.id} className="px-4 py-2 align-top text-muted">
                    {row.get(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CountryCard({
  c,
  compare,
  onToggleCompare,
}: {
  c: AbroadCountry;
  compare: boolean;
  onToggleCompare: () => void;
}) {
  return (
    <div className="card-glass flex items-center gap-3 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/abroad/countries/${c.id}`}
        className="min-w-0 flex-1"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-2xl">{c.flag}</span>
          <span className="text-lg font-bold text-ink">{c.name}</span>
          <Badge variant="muted">{REGION_LABEL[c.region]}</Badge>
          <Badge variant={c.tuition.ug.max === 0 ? "emerald" : "info"}>
            {c.tuition.ug.max === 0 ? "No tuition (public)" : "Paid tuition"}
          </Badge>
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {c.capital} · {c.language} · {c.postStudyWorkMonths}mo post-study work
        </span>
      </Link>
      <button
        type="button"
        aria-pressed={compare}
        onClick={onToggleCompare}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          compare
            ? "border-saffron/40 bg-saffron/10 text-saffron"
            : "border-line text-muted hover:text-ink"
        )}
      >
        {compare && <Check className="h-3 w-3" />}
        Compare
      </button>
    </div>
  );
}

export function CountriesExplorer() {
  const [query, setQuery] = React.useState("");
  const [region, setRegion] = React.useState<AbroadRegion | "all">("all");
  const [sort, setSort] = React.useState<"name" | "cheapest">("name");
  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  const [medicalOnly, setMedicalOnly] = React.useState(false);

  const baseFiltered = filterCountries(data.countries, { query, region });
  const filtered = sortCountries(
    medicalOnly
      ? baseFiltered.filter((c) => c.topFields.some((f) => /medic|mbbs|dentist/i.test(f)))
      : baseFiltered,
    sort
  );

  const cheapest = cheapestCountry(data.countries);
  const bestWork = mostGenerousPostStudyWork(data.countries);
  const lowestVisa = lowestVisaFeeCountry(data.countries);
  const compareList = compareCountries(data.countries, compareIds);

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
          ? prev
          : [...prev, id]
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Cheapest overall"
          value={`${cheapest.flag} ${cheapest.name}`}
          sub={`≈ ${formatPkr(monthlyLivingTotal(cheapest, "big"))}/mo living + ${formatPkr((cheapest.tuition.ug.min + cheapest.tuition.ug.max) / 2)}/yr UG tuition`}
        />
        <StatCard
          label="Best post-study work"
          value={`${bestWork.flag} ${bestWork.name}`}
          sub={`${bestWork.postStudyWorkMonths} months — ${bestWork.postStudyWork}`}
        />
        <StatCard
          label="Lowest visa fee"
          value={`${lowestVisa.flag} ${lowestVisa.name}`}
          sub={`${formatPkr(lowestVisa.visa.feePkr)} student visa fee`}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search by country, capital, or field..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {REGION_FILTERS.map((r) => (
            <Chip key={r.value} active={region === r.value} onClick={() => setRegion(r.value)}>
              {r.label}
            </Chip>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-line sm:block" />
          <Chip active={medicalOnly} onClick={() => setMedicalOnly(!medicalOnly)}>
            Best for Medicine
          </Chip>
          <span className="mx-1 hidden h-4 w-px bg-line sm:block" />
          <Chip active={sort === "name"} onClick={() => setSort("name")}>
            A–Z
          </Chip>
          <Chip active={sort === "cheapest"} onClick={() => setSort("cheapest")}>
            Cheapest first
          </Chip>
        </div>
        {compareIds.length >= 2 && (
          <p className="text-xs text-muted">
            {compareIds.length}/3 selected — pick up to 3 to compare side by side.
          </p>
        )}
      </div>

      {compareList.length >= 2 && (
        <div className="mt-5">
          <CompareTable countries={compareList} onClear={() => setCompareIds([])} />
        </div>
      )}

      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <div className="card-glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted">No countries match these filters.</p>
          </div>
        )}
        {filtered.map((c) => (
          <CountryCard
            key={c.id}
            c={c}
            compare={compareIds.includes(c.id)}
            onToggleCompare={() => toggleCompare(c.id)}
          />
        ))}
      </div>

      <p className="mt-8 font-mono text-[11px] text-faint">
        Data compiled {data.dataYear}. Fees change per cycle — verify on official pages before applying.
      </p>
    </div>
  );
}
