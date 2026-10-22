"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Clock3, ExternalLink, Filter, Search, ShieldCheck } from "lucide-react";

export type SourceHealthMonitor = {
  id: string;
  label: string;
  entityType: "university" | "scholarship";
  entityId: string;
  sourceUrl: string;
  active: boolean;
  lastCheckedAt: string | null;
  lastError: string | null;
  pendingReviews: number;
};

type FilterKind = "all" | "university" | "scholarship" | "attention";

function status(monitor: SourceHealthMonitor) {
  if (!monitor.active) return { label: "Paused", tone: "bg-surface-2 text-muted" };
  if (monitor.lastError) return { label: "Needs attention", tone: "bg-danger/10 text-danger" };
  if (!monitor.lastCheckedAt) return { label: "Awaiting first check", tone: "bg-saffron/10 text-saffron" };
  return { label: "Checked", tone: "bg-emerald-500/10 text-emerald-700" };
}

function checkedLabel(value: string | null) {
  if (!value) return "Not checked yet";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function SourceHealthPanel({ monitors, pendingCount }: { monitors: SourceHealthMonitor[]; pendingCount: number }) {
  const [filter, setFilter] = React.useState<FilterKind>("all");
  const [query, setQuery] = React.useState("");
  const active = monitors.filter((monitor) => monitor.active);
  const errors = active.filter((monitor) => Boolean(monitor.lastError)).length;
  const awaitingBaseline = active.filter((monitor) => !monitor.lastCheckedAt && !monitor.lastError).length;
  const shown = monitors.filter((monitor) => {
    const matchesQuery = `${monitor.label} ${monitor.entityId}`.toLowerCase().includes(query.trim().toLowerCase());
    if (!matchesQuery) return false;
    if (filter === "attention") return Boolean(monitor.lastError || monitor.pendingReviews > 0);
    return filter === "all" || monitor.entityType === filter;
  });

  return <>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Active official sources" value={active.length} detail={`${monitors.length - active.length} paused`} />
      <Metric label="Waiting for review" value={pendingCount} detail="Detected changes need approval" tone={pendingCount > 0 ? "saffron" : "green"} />
      <Metric label="Source errors" value={errors} detail={errors ? "Open the affected source below" : "No fetch failures recorded"} tone={errors ? "danger" : "green"} />
      <Metric label="Awaiting baseline" value={awaitingBaseline} detail="Will be checked in rotation" />
    </div>

    <div className="mt-7 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><h2 className="text-base font-bold text-ink">Monitored sources</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">Each entry is a versioned, allowlisted official source. A changed page becomes a review candidate; it never changes student-facing data automatically.</p></div>
        <Link href="/admin/source-updates" className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">Review {pendingCount || ""} updates <ShieldCheck className="h-3.5 w-3.5" /></Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" /><span className="sr-only">Search monitored sources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search university or scholarship source" className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-faint" /></label>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0" aria-label="Source filters"><Filter className="mt-2.5 h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />{(["all", "university", "scholarship", "attention"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`h-9 shrink-0 rounded-lg px-3 text-xs font-semibold capitalize transition-colors ${filter === item ? "bg-ink text-white" : "border border-line text-muted hover:text-ink"}`}>{item === "attention" ? "Needs attention" : item}</button>)}</div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-faint">The free-tier-safe monitor checks a bounded batch each Sunday. “Awaiting first check” means a source is safely queued for its initial baseline, not that its official website failed.</p>
      <div className="mt-4 divide-y divide-line border-y border-line">
        {shown.map((monitor) => {
          const current = status(monitor);
          return <article key={monitor.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-ink">{monitor.label}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${current.tone}`}>{current.label}</span>{monitor.pendingReviews > 0 && <span className="rounded-full bg-saffron/10 px-2 py-0.5 text-[10px] font-bold text-saffron">{monitor.pendingReviews} pending review</span>}</div><p className="mt-1 text-xs text-muted">{monitor.entityType} · last checked: {checkedLabel(monitor.lastCheckedAt)}</p>{monitor.lastError && <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-danger"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{monitor.lastError}</p>}</div><a href={monitor.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-saffron hover:underline">Open official page <ExternalLink className="h-3 w-3" /></a></div>
          </article>;
        })}
        {shown.length === 0 && <div className="py-10 text-center"><Clock3 className="mx-auto h-5 w-5 text-faint" /><p className="mt-2 text-sm font-medium text-ink">No matching sources</p><p className="mt-1 text-xs text-muted">Try a different search or filter.</p></div>}
      </div>
    </div>
  </>;
}

function Metric({ label, value, detail, tone = "default" }: { label: string; value: number; detail: string; tone?: "default" | "saffron" | "green" | "danger" }) {
  const valueTone = tone === "danger" ? "text-danger" : tone === "saffron" ? "text-saffron" : tone === "green" ? "text-emerald-700" : "text-ink";
  return <div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs font-medium text-muted">{label}</p><p className={`mt-2 text-3xl font-extrabold tracking-tight ${valueTone}`}>{value}</p><p className="mt-1 text-[11px] leading-relaxed text-faint">{detail}</p></div>;
}
