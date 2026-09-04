"use client";

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
import { Skeleton } from "@/components/ui/skeleton";

function ZoneTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 mb-4 text-sm font-extrabold uppercase tracking-wide text-faint first:mt-0">
      {children}
    </h2>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-3 h-9 w-64" />
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="mt-4 h-28 rounded-2xl" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <Skeleton className="mt-4 h-40 rounded-2xl" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
      <Skeleton className="mt-4 h-24 rounded-2xl" />
      <Skeleton className="mt-4 h-32 rounded-2xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { profile, hydrated } = useStudent();
  const hasMarks = profile.marks.fscObtained > 0;

  if (!hydrated) return <DashboardSkeleton />;

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
    </div>
  );
}
