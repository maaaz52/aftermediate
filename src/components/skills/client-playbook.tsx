"use client";

import * as React from "react";
import { Calculator, Check, ChevronDown, Copy, RotateCcw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import playbookJson from "@/data/skills-client-playbook.json";
import { copyText, pkr, useLocalStorage } from "@/lib/skills";

type SectionId = (typeof playbookJson.sections)[number]["id"];
type CardType = (typeof playbookJson.sections)[number]["cards"][number]["type"];

const TYPE_LABELS: Record<CardType, string> = {
  template: "Template",
  script: "Script",
  rule: "Rule",
  framework: "Framework",
};

const TYPE_STYLES: Record<CardType, string> = {
  template: "border-saffron/30 bg-saffron/10 text-saffron",
  script: "border-violet/30 bg-violet/10 text-violet",
  rule: "border-emerald/30 bg-emerald/10 text-emerald",
  framework: "border-amber/30 bg-amber/10 text-amber",
};

const SERVICES = [
  { id: "logo", label: "Logo design", hours: 6 },
  { id: "website", label: "Website build", hours: 20 },
  { id: "article", label: "Content article", hours: 3 },
  { id: "video", label: "Video edit", hours: 8 },
  { id: "devhour", label: "Dev hourly", hours: 1 },
  { id: "other", label: "Other service", hours: 10 },
];

const COMPLEXITY = [
  { value: "1", label: "Simple ×1" },
  { value: "1.25", label: "Standard ×1.25" },
  { value: "1.5", label: "Complex ×1.5" },
];

interface QuoteState {
  service: string;
  hours: number;
  rate: number;
  complexity: string;
}

export function ClientPlaybook() {
  const sections = playbookJson.sections;
  const [section, setSection] = React.useState<SectionId>("kickoff");
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<CardType | null>(null);
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [quote, setQuote] = useLocalStorage<QuoteState>("aftermediate:skills:quote", {
    service: "logo",
    hours: 6,
    rate: 15,
    complexity: "1.25",
  });

  const active = sections.find((s) => s.id === section)!;

  const visibleCards = React.useMemo(() => {
    let cards = active.cards;
    if (type) cards = cards.filter((c) => c.type === type);
    const needle = q.trim().toLowerCase();
    if (needle) cards = cards.filter((c) => (c.title + c.body + c.tags.join(" ")).toLowerCase().includes(needle));
    return cards;
  }, [active, type, q]);

  const hasFilters = type || q.trim();

  function clearFilters() {
    setType(null);
    setQ("");
  }

  async function copyCard(id: string, body: string) {
    const ok = await copyText(body);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }

  function toggleOpen(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectService(id: string) {
    const svc = SERVICES.find((s) => s.id === id);
    setQuote((prev) => ({ ...prev, service: id, hours: svc?.hours ?? prev.hours }));
  }

  const mult = Number(quote.complexity);
  const totalUsd = Math.round(quote.hours * quote.rate * mult);
  const depositUsd = Math.round(totalUsd * 0.5);
  const milestones = quote.hours > 8 ? "40 / 40 / 20" : "50 / 50";

  return (
    <div className="space-y-5">
      {/* Quote Builder */}
      <div className="pixel-border bg-surface">
        <div className="flex items-center gap-2 border-b-2 border-ink px-4 py-3">
          <Calculator className="h-4 w-4 text-accent" />
          <h3 className="font-display text-xs text-ink">Quote Builder</h3>
          <p className="ml-auto text-[11px] text-faint">Estimates with a 50% deposit — never start without one</p>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-muted">
              Service
              <select
                value={quote.service}
                onChange={(e) => selectService(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border-2 border-ink bg-surface px-2 text-sm text-ink focus:outline-none"
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} (≈ {s.hours}h)
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-muted">
              Hours
              <input
                type="number"
                min={1}
                max={500}
                value={quote.hours}
                onChange={(e) => setQuote((prev) => ({ ...prev, hours: Math.max(1, Number(e.target.value)) }))}
                className="mt-1 h-10 w-full rounded-lg border-2 border-ink bg-surface px-2 font-mono text-sm text-ink focus:outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-muted">
              Rate (USD/hour)
              <input
                type="number"
                min={1}
                max={500}
                value={quote.rate}
                onChange={(e) => setQuote((prev) => ({ ...prev, rate: Math.max(1, Number(e.target.value)) }))}
                className="mt-1 h-10 w-full rounded-lg border-2 border-ink bg-surface px-2 font-mono text-sm text-ink focus:outline-none"
              />
            </label>
            <div className="text-xs font-semibold text-muted">
              Complexity
              <div className="mt-1 inline-flex rounded-lg border-2 border-ink bg-surface p-0.5">
                {COMPLEXITY.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setQuote((prev) => ({ ...prev, complexity: c.value }))}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
                      quote.complexity === c.value ? "bg-accent text-background" : "text-muted hover:text-ink"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid min-w-[16rem] content-center gap-1 rounded-xl border-2 border-ink bg-ink p-4 font-mono text-background">
            <div className="text-[11px] uppercase tracking-widest text-background/70">Your quote</div>
            <div className="text-2xl font-bold">
              ${totalUsd.toLocaleString("en-US")} <span className="text-sm text-background/70">≈ {pkr(totalUsd)}</span>
            </div>
            <div className="mt-1 text-xs text-background/80">
              Deposit 50%: <span className="font-bold text-emerald">${depositUsd.toLocaleString("en-US")}</span>
            </div>
            <div className="text-xs text-background/80">
              Milestones: <span className="font-bold">{milestones}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section rail + content */}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSection(s.id);
                setType(null);
                setQ("");
                setOpen(new Set());
              }}
              className={cn(
                "shrink-0 rounded-lg border-2 px-3 py-2.5 text-left transition-colors",
                section === s.id ? "border-ink bg-ink text-background" : "border-line bg-surface text-muted hover:border-ink"
              )}
            >
              <div className="text-xs font-bold">{s.title.split(":")[0]}</div>
              <div className={cn("font-mono text-[10px]", section === s.id ? "text-background/70" : "text-faint")}>
                {s.cards.length} playbook cards
              </div>
            </button>
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border-2 border-line bg-surface-2/60 p-3">
            <h2 className="text-sm font-bold text-ink">{active.title}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{active.intro}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search this section…"
                className="h-9 w-52 rounded-lg border-2 border-ink bg-surface pl-8 pr-2 text-xs text-ink placeholder:text-faint focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["template", "script", "rule", "framework"] as CardType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(type === t ? null : t)}
                  className={cn(
                    "rounded-full border-2 px-2.5 py-1 text-[11px] font-bold transition-colors",
                    type === t ? "border-ink bg-ink text-background" : "border-line bg-surface text-muted hover:border-ink"
                  )}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-danger hover:underline"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>
            <span className="ml-auto font-mono text-[11px] text-faint">{visibleCards.length} card(s)</span>
          </div>

          {visibleCards.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
              No cards match — try clearing filters.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleCards.map((c) => {
                const expanded = open.has(c.id);
                return (
                  <div key={c.id} className="pixel-border bg-surface">
                    <button
                      onClick={() => toggleOpen(c.id)}
                      className="flex w-full items-center gap-3 p-3.5 text-left"
                    >
                      <div className={cn("min-w-0 flex-1")}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", TYPE_STYLES[c.type])}>
                            {TYPE_LABELS[c.type]}
                          </span>
                          <h3 className="text-sm font-bold text-ink">{c.title}</h3>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <span key={t} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-faint">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-faint transition-transform", expanded && "rotate-180")} />
                    </button>
                    {expanded && (
                      <div className="border-t border-line p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{c.body}</p>
                        <button
                          onClick={() => copyCard(c.id, c.body)}
                          className={cn(
                            "mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-[11px] font-bold transition-colors",
                            copiedId === c.id
                              ? "border-emerald bg-emerald/10 text-emerald"
                              : "border-ink bg-surface text-ink hover:bg-surface-2"
                          )}
                        >
                          {copiedId === c.id ? (
                            <>
                              <Check className="h-3 w-3" /> Copied ✓
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
