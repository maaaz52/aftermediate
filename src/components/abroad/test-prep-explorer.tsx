"use client";

import * as React from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
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

function TestCard({
  t,
  open,
  onToggle,
}: {
  t: AbroadTest;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `test-panel-${t.id}`;
  const triggerId = `test-trigger-${t.id}`;
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
              <span className="text-base font-bold text-ink">{t.short}</span>
              <Badge variant="muted">{KIND_LABEL[t.kind]}</Badge>
              <Badge variant="saffron">{t.competitiveScore}</Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">{t.name}</p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
          />
        </button>
      </h3>

      <div id={panelId} hidden={!open} role="region" aria-labelledby={triggerId} className="border-t border-line p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Test pattern</p>
        <div className="mt-2 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-2/60">
                <th className="px-3 py-2 font-semibold text-faint">Section</th>
                <th className="px-3 py-2 font-semibold text-faint">Content</th>
                <th className="px-3 py-2 font-semibold text-faint">Duration</th>
              </tr>
            </thead>
            <tbody>
              {t.pattern.map((p) => (
                <tr key={p.section} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-2 font-medium text-ink">{p.section}</td>
                  <td className="px-3 py-2 text-muted">{p.content}</td>
                  <td className="px-3 py-2 font-mono text-muted">{p.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-2/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Fee</p>
            <p className="mt-1 font-mono text-sm text-ink">{formatPkr(t.feePkr)}</p>
            <p className="mt-0.5 text-[11px] text-muted">{t.feeNote}</p>
          </div>
          <div className="rounded-lg bg-surface-2/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Frequency</p>
            <p className="mt-1 text-sm text-ink">{t.frequency}</p>
            <p className="mt-0.5 text-[11px] text-muted">Validity: {t.validity}</p>
          </div>
          <div className="rounded-lg bg-surface-2/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Competitive score</p>
            <p className="mt-1 text-sm font-semibold text-saffron">{t.competitiveScore}</p>
          </div>
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-faint">How to prepare</p>
        <ol className="mt-2 space-y-2">
          {t.prep.tips.map((tip, i) => (
            <li key={tip} className="flex gap-2 text-xs text-muted">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[9px] font-bold text-saffron">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {t.prep.resources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {r.label}
            </a>
          ))}
        </div>
      </div>
    </div>
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
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = filterAbroadTests(data.tests, { kind, country, query });
  const required = country === "all" ? [] : testsForCountry(data.tests, country);
  const countryName = countryData.countries.find((c) => c.id === country)?.name;
  const visibleOpenId = filtered.some((t) => t.id === openId) ? openId : null;

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
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOpenId(t.id)}
                  className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-xs font-medium text-saffron transition-colors hover:bg-saffron/20"
                >
                  {t.short}
                </button>
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
          <TestCard
            key={t.id}
            t={t}
            open={visibleOpenId === t.id}
            onToggle={() => setOpenId(visibleOpenId === t.id ? null : t.id)}
          />
        ))}
      </div>

      <p className="mt-8 font-mono text-[11px] text-faint">
        Data compiled {data.dataYear}. Fees and formats change — confirm on the official test site before booking.
      </p>
    </div>
  );
}
