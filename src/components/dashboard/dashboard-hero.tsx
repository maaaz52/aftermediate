"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { pct } from "@/lib/aggregates";
import { generateAvatarSvg } from "@/lib/avatar";

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
    </div>
  );
}
