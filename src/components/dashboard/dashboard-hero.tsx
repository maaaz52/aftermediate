"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { pct } from "@/lib/aggregates";
import { generateAvatarSvg } from "@/lib/avatar";
import { mockAttempts } from "@/lib/practice";

export function DashboardHero() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const q = profile.quiz;
  const fscPct = pct(profile.marks.fscObtained, profile.marks.fscTotal);
  const matPct = pct(profile.marks.matricObtained, profile.marks.matricTotal);
  const entry = profile.marks.entryTestObtained && q.entryTest && q.entryTest !== "none"
    ? `${q.entryTest.toUpperCase()}: ${profile.marks.entryTestObtained}/${profile.marks.entryTestTotal ?? 200}`
    : null;

  const seed = profile.avatarSeed || profile.name || "student";
  const avatarSvg = generateAvatarSvg(profile.avatarStyle, seed);

  // Profile completion
  const checks = [
    !!profile.name,
    !!profile.stream,
    profile.marks.fscObtained > 0,
    profile.marks.matricObtained > 0,
    !!q.entryTest && q.entryTest !== "none",
    !!q.city,
    q.budgetMonthly != null && q.budgetMonthly > 0,
    profile.interests.length > 0,
    (profile.watchlist ?? []).length > 0,
  ];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  // Quick stats
  const practice = mockAttempts(profile.practice);
  const testIds = [...new Set(practice.map((a) => a.testId))];
  const best = practice.length > 0 ? Math.max(...practice.map((a) => a.percent)) : null;
  const tracked = (profile.watchlist ?? []).length;

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl">
          <div
            className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: avatarSvg }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight text-ink">
              Salam{profile.name ? `, ${profile.name}` : ""}
            </h1>
            <Badge variant="saffron">{STREAM_LABEL[stream]}</Badge>
            {fscPct > 0 && <Badge variant="emerald" className="font-mono">{fscPct.toFixed(1)}%</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {[q.city, q.province, q.examYear ? `Class of ${q.examYear}` : null].filter(Boolean).join(" · ") || "Location not set"}
            {q.budgetMonthly ? ` · PKR ${Math.round(q.budgetMonthly / 1000)}k/mo` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fscPct > 0 && <Badge variant="muted" className="font-mono">FSc {fscPct.toFixed(1)}%</Badge>}
            {matPct > 0 && <Badge variant="muted" className="font-mono">Matric {matPct.toFixed(1)}%</Badge>}
            {entry && <Badge variant="muted" className="font-mono">{entry}</Badge>}
            {profile.interests.slice(0, 3).map((i) => (
              <Badge key={i} variant="info">{i}</Badge>
            ))}
          </div>
        </div>
        <Link href="/profile" className="shrink-0 text-xs font-medium text-saffron hover:underline">
          Edit →
        </Link>
      </div>

      {/* Completion + quick stats */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-4">
        <div className="min-w-[140px] flex-1">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Profile</span>
            <span className="font-mono font-semibold text-ink">{completion}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-saffron transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <p className="font-mono text-lg font-bold text-ink">{practice.length}</p>
            <p className="text-[10px] text-muted">Tests</p>
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-ink">{tracked}</p>
            <p className="text-[10px] text-muted">Tracked</p>
          </div>
          {best !== null && (
            <div>
              <p className="font-mono text-lg font-bold text-emerald">{best.toFixed(0)}%</p>
              <p className="text-[10px] text-muted">Best</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
