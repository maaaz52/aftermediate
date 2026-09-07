"use client";

import * as React from "react";
import Link from "next/link";
import { data } from "@/lib/data";
import demand from "@/data/demand.json";
import { useStudent } from "@/lib/store";
import type { DemandCountry, Stream } from "@/lib/types";
import { cn } from "@/lib/utils";

const CACHE_KEY = "aftermediate:demand-insights";
const TTL = 7 * 24 * 60 * 60 * 1000;

interface Cached {
  stream: string;
  insights: Record<string, string>;
  fetchedAt: number;
}

function getCachedInsights(stream: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as Cached;
      if (cached.stream === stream && Date.now() - cached.fetchedAt < TTL) {
        return cached.insights;
      }
    }
  } catch { /* ignore */ }
  return {};
}

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald";
  if (score >= 70) return "text-amber";
  return "text-muted";
}

export function AbroadOverview() {
  const { profile } = useStudent();
  const stream = (profile.stream ?? "pre-engineering") as Stream;
  const top = data.destinations.slice(0, 3);
  const countries = (demand as Record<Stream, DemandCountry[]>)[stream] ?? [];
  const [insights, setInsights] = React.useState<Record<string, string>>(() => getCachedInsights(stream));

  React.useEffect(() => {
    if (Object.keys(insights).length > 0) {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        try {
          const cached = JSON.parse(raw) as Cached;
          if (cached.stream === stream && Date.now() - cached.fetchedAt < TTL) return;
        } catch { /* stale */ }
      }
    }
    let cancelled = false;
    fetch("/api/demand", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stream, interests: profile.interests, countries: countries.map((c) => c.country) }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { insights: { country: string; insight: string }[] }) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const i of d.insights) map[i.country] = i.insight;
        setInsights(map);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ stream, insights: map, fetchedAt: Date.now() } as Cached)); } catch { /* full */ }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [stream, profile.interests, countries]);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Study abroad</p>
        <Link href="/money" className="text-xs font-medium text-saffron hover:underline">Open calculator →</Link>
      </div>

      {/* Top destinations row */}
      <div className="mt-3 space-y-1">
        {top.map((d) => (
          <div key={d.country} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2/60">
            <span className="text-lg">{d.flag}</span>
            <span className="w-24 truncate text-sm font-semibold text-ink">{d.country}</span>
            <span className="hidden rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted md:inline">
              {d.approxStudents} students
            </span>
            <span className="ml-auto rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
              {d.postStudyWork}
            </span>
          </div>
        ))}
      </div>

      {/* Demand cards */}
      {countries.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {countries.map((c) => (
            <div key={c.country} className="rounded-xl border border-line bg-surface-2/40 p-2.5 text-center">
              <div className="text-xl">{c.flag}</div>
              <p className="mt-1 text-xs font-semibold text-ink">{c.country}</p>
              <p className={cn("font-mono text-[10px] font-bold", scoreTone(c.score))}>{c.score}</p>
              <p className="mt-1 text-[10px] leading-snug text-muted line-clamp-2">
                {insights[c.country] ?? c.reason}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
