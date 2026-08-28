"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, ExternalLink, Search, X } from "lucide-react";
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

const LEVEL_LABEL: Record<"ug" | "masters" | "phd", string> = {
  ug: "Bachelor's",
  masters: "Master's",
  phd: "PhD",
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

function CostLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-ink">{value}</span>
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

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 first:mt-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-faint">{title}</h4>
      <div id={id} className="mt-2">
        {children}
      </div>
    </section>
  );
}

function CountryCard({
  c,
  open,
  compare,
  onToggle,
  onToggleCompare,
}: {
  c: AbroadCountry;
  open: boolean;
  compare: boolean;
  onToggle: () => void;
  onToggleCompare: () => void;
}) {
  const panelId = `country-panel-${c.id}`;
  const triggerId = `country-trigger-${c.id}`;
  const bigCity = c.living.bigCity;
  const smallCity = c.living.smallCity;
  const bigTotal = monthlyLivingTotal(c, "big");
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 p-5">
        <h3 className="min-w-0 flex-1">
          <button
            type="button"
            id={triggerId}
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex w-full items-center gap-4 text-left"
          >
            <span className="text-2xl">{c.flag}</span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold text-ink">{c.name}</span>
                <Badge variant="muted">{REGION_LABEL[c.region]}</Badge>
                <Badge variant={c.tuition.ug.max === 0 ? "emerald" : "info"}>
                  {c.tuition.ug.max === 0 ? "No tuition (public)" : "Paid tuition"}
                </Badge>
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {c.capital} · {c.language} · 1 {c.currency.code} ≈ PKR {Math.round(c.currency.toPkr)}
              </span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
            />
          </button>
        </h3>
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

      <div id={panelId} hidden={!open} role="region" aria-labelledby={triggerId} className="border-t border-line p-5">
        <p className="text-sm leading-relaxed text-muted">{c.intro}</p>

        <Section id={`${c.id}-visa`} title="Student visa">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="saffron">{c.visa.type}</Badge>
            <span className="font-mono text-xs text-ink">{formatPkr(c.visa.feePkr)}</span>
            <span className="text-xs text-muted">· {c.visa.processingTime}</span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {c.visa.keyPoints.map((kp) => (
              <li key={kp} className="flex gap-2 text-xs text-muted">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                {kp}
              </li>
            ))}
          </ul>
        </Section>

        <Section id={`${c.id}-intakes`} title="Intakes">
          <div className="flex flex-wrap gap-2">
            {c.intakes.map((i) => (
              <Badge key={i} variant="muted">{i}</Badge>
            ))}
          </div>
        </Section>

        <Section id={`${c.id}-tuition`} title="Tuition per year (PKR)">
          <div className="overflow-hidden rounded-lg border border-line">
            {(Object.keys(c.tuition) as ("ug" | "masters" | "phd")[]).map((level) => (
              <CostLine
                key={level}
                label={LEVEL_LABEL[level]}
                value={`${formatPkr(c.tuition[level].min)} – ${formatPkr(c.tuition[level].max)}`}
              />
            ))}
          </div>
        </Section>

        <Section id={`${c.id}-living`} title="Monthly living costs (PKR)">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-2/60 p-3">
              <p className="text-xs font-semibold text-ink">Big city · {formatPkr(bigTotal)}/mo</p>
              <div className="mt-2">
                <CostLine label="Rent" value={formatPkr(bigCity.rent)} />
                <CostLine label="Food" value={formatPkr(bigCity.food)} />
                <CostLine label="Transport" value={formatPkr(bigCity.transport)} />
                <CostLine label="Utilities" value={formatPkr(bigCity.utilities)} />
                <CostLine label="Misc" value={formatPkr(bigCity.misc)} />
              </div>
            </div>
            <div className="rounded-lg bg-surface-2/60 p-3">
              <p className="text-xs font-semibold text-ink">Small city · {formatPkr(monthlyLivingTotal(c, "small"))}/mo</p>
              <div className="mt-2">
                <CostLine label="Rent" value={formatPkr(smallCity.rent)} />
                <CostLine label="Food" value={formatPkr(smallCity.food)} />
                <CostLine label="Transport" value={formatPkr(smallCity.transport)} />
                <CostLine label="Utilities" value={formatPkr(smallCity.utilities)} />
                <CostLine label="Misc" value={formatPkr(smallCity.misc)} />
              </div>
            </div>
          </div>
        </Section>

        <Section id={`${c.id}-one-time`} title="One-time costs (PKR)">
          <div className="overflow-hidden rounded-lg border border-line">
            <CostLine label="Application fee" value={formatPkr(c.oneTime.applicationFee)} />
            <CostLine label="Visa fee" value={formatPkr(c.oneTime.visaFee)} />
            <CostLine label="Health insurance" value={formatPkr(c.oneTime.insurance)} />
            <CostLine label="Flight (round trip)" value={formatPkr(c.oneTime.flight)} />
          </div>
        </Section>

        <Section id={`${c.id}-docs`} title="Documents checklist">
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {c.documents.map((d) => (
              <li key={d} className="flex gap-2 text-xs text-muted">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                {d}
              </li>
            ))}
          </ul>
        </Section>

        <Section id={`${c.id}-tests`} title="Required tests">
          <div className="flex flex-wrap gap-2">
            {c.requiredTests.map((t) => (
              <Link
                key={t}
                href={`/abroad/test-prep?country=${c.id}`}
                className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
              >
                {t.toUpperCase()} →
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-faint">Opens the Test Prep page filtered to {c.name}.</p>
        </Section>

        <Section id={`${c.id}-pathway`} title="Pathway to admission">
          <ol className="space-y-3">
            {c.pathway.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[10px] font-bold text-saffron">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="text-xs text-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id={`${c.id}-work`} title="After graduation">
          <p className="text-sm text-ink">{c.postStudyWork}</p>
        </Section>

        <Section id={`${c.id}-pros-cons`} title="Pros & cons">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-emerald">Pros</p>
              <ul className="mt-1.5 space-y-1">
                {c.pros.map((p) => (
                  <li key={p} className="flex gap-2 text-xs text-muted">
                    <span className="text-emerald">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-danger">Cons</p>
              <ul className="mt-1.5 space-y-1">
                {c.cons.map((con) => (
                  <li key={con} className="flex gap-2 text-xs text-muted">
                    <span className="text-danger">–</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {c.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CountriesExplorer() {
  const [query, setQuery] = React.useState("");
  const [region, setRegion] = React.useState<AbroadRegion | "all">("all");
  const [sort, setSort] = React.useState<"name" | "cheapest">("name");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [compareIds, setCompareIds] = React.useState<string[]>([]);

  const filtered = sortCountries(filterCountries(data.countries, { query, region }), sort);

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

      <div className="mt-5 space-y-4">
        {filtered.length === 0 && (
          <div className="card-glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted">No countries match these filters.</p>
          </div>
        )}
        {filtered.map((c) => (
          <CountryCard
            key={c.id}
            c={c}
            open={openId === c.id}
            compare={compareIds.includes(c.id)}
            onToggle={() => setOpenId(openId === c.id ? null : c.id)}
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
