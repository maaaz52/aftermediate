"use client";

import { Badge } from "@/components/ui/badge";
import { ProfileSummary } from "@/components/dashboard/profile-summary";
import { CoarseAggregate } from "@/components/dashboard/coarse-aggregate";
import { FineAggregate } from "@/components/dashboard/fine-aggregate";
import { ValuableCountries } from "@/components/dashboard/valuable-countries";
import { StudyAbroadSummary } from "@/components/dashboard/study-abroad-summary";
import { BestFields } from "@/components/dashboard/best-fields";
import { RahbarBanner } from "@/components/dashboard/rahbar-banner";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { pct } from "@/lib/aggregates";

export default function DashboardPage() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const fscPct = pct(profile.marks.fscObtained, profile.marks.fscTotal);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="animate-reveal">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="saffron">{STREAM_LABEL[stream]}</Badge>
          {fscPct > 0 && <Badge variant="emerald" className="font-mono">{fscPct.toFixed(1)}%</Badge>}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Salam{profile.name ? `, ${profile.name}` : ""} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s where you stand today.</p>
      </div>

      <div className="mt-6 animate-reveal" style={{ animationDelay: "60ms" }}>
        <ProfileSummary />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {profile.marks.fscObtained > 0 && (
          <div className="animate-reveal" style={{ animationDelay: "120ms" }}>
            <CoarseAggregate />
          </div>
        )}
        <div className="animate-reveal" style={{ animationDelay: "180ms" }}>
          <FineAggregate />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="animate-reveal" style={{ animationDelay: "240ms" }}>
          <ValuableCountries />
        </div>
        <div className="animate-reveal" style={{ animationDelay: "300ms" }}>
          <StudyAbroadSummary />
        </div>
      </div>

      <div className="mt-4 animate-reveal" style={{ animationDelay: "360ms" }}>
        <BestFields />
      </div>

      <div className="mt-4 animate-reveal" style={{ animationDelay: "420ms" }}>
        <RahbarBanner />
      </div>
    </div>
  );
}
