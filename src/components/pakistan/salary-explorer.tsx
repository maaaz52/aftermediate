"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  fastestGrowingField,
  formatSalaryRange,
  highestPayingField,
  mostStableField,
  sortSalaryFields,
} from "@/lib/pakistan-filters";
import type { CareerPath, SalaryField, SalaryLevel } from "@/lib/types";
import json from "@/data/salary-fields.json";

const data = json as unknown as {
  dataYear: number;
  disclaimer: string;
  fields: SalaryField[];
  careerPaths: CareerPath[];
};

const LEVELS: { value: SalaryLevel; label: string }[] = [
  { value: "entry", label: "Entry (0-2 yr)" },
  { value: "mid", label: "Mid (3-5 yr)" },
  { value: "senior", label: "Senior (6+ yr)" },
];

const DEMAND_STYLE: Record<SalaryField["demand"], { label: string; variant: "emerald" | "saffron" | "muted" }> = {
  high: { label: "High", variant: "emerald" },
  medium: { label: "Medium", variant: "saffron" },
  low: { label: "Low", variant: "muted" },
};

const STABILITY_STYLE: Record<SalaryField["stability"], { label: string; variant: "emerald" | "saffron" | "muted" }> = {
  high: { label: "High", variant: "emerald" },
  medium: { label: "Medium", variant: "saffron" },
  low: { label: "Low", variant: "muted" },
};

function StatCard({ label, field, detail }: { label: string; field: SalaryField; detail: string }) {
  return (
    <div className="card-glass rounded-2xl p-5 text-center">
      <p className="text-[10px] uppercase tracking-widest text-faint">{label}</p>
      <p className="mt-2 text-2xl">{field.emoji}</p>
      <p className="mt-1 text-base font-bold text-ink">{field.name}</p>
      <p className="mt-1 font-mono text-xs text-saffron">{detail}</p>
    </div>
  );
}

function SortHeader({
  label,
  k,
  active,
  onToggle,
}: {
  label: string;
  k: "name" | "salary" | "growth";
  active: boolean;
  onToggle: (key: "name" | "salary" | "growth") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(k)}
      aria-pressed={active}
      className="inline-flex items-center gap-1 hover:text-ink"
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", active ? "text-saffron" : "text-faint")} />
    </button>
  );
}

export function SalaryExplorer() {
  const [level, setLevel] = React.useState<SalaryLevel>("entry");
  const [sortKey, setSortKey] = React.useState<"name" | "salary" | "growth">("salary");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const topPay = highestPayingField(data.fields);
  const topGrowth = fastestGrowingField(data.fields);
  const topStable = mostStableField(data.fields);

  const toggleSort = (key: "name" | "salary" | "growth") => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const rows = React.useMemo(() => {
    if (sortKey === "salary") return sortSalaryFields(data.fields, level, sortDir);
    const factor = sortDir === "desc" ? -1 : 1;
    return [...data.fields].sort((a, b) =>
      sortKey === "growth" ? (a.growth - b.growth) * factor : a.name.localeCompare(b.name) * factor
    );
  }, [level, sortKey, sortDir]);

  const ariaSortFor = (k: "name" | "salary" | "growth"): "none" | "ascending" | "descending" =>
    sortKey === k ? (sortDir === "desc" ? "descending" : "ascending") : "none";

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Highest paying"
          field={topPay}
          detail={`${formatSalaryRange(topPay.salaries.senior[0], topPay.salaries.senior[1])} senior`}
        />
        <StatCard label="Fastest growing" field={topGrowth} detail={`+${topGrowth.growth}%/yr`} />
        <StatCard label="Most stable" field={topStable} detail={topStable.demand === "high" ? "high stability + high demand" : "high stability"} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => setLevel(l.value)}
            aria-pressed={level === l.value}
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

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-faint">
              <th className="py-3 pr-4" aria-sort={ariaSortFor("name")}>
                <SortHeader label="Field" k="name" active={sortKey === "name"} onToggle={toggleSort} />
              </th>
              <th className="py-3 pr-4" aria-sort={ariaSortFor("salary")}>
                <SortHeader label={`Salary (PKR/mo)`} k="salary" active={sortKey === "salary"} onToggle={toggleSort} />
              </th>
              <th className="py-3 pr-4">Demand</th>
              <th className="py-3 pr-4" aria-sort={ariaSortFor("growth")}>
                <SortHeader label="Growth" k="growth" active={sortKey === "growth"} onToggle={toggleSort} />
              </th>
              <th className="py-3">Stability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const [min, max] = f.salaries[level];
              const demand = DEMAND_STYLE[f.demand];
              const stability = STABILITY_STYLE[f.stability];
              return (
                <tr key={f.id} className="border-b border-line/60">
                  <td className="py-3 pr-4">
                    <span className="mr-2">{f.emoji}</span>
                    <span className="font-medium text-ink">{f.name}</span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-saffron">
                    {formatSalaryRange(min, max)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={demand.variant}>{demand.label}</Badge>
                  </td>
                  <td className="py-3 pr-4 font-mono text-emerald">+{f.growth}%</td>
                  <td className="py-3">
                    <Badge variant={stability.variant}>{stability.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
        Freelancing vs Government vs Private
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {data.careerPaths.map((c) => (
          <div key={c.id} className="card-glass flex flex-col rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{c.emoji}</span>
              <h3 className="text-lg font-bold text-ink">{c.name}</h3>
            </div>
            <p className="mt-2 font-mono text-xs text-saffron">{c.incomeRange}</p>
            <ul className="mt-4 flex-1 space-y-1.5">
              {c.pros.map((p) => (
                <li key={p} className="flex gap-2 text-xs text-muted">
                  <span className="text-emerald">✓</span>
                  {p}
                </li>
              ))}
              {c.cons.map((x) => (
                <li key={x} className="flex gap-2 text-xs text-muted">
                  <span className="text-danger">✗</span>
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-faint">
              <span className="font-semibold text-muted">Best for:</span> {c.bestFor}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-faint">{data.disclaimer}</p>
      <p className="mt-1 text-xs text-faint">
        Compiled {data.dataYear}. Sources:{" "}
        {data.fields
          .flatMap((f) => f.sources)
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((url, i) => (
            <span key={url}>
              {i > 0 && " · "}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-saffron hover:underline"
              >
                {new URL(url).hostname.replace(/^www\./, "")}
              </a>
            </span>
          ))}
      </p>
    </div>
  );
}
