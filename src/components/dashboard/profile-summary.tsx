"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { pct } from "@/lib/aggregates";

export function ProfileSummary() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const q = profile.quiz;
  const fscPct = pct(profile.marks.fscObtained, profile.marks.fscTotal);
  const matPct = pct(profile.marks.matricObtained, profile.marks.matricTotal);
  const initial = (profile.name || "S").trim().charAt(0).toUpperCase();
  const entry = profile.marks.entryTestObtained && q.entryTest && q.entryTest !== "none"
    ? `${q.entryTest.toUpperCase()}: ${profile.marks.entryTestObtained}/${profile.marks.entryTestTotal ?? 200}`
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
      <div className="card-glass flex items-center gap-4 rounded-2xl p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-linear-to-br from-saffron to-saffron-soft text-lg font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{profile.name || "Student"}</p>
          <p className="truncate text-xs text-muted">
            {[q.city, q.province, q.examYear ? `Class of ${q.examYear}` : null].filter(Boolean).join(" · ") || "Location not set"}
          </p>
          <p className="truncate text-xs text-muted">
            {q.budgetMonthly ? `Budget PKR ${Math.round(q.budgetMonthly / 1000)}k/mo` : "Budget not set"}
            {q.canRelocate
              ? ` · ${q.canRelocate === "yes" ? "can relocate" : q.canRelocate === "in-province" ? "in-province only" : "staying home"}`
              : ""}
          </p>
        </div>
      </div>

      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Profile summary</p>
          <Link href="/profile" className="text-xs font-medium text-saffron hover:underline">
            Edit profile →
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="saffron">{STREAM_LABEL[stream]}</Badge>
          {fscPct > 0 && <Badge variant="muted" className="font-mono">FSc {fscPct.toFixed(1)}%</Badge>}
          {matPct > 0 && <Badge variant="muted" className="font-mono">Matric {matPct.toFixed(1)}%</Badge>}
          {entry && <Badge variant="emerald" className="font-mono">{entry}</Badge>}
          {profile.interests.slice(0, 3).map((i) => (
            <Badge key={i} variant="info">{i}</Badge>
          ))}
          {q.needsScholarship === "must" && <Badge variant="danger">Needs scholarship</Badge>}
          {q.needsScholarship === "helpful" && <Badge variant="emerald">Scholarship helps</Badge>}
        </div>
      </div>
    </div>
  );
}