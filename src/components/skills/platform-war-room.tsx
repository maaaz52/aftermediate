"use client";

import * as React from "react";
import { ArrowLeft, ChevronDown, ExternalLink, LayoutGrid, RotateCcw, Sparkles, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import platformsJson from "@/data/skills-platforms.json";
import { wizardScore, type WizardAnswers } from "@/lib/skills";

type Platform = (typeof platformsJson)[number];
type View = "table" | "cards" | "wizard";
type SortKey = "name" | "fee" | "competition" | "newcomerFriendly" | "minWithdrawalUsd";

const KIND_LABELS: Record<Platform["kind"], string> = {
  marketplace: "Marketplace",
  showcase: "Showcase",
  agency: "Agency",
};

const NICHE_LABELS: Record<string, string> = {
  "web-dev": "Web Dev",
  design: "Design",
  data: "Data",
  writing: "Writing",
  marketing: "Marketing",
  video: "Video",
  ai: "AI",
};

const SKILL_OPTIONS = [
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "writing", label: "Writing" },
  { value: "data", label: "Data" },
  { value: "video", label: "Video" },
  { value: "other", label: "Other / not sure" },
];

const EXPERIENCE_OPTIONS = [
  { value: "none", label: "Zero experience", hint: "Never done client work" },
  { value: "some", label: "Some projects", hint: "A few self-made projects" },
  { value: "pro", label: "Professional", hint: "I have been paid for this" },
] as const;

const BUDGET_OPTIONS = [
  { value: "small", label: "Small", hint: "Low payout thresholds, quick cash" },
  { value: "mid", label: "Medium", hint: "Balanced payouts" },
  { value: "premium", label: "Premium", hint: "High-ticket clients" },
] as const;

const PAYOUT_OPTIONS = [
  { value: "payoneer", label: "Pakistan-friendly", hint: "Payoneer / Wise / bank transfer" },
  { value: "any", label: "Any method", hint: "I'll figure out payouts" },
] as const;

function Dots({ value, color }: { value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("h-2.5 w-2.5 border border-ink", i <= value ? color : "bg-surface-2")} />
      ))}
    </span>
  );
}

function feeColor(fee: number) {
  if (fee === 0) return "bg-emerald";
  if (fee <= 10) return "bg-info";
  if (fee <= 15) return "bg-amber";
  return "bg-danger";
}

export function PlatformWarRoom() {
  const platforms = platformsJson as Platform[];
  const [view, setView] = React.useState<View>("table");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [newcomerOnly, setNewcomerOnly] = React.useState(false);
  const [pkrOnly, setPkrOnly] = React.useState(false);
  const [niche, setNiche] = React.useState<string>("all");

  // wizard state
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<WizardAnswers>({ skill: "design", experience: "none", budget: "small", payout: "any" });
  const [showAll, setShowAll] = React.useState(false);

  const niches = React.useMemo(() => [...new Set(platforms.flatMap((p) => p.niches))].sort(), [platforms]);

  const filtered = React.useMemo(() => {
    let list = platforms;
    if (newcomerOnly) list = list.filter((p) => p.newcomerFriendly >= 3);
    if (pkrOnly) list = list.filter((p) => p.pkrFriendly);
    if (niche !== "all") list = list.filter((p) => p.niches.includes(niche));
    return [...list].sort((a, b) => {
      if (sortKey === "name") return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [platforms, newcomerOnly, pkrOnly, niche, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const results = React.useMemo(() => wizardScore(answers, platforms), [answers, platforms]);

  function resetWizard() {
    setStep(0);
    setAnswers({ skill: "design", experience: "none", budget: "small", payout: "any" });
    setShowAll(false);
  }

  return (
    <div className="space-y-5">
      {/* View switch */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border-2 border-ink bg-surface p-0.5">
          {(
            [
              { id: "table", label: "Table", icon: Table2 },
              { id: "cards", label: "Cards", icon: LayoutGrid },
              { id: "wizard", label: "Where should I start?", icon: Sparkles },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                view === v.id ? "bg-accent text-background" : "text-muted hover:text-ink"
              )}
            >
              <v.icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          ))}
        </div>
        {view !== "wizard" && (
          <div className="ml-auto flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={newcomerOnly} onChange={(e) => setNewcomerOnly(e.target.checked)} className="h-4 w-4 accent-accent" />
              Newcomer-friendly
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={pkrOnly} onChange={(e) => setPkrOnly(e.target.checked)} className="h-4 w-4 accent-emerald" />
              Pakistan payouts
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="h-8 rounded-lg border-2 border-ink bg-surface px-2 text-xs font-semibold text-ink focus:outline-none"
            >
              <option value="all">All niches</option>
              {niches.map((n) => (
                <option key={n} value={n}>
                  {NICHE_LABELS[n] ?? n}
                </option>
              ))}
            </select>
            <span className="font-mono text-faint">{filtered.length} platforms</span>
          </div>
        )}
      </div>

      {view === "wizard" ? (
        <div className="pixel-border bg-surface p-6">
          <h2 className="font-display text-sm text-ink">Where should I start?</h2>
          <p className="mt-1 text-sm text-muted">
            Answer 4 quick questions — I&apos;ll rank every platform for your situation. Deterministic math, no guesswork.
          </p>

          <div className="mt-4 flex gap-1.5">
            {["Skill", "Experience", "Budget", "Payout"].map((label, i) => (
              <div key={label} className="flex-1">
                <div className={cn("h-1.5 rounded-full", i <= step ? "bg-accent" : "bg-surface-2")} />
                <div className={cn("mt-1 text-center text-[10px] font-bold uppercase tracking-wide", i <= step ? "text-accent" : "text-faint")}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {step < 4 ? (
            <div className="mt-5">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {step === 0 &&
                  SKILL_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        setAnswers((a) => ({ ...a, skill: o.value }));
                        setStep(1);
                      }}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-colors",
                        answers.skill === o.value ? "border-ink bg-ink text-background" : "border-line bg-surface text-ink hover:border-ink"
                      )}
                    >
                      <div className="text-sm font-bold">{o.label}</div>
                    </button>
                  ))}
                {step === 1 &&
                  EXPERIENCE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        setAnswers((a) => ({ ...a, experience: o.value }));
                        setStep(2);
                      }}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-colors",
                        answers.experience === o.value ? "border-ink bg-ink text-background" : "border-line bg-surface text-ink hover:border-ink"
                      )}
                    >
                      <div className="text-sm font-bold">{o.label}</div>
                      <div className={cn("mt-0.5 text-xs", answers.experience === o.value ? "text-background/70" : "text-muted")}>{o.hint}</div>
                    </button>
                  ))}
                {step === 2 &&
                  BUDGET_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        setAnswers((a) => ({ ...a, budget: o.value }));
                        setStep(3);
                      }}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-colors",
                        answers.budget === o.value ? "border-ink bg-ink text-background" : "border-line bg-surface text-ink hover:border-ink"
                      )}
                    >
                      <div className="text-sm font-bold">{o.label}</div>
                      <div className={cn("mt-0.5 text-xs", answers.budget === o.value ? "text-background/70" : "text-muted")}>{o.hint}</div>
                    </button>
                  ))}
                {step === 3 &&
                  PAYOUT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        setAnswers((a) => ({ ...a, payout: o.value }));
                        setStep(4);
                      }}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-colors",
                        answers.payout === o.value ? "border-ink bg-ink text-background" : "border-line bg-surface text-ink hover:border-ink"
                      )}
                    >
                      <div className="text-sm font-bold">{o.label}</div>
                      <div className={cn("mt-0.5 text-xs", answers.payout === o.value ? "text-background/70" : "text-muted")}>{o.hint}</div>
                    </button>
                  ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-line bg-surface px-3 py-2 text-xs font-bold text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <span className="font-mono text-xs text-faint">Step {step + 1} of 4</span>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-ink">
                  Top picks for <span className="text-accent">{SKILL_OPTIONS.find((o) => o.value === answers.skill)?.label}</span> ·{" "}
                  {EXPERIENCE_OPTIONS.find((o) => o.value === answers.experience)?.label} ·{" "}
                  {BUDGET_OPTIONS.find((o) => o.value === answers.budget)?.label}
                </h3>
                <button
                  onClick={resetWizard}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border-2 border-line bg-surface px-3 py-1.5 text-[11px] font-bold text-muted hover:border-ink hover:text-ink"
                >
                  <RotateCcw className="h-3 w-3" /> Restart
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {results.slice(0, 3).map((r, rank) => {
                  const p = platforms.find((x) => x.id === r.id)!;
                  return (
                    <div key={r.id} className={cn("pixel-border bg-surface p-4", rank === 0 && "border-accent bg-accent/5")}>
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-md border-2 border-ink bg-ink font-display text-[10px] text-background">
                          #{rank + 1}
                        </span>
                        <h4 className="text-sm font-bold text-ink">{p.name}</h4>
                        <span className="ml-auto font-mono text-xs font-bold text-accent">{r.score}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {r.reasons.map((reason, i) => (
                          <p key={i} className="flex gap-1.5 text-xs leading-snug text-muted">
                            <span className="text-emerald">▸</span> {reason}
                          </p>
                        ))}
                      </div>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                      >
                        Visit {p.name} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowAll((s) => !s)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink"
              >
                {showAll ? "Hide" : "Show"} full ranking ({results.length})
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
              </button>
              {showAll && (
                <ol className="space-y-1 rounded-xl border border-line bg-surface-2/60 p-3">
                  {results.map((r, i) => {
                    const p = platforms.find((x) => x.id === r.id)!;
                    return (
                      <li key={r.id} className="flex items-center gap-3 font-mono text-xs">
                        <span className="w-6 text-faint">{i + 1}.</span>
                        <span className="font-bold text-ink">{p.name}</span>
                        <span className="ml-auto text-accent">{r.score}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-xl border-2 border-ink bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
                {(
                  [
                    { key: "name", label: "Platform" },
                    { key: "fee", label: "Fee %" },
                    { key: "competition", label: "Competition" },
                    { key: "newcomerFriendly", label: "Newcomer" },
                    { key: "minWithdrawalUsd", label: "Min payout" },
                    { key: null, label: "PK" },
                  ] as { key: SortKey | null; label: string }[]
                ).map((col) => (
                  <th key={col.label} className="px-3 py-2.5">
                    {col.key ? (
                      <button onClick={() => toggleSort(col.key!)} className="inline-flex items-center gap-1 hover:text-ink">
                        {col.label}
                        <span className={cn("font-mono", sortKey === col.key ? "text-accent" : "text-faint")}>
                          {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface-2/40">
                  <td className="px-3 py-2.5">
                    <a href={p.url} target="_blank" rel="noreferrer" className="font-bold text-ink hover:text-accent">
                      {p.name}
                    </a>
                    <div className="text-[10px] uppercase tracking-wide text-faint">{KIND_LABELS[p.kind]}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{p.fee === 0 ? "0% (free)" : `${p.fee}%`}</td>
                  <td className="px-3 py-2.5">
                    <Dots value={p.competition} color="bg-danger" />
                  </td>
                  <td className="px-3 py-2.5">
                    <Dots value={p.newcomerFriendly} color="bg-emerald" />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {p.minWithdrawalUsd === 0 ? "—" : `$${p.minWithdrawalUsd}`}
                  </td>
                  <td className="px-3 py-2.5">
                    {p.pkrFriendly ? (
                      <span className="rounded bg-emerald/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald">YES</span>
                    ) : (
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-faint">no</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <div key={p.id} className="pixel-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-ink">{p.name}</h3>
                  <span className="text-[10px] uppercase tracking-wide text-faint">{KIND_LABELS[p.kind]}</span>
                </div>
                {p.pkrFriendly && (
                  <span className="rounded-md bg-emerald/10 px-2 py-0.5 text-[10px] font-bold text-emerald">PK payouts ✓</span>
                )}
              </div>

              <div className="mt-3 space-y-2.5">
                <div>
                  <div className="flex justify-between font-mono text-[11px] text-muted">
                    <span>Fee</span>
                    <span className="font-bold text-ink">{p.fee === 0 ? "0% (free)" : `${p.fee}%`}</span>
                  </div>
                  <div className="mt-0.5 h-2 border border-line bg-surface-2">
                    <div className={cn("h-full", feeColor(p.fee))} style={{ width: `${Math.min(p.fee, 100)}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted">Competition</span>
                  <Dots value={p.competition} color="bg-danger" />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted">Newcomer-friendly</span>
                  <Dots value={p.newcomerFriendly} color="bg-emerald" />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted">Min withdrawal</span>
                  <span className="font-mono font-bold text-ink">{p.minWithdrawalUsd === 0 ? "—" : `$${p.minWithdrawalUsd}`}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {p.payoutMethods.map((m) => (
                  <span key={m} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                    {m}
                  </span>
                ))}
                {p.niches.map((n) => (
                  <span key={n} className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {NICHE_LABELS[n] ?? n}
                  </span>
                ))}
              </div>

              <p className="mt-3 rounded-lg bg-surface-2 px-2.5 py-2 text-[11px] leading-snug text-muted">{p.avgEarningsNote}</p>

              <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                <div>
                  <div className="font-bold uppercase tracking-wide text-emerald">Pros</div>
                  <ul className="mt-1 space-y-1 text-muted">
                    {p.pros.map((x) => (
                      <li key={x} className="flex gap-1">
                        <span className="text-emerald">+</span> {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-bold uppercase tracking-wide text-danger">Cons</div>
                  <ul className="mt-1 space-y-1 text-muted">
                    {p.cons.map((x) => (
                      <li key={x} className="flex gap-1">
                        <span className="text-danger">−</span> {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-2.5 py-2 text-[11px] leading-snug text-ink">
                <span className="font-bold text-amber">Tips:</span> {p.tips.join(" · ")}
              </div>

              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
              >
                Visit {p.name} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      )}

      {view !== "wizard" && filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No platforms match these filters.
        </div>
      )}
    </div>
  );
}
