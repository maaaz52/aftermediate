"use client";

import React from "react";
import Link from "next/link";
import { useStudent } from "@/lib/store";
import { computeHeatmap, getStreamTest, type ComputedChapter, type ComputedSection } from "@/lib/heatmap-model";
import heatmapData from "@/data/heatmap-mock.json";

type TierColor = "danger" | "amber" | "emerald";

const TIER_STYLES: Record<TierColor, { dot: string; label: string }> = {
  danger: { dot: "bg-[#d63d3d]", label: "Rarely" },
  amber: { dot: "bg-[#d99a2b]", label: "Occasional" },
  emerald: { dot: "bg-[#1c9e62]", label: "Frequent" },
};

const TREND_SYMBOL: Record<string, string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

// ── Empty States ──

function EmptyStateNoStream() {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-faint">ENTRY-TEST HEATMAP</div>
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <span className="text-2xl">📋</span>
        <p className="text-[13px] text-ink">Set your stream to see which subjects appear most in entry tests</p>
        <a href="/onboard" className="text-[13px] text-saffron underline">Complete your profile →</a>
      </div>
      <p className="mt-6 text-[10px] text-faint">Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees</p>
    </div>
  );
}

function EmptyStateNoTest() {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-faint">ENTRY-TEST HEATMAP</div>
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <span className="text-2xl">📋</span>
        <p className="text-[13px] text-ink">We don&apos;t have entry-test data for your stream yet</p>
        <p className="text-[11px] text-faint">In the meantime, explore practice questions to stay ahead.</p>
        <Link href="/pakistan/self-assessment" className="text-[13px] text-saffron underline">Practice questions →</Link>
      </div>
      <p className="mt-6 text-[10px] text-faint">Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees</p>
    </div>
  );
}

// ── Detail Panel ──

function DetailPanel({ chapter, section, onClose }: {
  chapter: ComputedChapter;
  section: ComputedSection;
  onClose: () => void;
}) {
  const tierInfo = TIER_STYLES[chapter.tier];
  const studyPct = Math.round(chapter.probability * 100);

  return (
    <div className="mt-3 rounded-xl border border-surface-2 bg-surface p-4 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold text-ink">{chapter.name}</p>
          <p className="text-[11px] text-faint">{section.name}</p>
        </div>
        <button onClick={onClose} className="text-[13px] text-faint hover:text-ink">✕</button>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[13px] font-mono text-ink">📊 {chapter.appearances3yr} appearances in the last 3 years</p>
        <p className="text-[13px] font-mono text-ink">📊 {chapter.appearances5yr} in the last 5 years</p>
        <p className="text-[13px] font-mono text-ink">📊 {chapter.appearances10yr} in the last 10 years</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${tierInfo.dot}`} />
        <span className="text-[13px] text-ink">
          {chapter.tier === "danger" ? "🔴" : chapter.tier === "amber" ? "🟠" : "🟢"}{" "}
          {(chapter.probability * 100).toFixed(1)}% probability
        </span>
        <span className="text-[13px] text-faint">
          {TREND_SYMBOL[chapter.trend]} {chapter.trend === "up" ? "Trending up" : chapter.trend === "down" ? "Trending down" : "Stable"}
        </span>
      </div>

      <p className="mt-3 text-[13px] text-ink">
        ⏱ Suggested: {studyPct}% of study time
      </p>

      <Link href="/pakistan/self-assessment" className="mt-2 inline-block text-[13px] text-saffron underline hover:text-saffron/80">
        📝 Practice questions →
      </Link>
    </div>
  );
}

// ── Main Widget ──

export function EntryTestHeatmap() {
  const { profile } = useStudent();
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = React.useState<ComputedChapter | null>(null);
  const [selectedSection, setSelectedSection] = React.useState<ComputedSection | null>(null);

  const stream = profile?.stream ?? null;
  const testId = getStreamTest(stream);

  // Empty state 1: no stream
  if (stream === null) {
    return <EmptyStateNoStream />;
  }

  // Empty state 2: no test for this stream
  if (testId === null) {
    return <EmptyStateNoTest />;
  }

  // Load data — cast through unknown since JSON imports are untyped
  const config = (heatmapData as Record<string, unknown>)[testId] as import("@/lib/heatmap-model").HeatmapTestConfig | undefined;

  // Empty state 3: no data
  if (!config) {
    return (
      <div className="card-glass rounded-2xl p-5">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-faint">ENTRY-TEST HEATMAP</div>
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <span className="text-2xl">📋</span>
          <p className="text-[13px] text-ink">Heatmap data not available</p>
          <p className="text-[11px] text-faint">Check back soon — we&apos;re updating our question patterns.</p>
        </div>
        <p className="mt-6 text-[10px] text-faint">Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees</p>
      </div>
    );
  }

  const heatmap = computeHeatmap(config);
  const testLabel = config.name;

  function toggleSection(id: string) {
    setExpandedSection((prev) => (prev === id ? null : id));
    setSelectedChapter(null);
    setSelectedSection(null);
  }

  function handleChapterClick(chapter: ComputedChapter, section: ComputedSection) {
    if (selectedChapter?.id === chapter.id) {
      setSelectedChapter(null);
      setSelectedSection(null);
    } else {
      setSelectedChapter(chapter);
      setSelectedSection(section);
    }
  }

  return (
    <div className="card-glass rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          ENTRY-TEST HEATMAP
        </span>
        <span className="text-[11px] font-semibold text-ink">
          {testLabel}
        </span>
      </div>

      {/* Chapter tree */}
      <div className="mt-3 space-y-1">
        {heatmap.sections.map((section) => {
          const isOpen = expandedSection === section.id;
          return (
            <div key={section.id}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] text-faint transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
                  <span className="text-[13px] font-semibold text-ink">{section.name}</span>
                </div>
                <span className="text-[11px] text-faint">◎ {section.totalQuestions} Qs</span>
              </button>

              {/* Chapter rows (collapsible) */}
              {isOpen && (
                <div className="ml-3 border-l border-surface-2 pl-3">
                  {section.chapters.map((chapter, index) => {
                    const tierInfo = TIER_STYLES[chapter.tier as TierColor];
                    const isSelected = selectedChapter?.id === chapter.id;
                    return (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter, section)}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className={`animate-reveal flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left hover:bg-surface transition-colors ${
                          isSelected ? "bg-surface" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${tierInfo.dot}`} />
                          <span className="text-[13px] text-ink">{chapter.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-faint">{tierInfo.label}</span>
                          <span className={`text-[11px] ${
                            chapter.trend === "up" ? "text-emerald" : chapter.trend === "down" ? "text-danger" : "text-faint"
                          }`}>
                            {TREND_SYMBOL[chapter.trend]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedChapter && selectedSection && (
        <DetailPanel
          chapter={selectedChapter}
          section={selectedSection}
          onClose={() => {
            setSelectedChapter(null);
            setSelectedSection(null);
          }}
        />
      )}

      {/* Footer */}
      <p className="mt-6 text-[10px] text-faint">
        Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees
      </p>
    </div>
  );
}
