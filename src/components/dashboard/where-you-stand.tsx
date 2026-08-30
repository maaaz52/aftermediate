"use client";

import * as React from "react";
import Link from "next/link";
import { BIN_COUNT, BIN_END, BIN_START, benchmarkFor } from "@/lib/benchmark";
import universitiesJson from "@/data/universities.json";
import type { University } from "@/lib/types";
import { useStudent } from "@/lib/store";
import { cn } from "@/lib/utils";

const UNIVERSITIES = universitiesJson as unknown as University[];

// Violet ramp #d9d2ee → #7a5bd4 across the 12 bins.
function violetRamp(i: number): string {
  const t = i / (BIN_COUNT - 1);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${lerp(217, 122)}, ${lerp(210, 91)}, ${lerp(238, 212)})`;
}

// Position on the 40→100 track, clamped to its edges.
function trackLeft(value: number): number {
  return Math.min(100, Math.max(0, ((value - BIN_START) / (BIN_END - BIN_START)) * 100));
}

export function WhereYouStand() {
  const { profile } = useStudent();
  const watchlist = profile.watchlist;
  const hasMarks = profile.marks.fscObtained > 0;

  // Start the cycle on the first target that has the student's aggregate.
  const preferredIdx = watchlist.findIndex((e) => e.myMerit !== null);
  const [idx, setIdx] = React.useState(() => (preferredIdx >= 0 ? preferredIdx : 0));
  // Watchlist edits can leave the stored index out of range — re-pick the
  // preferred target rather than clamping onto a neighboring entry.
  let effectiveIdx = idx;
  if (effectiveIdx >= watchlist.length) {
    effectiveIdx = preferredIdx >= 0 ? preferredIdx : 0;
  }
  const safeIdx = watchlist.length === 0 ? 0 : Math.min(effectiveIdx, watchlist.length - 1);
  const target = watchlist.length > 0 ? watchlist[safeIdx] : undefined;

  const cohort = React.useMemo(
    () => benchmarkFor(profile, UNIVERSITIES, target),
    [profile, target]
  );

  const cycle = () => {
    if (watchlist.length < 2) return;
    setIdx((i) => (i + 1) % watchlist.length);
  };

  // Empty state 1 — no marks at all.
  if (!hasMarks) {
    return (
      <div className="card-glass rounded-2xl p-5">
        <p className="text-base font-bold text-ink">📍 Where you stand</p>
        <p className="mt-2 text-sm text-muted">Add your marks to see where you stand.</p>
        <Link
          href="/profile"
          className="mt-4 inline-block rounded-xl bg-violet px-4 py-2 text-sm font-extrabold text-white shadow-[0_4px_0_#5b3fb8] transition-colors hover:brightness-110"
        >
          Add your marks →
        </Link>
      </div>
    );
  }

  const maxShare = Math.max(...cohort.bins.map((b) => b.share));
  const uv = cohort.userValue;
  let userBinIdx = -1;
  if (uv !== null) {
    userBinIdx = cohort.bins.findIndex((b) => uv >= b.lo && uv <= b.hi);
  }

  let gapCard: React.ReactNode = null;
  if (cohort.mode === "stream") {
    if (uv === null) {
      gapCard = <p className="text-sm font-semibold text-muted">Add your marks to see where you stand.</p>;
    } else {
      const tq = cohort.topQuartile ?? 0;
      gapCard = (
        <>
          <p className="text-sm font-semibold text-ink">
            The top 25% of {cohort.label} score ≈ {Math.round(tq)}%
          </p>
          <p className="mt-1 text-xs font-bold text-saffron">
            {uv >= tq
              ? "You're in the top quarter ✓"
              : `${(tq - uv).toFixed(1)}% to reach the top quarter`}
          </p>
        </>
      );
    }
  } else if (cohort.closingMerit === null) {
    gapCard = (
      <p className="text-sm font-semibold text-muted">
        Closing merit for this program isn&apos;t published yet.
      </p>
    );
  } else if (cohort.gap === null) {
    gapCard = (
      <p className="text-sm font-semibold text-muted">
        Add your aggregate to compare against the closing line.
      </p>
    );
  } else if (cohort.gap >= 0) {
    gapCard = (
      <p className="text-sm font-extrabold text-emerald">
        You&apos;re above the {cohort.closingYear ? `${cohort.closingYear} ` : ""}closing line ✓
      </p>
    );
  } else {
    gapCard = (
      <>
        <p className="text-sm font-semibold text-ink">
          {Math.abs(cohort.gap).toFixed(1)}% below the{" "}
          {cohort.closingYear ? `${cohort.closingYear} ` : ""}closing merit ({cohort.closingMerit}%)
        </p>
        <div className="relative mt-2 h-1.5 rounded-full bg-surface-2">
          <div
            className="absolute -top-[3px] h-3 w-[3px] rounded-full bg-saffron"
            style={{ left: `${trackLeft(cohort.closingMerit)}%` }}
          />
          {uv !== null && (
            <div
              className="absolute -top-[5px] h-4 w-4 -translate-x-1/2 rounded-full border-2 border-emerald bg-surface"
              style={{ left: `${trackLeft(uv)}%` }}
            />
          )}
        </div>
        {cohort.actionHint !== null && (
          <p className="mt-2 text-xs font-bold text-saffron">{cohort.actionHint}</p>
        )}
      </>
    );
  }

  return (
    <div className="card-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Where you stand
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {cohort.mode === "program" ? (
            <button
              type="button"
              onClick={cycle}
              disabled={watchlist.length < 2}
              title={watchlist.length < 2 ? undefined : "Switch target"}
              className="rounded-full border border-violet/30 bg-violet/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet transition-colors hover:bg-violet/20 disabled:cursor-default disabled:opacity-70"
            >
              {cohort.label}
              {watchlist.length > 1 && <span aria-hidden="true"> ▾</span>}
            </button>
          ) : (
            <span className="rounded-full border border-violet/30 bg-violet/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet">
              {cohort.label}
            </span>
          )}
          <span className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber">
            {cohort.mode === "program"
              ? cohort.closingYear
                ? `${cohort.closingYear} applicant pool`
                : "Applicant pool"
              : "FSc + Matric standing"}
          </span>
        </div>
      </div>

      {/* Distribution chart — 12 binned bars */}
      <div className="relative mt-5">
        <div className="flex h-28 items-end gap-[3px]">
          {cohort.bins.map((bin, i) => (
            <div
              key={i}
              title={`${bin.lo}–${bin.hi}%: ${(bin.share * 100).toFixed(1)}% of pool`}
              className={cn(
                "flex-1 rounded-t-[3px]",
                i === userBinIdx && "outline-2 outline-[#5b3fb8] -outline-offset-1"
              )}
              style={{
                height: `${(bin.share / maxShare) * 100}%`,
                backgroundColor: violetRamp(i),
              }}
            />
          ))}
        </div>
        {cohort.closingMerit !== null && (
          <div
            className="pointer-events-none absolute inset-y-0 border-l-2 border-dashed border-saffron"
            style={{ left: `${trackLeft(cohort.closingMerit)}%` }}
          >
            <span className="absolute -top-5 left-0 -translate-x-1/2 rounded bg-saffron px-1 text-[9px] font-bold leading-4 text-white">
              {cohort.closingMerit}%
            </span>
          </div>
        )}
        {uv !== null && (
          <div
            className="pointer-events-none absolute -top-1.5 -translate-x-1/2"
            style={{ left: `${trackLeft(uv)}%` }}
          >
            <div className="h-2 w-2 rounded-full bg-emerald ring-2 ring-surface" />
          </div>
        )}
        <div className="mt-1.5 flex justify-between text-[8.5px] font-medium text-faint">
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>95</span>
          <span>100</span>
        </div>
      </div>

      {/* Rank card */}
      {uv !== null && cohort.percentile !== null ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Your rank</p>
            <p
              className={cn(
                "mt-0.5 text-lg font-extrabold leading-tight",
                cohort.percentile >= 0.5 ? "text-emerald" : "text-saffron"
              )}
            >
              {cohort.percentile >= 0.5
                ? `Top ${Math.max(1, Math.round(100 - cohort.percentile * 100))}% of the applicant pool`
                : `Ahead of ${Math.round(cohort.percentile * 100)}% of the applicant pool`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-extrabold text-ink">{uv.toFixed(1)}%</p>
            <p className="text-[10px] text-faint">
              {cohort.mode === "program" ? "aggregate" : "FSc + Matric standing"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3">
          <p className="text-sm font-semibold text-muted">
            {cohort.mode === "program"
              ? "Add your aggregate to see your rank"
              : "Add your marks to see your rank"}
          </p>
        </div>
      )}

      {/* Gap-to-closing / stream-hook card */}
      <div className="mt-3 rounded-xl border border-surface-2 px-4 py-3">{gapCard}</div>

      <p className="mt-3 text-[9.5px] text-faint">
        Anonymized · aggregated · modeled from 2025 closing merit data · updates when your marks
        change
      </p>
    </div>
  );
}
