"use client";

import * as React from "react";
import Link from "next/link";
import { GitBranch, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceTag } from "@/components/stat";
import { useStudent } from "@/lib/store";
import { data, getMajorsByStream, getUniversitiesForStream } from "@/lib/data";
import { nustAggregate, fastAggregate, mdcatAggregate, mdcatPercentile, overallStanding } from "@/lib/aggregates";
import type { Stream } from "@/lib/types";
import type { Marks } from "@/lib/types";
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";
import { addEntry } from "@/lib/watchlist";
import { cn } from "@/lib/utils";

function Gauge({ value, label }: { value: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = 56;
  const c = 2 * Math.PI * r;
  const filled = (clamped / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
          <circle
            cx="70" cy="70" r={r} fill="none" stroke="var(--color-saffron)" strokeWidth="12"
            strokeLinecap="round" strokeDasharray={`${filled} ${c - filled}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-ink">{clamped.toFixed(1)}%</span>
        </div>
      </div>
      <p className="mt-1 text-xs uppercase tracking-widest text-muted">{label}</p>
    </div>
  );
}

export default function MeritPage() {
  const { profile, update } = useStudent();
  const stream: Stream = profile.stream ?? "pre-engineering";
  const marks = profile.marks;

  const isMed = stream === "pre-medical";
  const results = isMed
    ? [mdcatAggregate(marks)]
    : [nustAggregate(marks), fastAggregate(marks)];

  const percentile = isMed ? mdcatPercentile(results[0].value) : null;
  const standing = isMed ? null : overallStanding(marks);
  const majors = getMajorsByStream(stream).filter((m) => m.id !== "medicine");
  const unis = getUniversitiesForStream(stream);
  const UNIS = universities as unknown as University[];
  const watchlist = profile.watchlist ?? [];
  const tracked = new Set(watchlist.map((e) => `${e.universityId}:${e.programName}`));

  const hasMarks =
    marks.matricObtained > 0 || marks.fscObtained > 0 || (marks.entryTestObtained ?? 0) > 0;

  // Input validation — derived per field so edits stay live but flagged.
  const marksOk = (o: number, t: number) => t > 0 && o >= 0 && o <= t;
  const matricOk = marksOk(marks.matricObtained, marks.matricTotal);
  const fscOk = marksOk(marks.fscObtained, marks.fscTotal);
  const entryOk = (marks.entryTestObtained ?? 0) >= 0;
  const anyInvalid = !matricOk || !fscOk || !entryOk;

  const [syncing, setSyncing] = React.useState<string | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  function setMarks(patch: Partial<Marks>) {
    update({ marks: { ...marks, ...patch } });
  }

  async function trackProgram(u: University, p: { name: string }) {
    const key = `${u.id}:${p.name}`;
    if (tracked.has(key) || syncing) return;
    setSyncing(key);
    setSyncError(null);
    const result = addEntry(watchlist, {
      universityId: u.id,
      programName: p.name,
      myMerit: results[0]?.value ?? null,
      myStream: stream,
    }, UNIS);
    const added = result.find(
      (e) => e.universityId === u.id && e.programName === p.name
    );
    if (added) {
      const updated = [...watchlist, added];
      update({ watchlist: updated });
      try {
        await fetch("/api/watchlist/sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ watchlist: updated }),
        });
      } catch {
        setSyncError("Couldn't sync — check your connection and try again.");
      }
    }
    setSyncing(null);
  }

  return (
    <div data-tour="merit" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="saffron">Merit</Badge>
        <span className="font-mono text-xs text-faint">the trust core</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">Know your number.</h1>
      <p className="mt-2 max-w-xl text-muted">
        The exact aggregate formulas — not the &quot;guesses&quot; from coaching academies. Adjust any number
        and watch your merit move.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink sm:text-xl">Your numbers</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <Label>Matric obtained</Label>
              <Input type="number" className={cn("mt-1 font-mono", !matricOk && "border-danger focus:ring-danger/50")}
                value={marks.matricObtained || ""}
                onChange={(e) => setMarks({ matricObtained: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Matric total</Label>
              <Input type="number" className={cn("mt-1 font-mono", !matricOk && "border-danger focus:ring-danger/50")}
                value={marks.matricTotal || ""}
                onChange={(e) => setMarks({ matricTotal: Number(e.target.value) })} />
            </div>
            <div>
              <Label>FSc obtained</Label>
              <Input type="number" className={cn("mt-1 font-mono", !fscOk && "border-danger focus:ring-danger/50")}
                value={marks.fscObtained || ""}
                onChange={(e) => setMarks({ fscObtained: Number(e.target.value) })} />
            </div>
            <div>
              <Label>FSc total</Label>
              <Input type="number" className={cn("mt-1 font-mono", !fscOk && "border-danger focus:ring-danger/50")}
                value={marks.fscTotal || ""}
                onChange={(e) => setMarks({ fscTotal: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <Label>Entry test obtained ({isMed ? "MDCAT /200" : "NET-NU /200"})</Label>
              <Input type="number" className={cn("mt-1 font-mono", !entryOk && "border-danger focus:ring-danger/50")}
                value={marks.entryTestObtained ?? ""}
                onChange={(e) => setMarks({ entryTestObtained: Number(e.target.value), entryTestTotal: 200 })} />
              {!matricOk && <p className="mt-1 text-[11px] font-medium text-danger">Matric obtained can&apos;t exceed total or go negative.</p>}
              {!fscOk && <p className="mt-1 text-[11px] font-medium text-danger">FSc obtained can&apos;t exceed total or go negative.</p>}
              {!entryOk && <p className="mt-1 text-[11px] font-medium text-danger">Entry test score can&apos;t be negative.</p>}
            </div>
          </div>
          <p className="mt-4 text-xs text-faint">Formulas: NUST 75/15/10 · FAST computing 50/40/10 · PMDC 50/40/10.</p>
        </Card>

        <div className="space-y-4">
          {!hasMarks ? (
            <Card className="flex flex-col items-center p-8 text-center">
              <p className="text-3xl">🎯</p>
              <h3 className="mt-3 text-lg font-bold text-ink">Add your marks to see your number.</h3>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Enter your Matric, FSc and entry-test scores on the left — your NUST / FAST / MDCAT
                aggregate updates instantly.
              </p>
              <Link href="/profile" className="mt-4 rounded-lg bg-saffron px-5 py-2.5 text-sm font-bold text-background hover:bg-saffron-soft">
                Enter from profile →
              </Link>
            </Card>
          ) : anyInvalid ? (
            <Card className="flex items-center gap-4 p-6">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-ink">Check your marks.</h3>
                <p className="mt-1 text-sm text-muted">
                  Some numbers are out of range. Fix the highlighted fields above to see your aggregate.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((r) => (
                  <Card key={r.name} className="p-6">
                    <p className="text-xs uppercase tracking-widest text-muted">{r.name}</p>
                    <p className="mt-2 font-mono text-5xl font-bold text-saffron">{r.value.toFixed(2)}%</p>
                    <div className="mt-4 space-y-1.5">
                      {r.breakdown.map((b) => (
                        <div key={b.component} className="flex items-center justify-between text-xs">
                          <span className="text-muted">{b.component} ({b.weight}%)</span>
                          <span className="font-mono text-ink">{b.contribution.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 border-t border-line/60 pt-2 text-[11px] text-faint">{r.note}</p>
                  </Card>
                ))}
              </div>

              {percentile && (
                <Card className="flex items-center gap-6 p-6">
                  <Gauge value={percentile.percentile} label="your percentile" />
                  <div>
                    <h3 className="text-lg font-bold text-ink sm:text-xl">{percentile.band}</h3>
                    <p className="mt-1 text-sm text-muted">
                      You&apos;re ahead of ~{percentile.percentile}% of the {data.mdcat.candidates.value} MDCAT
                      candidates. But only {data.mdcat.mbbsSeats.value} MBBS seats exist.
                    </p>
                    <div className="mt-3"><SourceTag stat={data.mdcat.conversion} /></div>
                  </div>
                </Card>
              )}

              {standing && (
                <Card className="flex items-center gap-6 p-6">
                  <Gauge value={standing.percentile} label="your standing" />
                  <div>
                    <h3 className="text-lg font-bold text-ink sm:text-xl">{standing.label}</h3>
                    <p className="mt-1 text-sm text-muted">
                      FSc and Matric together put you in the {standing.label} nationally (entry test excluded —
                      that&apos;s still ahead of you).
                    </p>
                  </div>
                </Card>
              )}

              {syncError && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                  {syncError}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {unis.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Where does that land?</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-faint">
                  <th className="py-3 pr-4">University</th>
                  <th className="py-3 pr-4">Program</th>
                  <th className="py-3 pr-4">Closing merit</th>
                  <th className="py-3">Your chance</th>
                  <th className="py-3 pl-4"></th>
                </tr>
              </thead>
              <tbody>
                {unis.flatMap((u) => u.programs.map((p) => ({ u, p }))).slice(0, 10).map(({ u, p }, i) => {
                  const your = results[0]?.value ?? 0;
                  const gap = p.closingMerit ? your - p.closingMerit : null;
                  const key = `${u.id}:${p.name}`;
                  return (
                    <tr key={`${u.id}-${i}`} className="border-b border-line/60">
                      <td className="py-3 pr-4 font-medium text-ink">{u.short}</td>
                      <td className="py-3 pr-4 text-muted">{p.name}</td>
                      <td className="py-3 pr-4 font-mono text-ink">{p.closingMerit ? `${p.closingMerit}%` : "—"}</td>
                      <td className="py-3">
                        {gap === null ? (
                          <span className="text-faint">—</span>
                        ) : gap >= 0 ? (
                          <Badge variant="emerald">safe (+{gap.toFixed(1)} pts)</Badge>
                        ) : gap >= -5 ? (
                          <Badge variant="saffron">tight ({gap.toFixed(1)} pts)</Badge>
                        ) : (
                          <Badge variant="danger">reach ({gap.toFixed(1)} pts)</Badge>
                        )}
                      </td>
                      <td className="py-3 pl-4">
                        {tracked.has(key) ? (
                          <span className="text-[11px] font-medium text-emerald">Tracking {'\u2713'}</span>
                        ) : (
                          <button
                            onClick={() => trackProgram(u, p)}
                            disabled={syncing === key}
                            className="rounded-lg border border-violet/30 px-2 py-1 text-[11px] font-medium text-violet hover:bg-violet/10 disabled:opacity-50 transition-colors"
                          >
                            {syncing === key ? "Syncing…" : "Track"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-12">
        <div className="mb-5 flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-emerald" />
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">The Plan B map</h2>
        </div>
        <p className="mb-6 max-w-2xl text-sm text-muted">
          {isMed
            ? "If MBBS slips, these are your high-demand alternatives — not consolation prizes."
            : "Beyond NUST and FAST, here's where your stream can actually take you."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {majors.map((m) => (
            <a key={m.id} href={`/career/${m.id}`} className="card-glass group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-emerald/40">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{m.emoji}</span>
                <ArrowRight className="h-4 w-4 text-faint group-hover:text-emerald" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-ink sm:text-xl">{m.name}</h3>
              <p className="mt-1 text-sm text-muted">{m.tagline}</p>
              <p className="mt-3 font-mono text-xs text-emerald">
                {m.salaryRange.low / 1000}k – {m.salaryRange.high / 1000}k {m.salaryRange.currency}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
