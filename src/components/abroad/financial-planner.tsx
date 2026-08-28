"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { firstYearCost, formatPkr, LIFESTYLE_MULTIPLIERS, savingsTimeline, yearlyProjection } from "@/lib/abroad-planner";
import { monthlyLivingTotal } from "@/lib/abroad-filters";
import type { AbroadCountry, AbroadTest, CityTier, DegreeLevel, Lifestyle } from "@/lib/types";
import cJson from "@/data/abroad-countries.json";
import tJson from "@/data/abroad-tests.json";

const countryData = cJson as unknown as { dataYear: number; countries: AbroadCountry[] };
const testData = tJson as unknown as { tests: AbroadTest[] };

const LEVELS: { value: DegreeLevel; label: string }[] = [
  { value: "ug", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
];

const TIERS: { value: CityTier; label: string }[] = [
  { value: "big", label: "Big city" },
  { value: "small", label: "Small city" },
];

const LIFESTYLES: { value: Lifestyle; label: string }[] = [
  { value: "frugal", label: "Frugal" },
  { value: "moderate", label: "Moderate" },
  { value: "comfortable", label: "Comfortable" },
];

function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === o.value
              ? "border-saffron/40 bg-saffron/10 text-saffron"
              : "border-line bg-surface text-muted hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BreakdownRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-line/60 py-2 text-sm last:border-0",
        strong && "font-bold text-ink"
      )}
    >
      <span className={strong ? "text-ink" : "text-muted"}>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export function FinancialPlanner() {
  const [countryId, setCountryId] = React.useState("germany");
  const [level, setLevel] = React.useState<DegreeLevel>("masters");
  const [tier, setTier] = React.useState<CityTier>("big");
  const [lifestyle, setLifestyle] = React.useState<Lifestyle>("moderate");
  const [tuitionT, setTuitionT] = React.useState(0.5);
  const [savings, setSavings] = React.useState("");
  const [currency, setCurrency] = React.useState<"pkr" | "local">("pkr");

  const country = countryData.countries.find((c) => c.id === countryId) ?? countryData.countries[0];
  const breakdown = firstYearCost(country, level, tier, lifestyle, tuitionT, testData.tests);
  const projection = yearlyProjection(breakdown, 4);
  const maxYear = Math.max(...projection);
  const monthly = monthlyLivingTotal(country, tier) * LIFESTYLE_MULTIPLIERS[lifestyle];
  const livingM = country.living[tier === "big" ? "bigCity" : "smallCity"];
  const savingsNum = Number(savings);
  const timeline = savingsNum > 0 ? savingsTimeline(savingsNum, breakdown.total) : null;
  const showLocal = currency === "local";

  function fmt(n: number): string {
    if (showLocal) {
      const local = n / country.currency.toPkr;
      return `${country.currency.symbol}${local.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return formatPkr(n);
  }

  const budgetRows = [
    { label: "Rent", value: livingM.rent * LIFESTYLE_MULTIPLIERS[lifestyle] },
    { label: "Food", value: livingM.food * LIFESTYLE_MULTIPLIERS[lifestyle] },
    { label: "Transport", value: livingM.transport * LIFESTYLE_MULTIPLIERS[lifestyle] },
    { label: "Utilities", value: livingM.utilities * LIFESTYLE_MULTIPLIERS[lifestyle] },
    { label: "Misc", value: livingM.misc * LIFESTYLE_MULTIPLIERS[lifestyle] },
  ];

  const range = country.tuition[level];

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-glass rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Your plan</p>

          <label htmlFor="planner-country" className="mt-4 block text-xs font-medium text-muted">
            Country
          </label>
          <select
            id="planner-country"
            value={countryId}
            onChange={(e) => setCountryId(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-saffron/50"
          >
            {countryData.countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>

          <p className="mt-4 text-xs font-medium text-muted">Degree level</p>
          <div className="mt-1">
            <ChoiceChips options={LEVELS} value={level} onChange={setLevel} />
          </div>

          <p className="mt-4 text-xs font-medium text-muted">City tier</p>
          <div className="mt-1">
            <ChoiceChips options={TIERS} value={tier} onChange={setTier} />
          </div>

          <p className="mt-4 text-xs font-medium text-muted">Lifestyle</p>
          <div className="mt-1">
            <ChoiceChips options={LIFESTYLES} value={lifestyle} onChange={setLifestyle} />
          </div>

          <label htmlFor="planner-tuition" className="mt-4 block text-xs font-medium text-muted">
            Tuition ({fmt(range.min)} – {fmt(range.max)}/yr)
          </label>
          <input
            id="planner-tuition"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(tuitionT * 100)}
            onChange={(e) => setTuitionT(Number(e.target.value) / 100)}
            className="mt-1 w-full accent-saffron"
          />
          <p className="mt-1 font-mono text-xs text-ink">Selected: {fmt(breakdown.tuition)}/yr</p>

          <label htmlFor="planner-savings" className="mt-4 block text-xs font-medium text-muted">
            Monthly savings (PKR)
          </label>
          <input
            id="planner-savings"
            type="number"
            min={0}
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            placeholder="e.g. 100000"
            className="mt-1 h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
        </div>

        <div className="space-y-4">
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                First-year total
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-pressed={currency === "pkr"}
                  onClick={() => setCurrency("pkr")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    currency === "pkr"
                      ? "border-saffron/40 bg-saffron/10 text-saffron"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  PKR
                </button>
                <button
                  type="button"
                  aria-pressed={currency === "local"}
                  onClick={() => setCurrency("local")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    currency === "local"
                      ? "border-saffron/40 bg-saffron/10 text-saffron"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  {country.currency.code}
                </button>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{fmt(breakdown.total)}</p>
            <p className="mt-0.5 text-xs text-muted">
              {country.name} · {LEVELS.find((l) => l.value === level)?.label} ·{" "}
              {TIERS.find((t) => t.value === tier)?.label.toLowerCase()} · {lifestyle} lifestyle
            </p>
            <div className="mt-4">
              <BreakdownRow label="Tuition" value={fmt(breakdown.tuition)} />
              <BreakdownRow label="Living (12 months)" value={fmt(breakdown.living)} />
              <BreakdownRow label="Visa fee" value={fmt(breakdown.visaFee)} />
              <BreakdownRow label="Application fee" value={fmt(breakdown.applicationFee)} />
              <BreakdownRow label="Insurance" value={fmt(breakdown.insurance)} />
              <BreakdownRow label="Flight" value={fmt(breakdown.flight)} />
              <BreakdownRow label="Tests" value={fmt(breakdown.testFees)} />
              <BreakdownRow label="Total" value={fmt(breakdown.total)} strong />
            </div>
          </div>

          <div className="card-glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Monthly budget ({lifestyle})
            </p>
            <div className="mt-2">
              {budgetRows.map((r) => (
                <BreakdownRow key={r.label} label={r.label} value={fmt(r.value)} />
              ))}
              <BreakdownRow label="Total / month" value={fmt(monthly)} strong />
            </div>
          </div>
        </div>
      </div>

      <div className="card-glass mt-4 rounded-2xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          4-year projection (6% tuition inflation)
        </p>
        <div className="mt-4 space-y-3">
          {projection.map((y, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-12 shrink-0 font-mono text-xs text-muted">Year {i + 1}</span>
              <div className="h-6 flex-1 overflow-hidden rounded bg-surface-2">
                <div
                  className="h-6 rounded bg-saffron/70"
                  style={{ width: `${Math.max(4, (y / maxYear) * 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right font-mono text-xs text-ink">{fmt(y)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass mt-4 rounded-2xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Savings timeline</p>
        {savingsNum <= 0 ? (
          <p className="mt-2 text-sm text-muted">Enter how much you can save monthly to see your timeline.</p>
        ) : timeline ? (
          <p className="mt-2 text-sm text-ink">
            Saving {formatPkr(savingsNum)}/month → first year funded in{" "}
            <span className="font-bold text-saffron">{timeline.months} months</span> (≈{" "}
            {timeline.yearsMonths}).
          </p>
        ) : null}
      </div>

      <p className="mt-6 font-mono text-[11px] text-faint">
        Rates as of {country.currency.rateAsOf}. Estimates only — verify costs on official pages before applying.
      </p>
    </div>
  );
}
