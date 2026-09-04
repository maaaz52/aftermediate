"use client";

import React from "react";
import Link from "next/link";
import { useStudent } from "@/lib/store";
import { computeHeatmap, getStreamTest, type ComputedChapter, type ComputedSection } from "@/lib/heatmap-model";
import heatmapData from "@/data/heatmap-mock.json";

const TIER_COLORS: Record<string, string> = {
  danger: "#d63d3d",
  amber: "#d99a2b",
  emerald: "#1c9e62",
};

const TREND_SYMBOL: Record<string, string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

function HeatmapCell({
  chapter,
  section,
  isSelected,
  onClick,
}: {
  chapter: ComputedChapter;
  section: ComputedSection;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = TIER_COLORS[chapter.tier];
  // Map probability (0–1) to opacity (0.35–1)
  const opacity = 0.35 + Math.min(chapter.probability, 1) * 0.65;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${chapter.name} — ${section.name}`}
      className="group relative h-9 w-full rounded-md transition-all hover:scale-110 hover:shadow-md sm:h-10"
      style={{
        backgroundColor: color,
        opacity,
        outline: isSelected ? "2px solid var(--color-ink)" : "none",
        outlineOffset: "2px",
      }}
    >
      {/* Hover tooltip */}
      <span className="pointer-events-none absolute -top-8 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
        {chapter.name}
      </span>
    </button>
  );
}

function DetailPanel({
  chapter,
  section,
  onClose,
}: {
  chapter: ComputedChapter;
  section: ComputedSection;
  onClose: () => void;
}) {
  const studyPct = Math.round(chapter.probability * 100);
  const color = TIER_COLORS[chapter.tier];

  return (
    <div className="mt-4 rounded-xl border border-line bg-surface-2/50 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-ink">{chapter.name}</p>
          <p className="text-xs text-muted">{section.name}</p>
        </div>
        <button onClick={onClose} className="text-sm text-faint hover:text-ink">✕</button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold capitalize" style={{ color }}>{chapter.tier}</span>
        </div>
        <span className="text-xs text-faint">
          {TREND_SYMBOL[chapter.trend]} {chapter.trend === "up" ? "Trending up" : chapter.trend === "down" ? "Trending down" : "Stable"}
        </span>
      </div>

      {/* Appearance bars */}
      <div className="mt-3 space-y-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Last 3 years</span>
            <span className="font-mono">{chapter.appearances3yr}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${Math.min(100, (chapter.appearances3yr / 10) * 100)}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Last 5 years</span>
            <span className="font-mono">{chapter.appearances5yr}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${Math.min(100, (chapter.appearances5yr / 15) * 100)}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Last 10 years</span>
            <span className="font-mono">{chapter.appearances10yr}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${Math.min(100, (chapter.appearances10yr / 25) * 100)}%` }} />
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Suggests <span className="font-bold text-ink">{studyPct}%</span> of study time on this topic
      </p>

      <Link href="/pakistan/self-assessment" className="mt-2 inline-block text-xs font-medium text-saffron hover:underline">
        Practice questions →
      </Link>
    </div>
  );
}

// ── Empty States ──

function EmptyStateNoStream() {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-faint">Entry-test heatmap</div>
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <span className="text-2xl">📋</span>
        <p className="text-sm text-ink">Set your stream to see which subjects appear most in entry tests</p>
        <a href="/onboard" className="text-xs font-medium text-saffron hover:underline">Complete your profile →</a>
      </div>
    </div>
  );
}

function EmptyStateNoTest() {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-faint">Entry-test heatmap</div>
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <span className="text-2xl">📋</span>
        <p className="text-sm text-ink">We don&apos;t have entry-test data for your stream yet</p>
        <Link href="/pakistan/self-assessment" className="text-xs font-medium text-saffron hover:underline">Practice questions →</Link>
      </div>
    </div>
  );
}

// ── Main Widget ──

export function EntryTestHeatmap() {
  const { profile } = useStudent();
  const [selected, setSelected] = React.useState<{ chapter: ComputedChapter; section: ComputedSection } | null>(null);

  const stream = profile?.stream ?? null;
  const defaultTestId = getStreamTest(stream);

  // All available test configs
  const allTests = React.useMemo(() => {
    const entries = Object.entries(heatmapData as Record<string, unknown>);
    return entries
      .map(([id, cfg]) => ({ id, config: cfg as import("@/lib/heatmap-model").HeatmapTestConfig }))
      .filter((t) => t.config);
  }, []);

  const [activeTest, setActiveTest] = React.useState<string>(defaultTestId ?? allTests[0]?.id ?? "mdcat");

  if (allTests.length === 0) {
    return (
      <div className="card-glass rounded-2xl p-5">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-faint">Entry-test heatmap</div>
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <span className="text-2xl">📋</span>
          <p className="text-sm text-ink">Heatmap data not available</p>
        </div>
      </div>
    );
  }

  const active = allTests.find((t) => t.id === activeTest) ?? allTests[0];
  const heatmap = computeHeatmap(active.config);

  function handleCellClick(chapter: ComputedChapter, section: ComputedSection) {
    setSelected((prev) => (prev?.chapter.id === chapter.id ? null : { chapter, section }));
  }

  return (
    <div className="card-glass rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">Entry-test heatmap</span>
        {/* Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#d63d3d]" />
            <span className="text-[10px] text-muted">Rarely</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#d99a2b]" />
            <span className="text-[10px] text-muted">Occasional</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1c9e62]" />
            <span className="text-[10px] text-muted">Frequent</span>
          </div>
        </div>
      </div>

      {/* Test selector tabs */}
      <div className="mt-3 flex gap-1.5">
        {allTests.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setActiveTest(t.id); setSelected(null); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTest === t.id
                ? "bg-saffron/10 text-saffron"
                : "bg-surface-2 text-muted hover:text-ink"
            }`}
          >
            {t.config.shortName}
          </button>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="mt-4 space-y-3">
        {heatmap.sections.map((section) => (
          <div key={section.id}>
            <p className="mb-1.5 text-[11px] font-semibold text-muted">{section.name}</p>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(section.chapters.length, 12)}, minmax(0, 1fr))` }}>
              {section.chapters.map((chapter) => (
                <HeatmapCell
                  key={chapter.id}
                  chapter={chapter}
                  section={section}
                  isSelected={selected?.chapter.id === chapter.id}
                  onClick={() => handleCellClick(chapter, section)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          chapter={selected.chapter}
          section={selected.section}
          onClose={() => setSelected(null)}
        />
      )}

      <p className="mt-4 text-[9.5px] text-faint">
        Based on 10 years of question patterns · Probabilities are estimates, not guarantees
      </p>
    </div>
  );
}
