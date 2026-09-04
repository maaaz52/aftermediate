"use client";

import { Sparkles } from "lucide-react";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { PracticeSummary } from "@/components/dashboard/practice-summary";
import { FineAggregate } from "@/components/dashboard/fine-aggregate";
import { BestFields } from "@/components/dashboard/best-fields";
import { WatchlistSection } from "@/components/watchlist/watchlist-section";
import { DailySprint } from "@/components/dashboard/daily-sprint";
import { WhereYouStand } from "@/components/dashboard/where-you-stand";
import { EntryTestHeatmap } from "@/components/dashboard/entry-test-heatmap";
import { AbroadOverview } from "@/components/dashboard/abroad-overview";
import { useStudent } from "@/lib/store";
import { CoarseAggregate } from "@/components/dashboard/coarse-aggregate";

function ZoneTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 mb-4 text-sm font-extrabold uppercase tracking-wide text-faint first:mt-0">
      {children}
    </h2>
  );
}

export default function DashboardPage() {
  const { profile } = useStudent();
  const hasMarks = profile.marks.fscObtained > 0;

  return (
    <div data-tour="dashboard-welcome" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* ── Zone 1: You ── */}
      <ZoneTitle>You</ZoneTitle>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <DashboardHero />
        <FineAggregate />
      </div>
      {hasMarks && (
        <div className="mt-4">
          <CoarseAggregate />
        </div>
      )}

      {/* ── Zone 2: Today ── */}
      <ZoneTitle>Today</ZoneTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <DailySprint />
        <PracticeSummary />
      </div>
      <div className="mt-4">
        <WatchlistSection />
      </div>

      {/* ── Zone 3: Where you stand ── */}
      <ZoneTitle>Where you stand</ZoneTitle>
      <WhereYouStand />
      <div className="mt-4">
        <EntryTestHeatmap />
      </div>

      {/* ── Zone 4: What's next ── */}
      <ZoneTitle>What&apos;s next</ZoneTitle>
      <BestFields />
      <div className="mt-4">
        <AbroadOverview />
      </div>

      {/* ── Rahbar — quiet row ── */}
      <div className="mt-8 flex items-center justify-between rounded-2xl border border-line bg-surface-2/50 px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Sparkles className="h-4 w-4 text-saffron" />
          <span>Need help? Ask <strong className="text-ink">Rahbar</strong> — your AI counselor.</span>
        </div>
        <button
          type="button"
          onClick={() => document.dispatchEvent(new CustomEvent("open-rahbar"))}
          className="text-xs font-semibold text-saffron hover:underline"
        >
          Open →
        </button>
      </div>
    </div>
  );
}
