"use client";

import * as React from "react";
import demand from "@/data/demand.json";
import { useStudent } from "@/lib/store";
import type { DemandCountry, Stream } from "@/lib/types";
import { cn } from "@/lib/utils";

const CACHE_KEY = "aftermediate:demand-insights";
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

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
  } catch {
    // corrupt cache — ignore
  }
  return {};
}

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald";
  if (score >= 70) return "text-amber";
  return "text-muted";
}

export function ValuableCountries() {
  const { profile } = useStudent();
  const stream = (profile.stream ?? "pre-engineering") as Stream;
  const countries = (demand as Record<Stream, DemandCountry[]>)[stream] ?? [];
  const [insights, setInsights] = React.useState<Record<string, string>>(() => getCachedInsights(stream));

  React.useEffect(() => {
    // If cache from lazy init is still valid for current stream, skip fetch
    if (Object.keys(insights).length > 0) {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        try {
          const cached = JSON.parse(raw) as Cached;
          if (cached.stream === stream && Date.now() - cached.fetchedAt < TTL) return;
        } catch {
          /* stale cache — refetch below */
        }
      }
    }

    let cancelled = false;
    fetch("/api/demand", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stream,
        interests: profile.interests,
        countries: countries.map((c) => c.country),
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("demand insight failed"))))
      .then((data: { insights: { country: string; insight: string }[] }) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const i of data.insights) map[i.country] = i.insight;
        setInsights(map);
        try {
          const cached: Cached = { stream, insights: map, fetchedAt: Date.now() };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        } catch {
          // storage full — insights still work for this session
        }
      })
      .catch(() => {
        // keep static reasons — no user-visible error
      });

    return () => {
      cancelled = true;
    };
  }, [stream, profile.interests, countries]);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Where you&apos;re most valuable</p>
        <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold text-amber">✦ AI insight</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {countries.map((c) => (
          <div
            key={c.country}
            className="rounded-xl border border-line bg-surface-2/40 p-3 text-center transition-colors hover:border-saffron/40"
          >
            <div className="text-2xl">{c.flag}</div>
            <p className="mt-1 text-sm font-semibold text-ink">{c.country}</p>
            <p className={cn("font-mono text-xs font-bold", scoreTone(c.score))}>● {c.score} demand</p>
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              {insights[c.country] ?? c.reason}
            </p>
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-faint">{c.focus}</p>
          </div>
        ))}
      </div>
    </div>
  );
}