"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/count-up";
import { useAuth } from "@/lib/auth";
import {
  attemptsFor,
  getBank,
  type GradedQuestion,
  type PracticeBenchmark,
  type PracticeQuestion,
  type StoredResult,
} from "@/lib/practice";
import { useStudent } from "@/lib/store";
import type { EntryTest } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReviewFilter = "all" | "incorrect" | "skipped" | "correct";

const FILTERS: { value: ReviewFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "incorrect", label: "Incorrect" },
  { value: "skipped", label: "Skipped" },
  { value: "correct", label: "Correct" },
];

type BandChip =
  | { kind: "above"; label: string }
  | { kind: "near"; label: string }
  | { kind: "below"; label: string }
  | null;

/**
 * Highest benchmark reached → "Above {label}". Below every benchmark:
 * within 10 points of the lowest → "Near {label}", further → "Below {label}".
 * No benchmarks at all → null (neutral, no verdict implied).
 */
function bandFor(percent: number, benchmarks: PracticeBenchmark[]): BandChip {
  if (benchmarks.length === 0) return null;
  const sorted = [...benchmarks].sort((a, b) => a.percent - b.percent);
  const reached = [...sorted].reverse().find((b) => percent >= b.percent);
  if (reached) return { kind: "above", label: `Above ${reached.label}` };
  const lowest = sorted[0];
  if (lowest.percent - percent <= 10) return { kind: "near", label: `Near ${lowest.label}` };
  return { kind: "below", label: `Below ${lowest.label}` };
}

/** m:ss under an hour, h:mm:ss over — tiny local formatter. */
function formatTimeUsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * One reviewed question as a collapsible dropdown. The closed header shows the
 * verdict (✓ / ✗ / skipped) plus your answer vs. the correct one; opening it
 * reveals the full question, the option comparison and a to-the-point reason.
 */
function ReviewQuestion({ q, pq }: { q: PracticeQuestion; pq: GradedQuestion }) {
  const [open, setOpen] = React.useState(false);
  const isCorrect = pq.correct;
  const isSkipped = pq.chosen === null;

  return (
    <article className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-xs font-bold",
            isSkipped
              ? "bg-surface-2 text-faint"
              : isCorrect
                ? "bg-emerald text-white"
                : "bg-danger text-white",
          )}
        >
          {isSkipped ? "—" : isCorrect ? "✓" : "✗"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{q.stem}</span>
          <span className="mt-0.5 block text-xs text-faint">
            {isSkipped ? (
              "Skipped"
            ) : (
              <>
                Your answer: {optionLetter(pq.chosen!)} · Correct: {optionLetter(q.correct)}
              </>
            )}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-faint transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3">
          <p className="text-sm font-medium text-ink">{q.stem}</p>
          <div className="mt-2.5 space-y-1.5">
            {q.options.map((opt, i) => {
              const isOptCorrect = i === q.correct;
              const isChosen = pq.chosen === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                    isOptCorrect
                      ? "border-emerald/40 bg-emerald/10 text-ink"
                      : isChosen
                        ? "border-danger/40 bg-danger/10 text-ink"
                        : "border-line bg-surface-2/50 text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold",
                      isOptCorrect ? "text-emerald" : isChosen ? "text-danger" : "text-faint",
                    )}
                  >
                    {optionLetter(i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isOptCorrect ? (
                    <span className="text-xs font-bold text-emerald">✓ correct</span>
                  ) : isChosen ? (
                    <span className="text-xs font-bold text-danger">✗ your pick</span>
                  ) : null}
                </div>
              );
            })}
          </div>
          {q.explanation && (
            <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted">
              <span className="font-semibold text-ink">Why: </span>
              {q.explanation}
            </div>
          )}
          <div className="mt-2 text-xs text-faint">{q.topic}</div>
        </div>
      )}
    </article>
  );
}

export function ExamResults({
  result,
  test,
  onRetake,
}: {
  result: StoredResult;
  test: EntryTest;
  onRetake: () => void;
}) {
  const { profile } = useStudent();
  const { user } = useAuth();
  const bank = getBank(result.testId);
  const attempt = result.attempt;
  const band = bandFor(attempt.percent, bank?.benchmarks ?? []);
  const history = attemptsFor(profile.practice, bank?.testId ?? test.id).slice(0, 10);
  const [filter, setFilter] = React.useState<ReviewFilter>("all");

  const visible = result.perQuestion.filter((pq) => {
    if (filter === "incorrect") return !pq.correct && pq.chosen !== null;
    if (filter === "skipped") return pq.chosen === null;
    if (filter === "correct") return pq.correct;
    return true;
  });

  return (
    <div className="space-y-4">
      {attempt.autoSubmitted && (
        <div
          role="alert"
          className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm font-medium text-amber"
        >
          Time expired — your answers were submitted automatically.
        </div>
      )}

      <section className="card-glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <div className="flex items-baseline gap-2">
              <CountUp
                value={attempt.score}
                className="font-mono text-4xl font-extrabold text-ink sm:text-5xl"
              />
              <span className="font-mono text-lg text-muted">/ {attempt.maxScore}</span>
            </div>
            <p className="mt-1 font-mono text-sm font-semibold text-ink">
              <CountUp value={attempt.percent} decimals={1} suffix="%" />
            </p>
          </div>
          <div className="ml-auto">
            {band ? (
              band.kind === "above" ? (
                <Badge variant="emerald" className="normal-case tracking-normal">
                  {band.label}
                </Badge>
              ) : band.kind === "near" ? (
                <Badge
                  variant="default"
                  className="border-amber/30 bg-amber/10 normal-case tracking-normal text-amber"
                >
                  {band.label}
                </Badge>
              ) : (
                <Badge variant="danger" className="normal-case tracking-normal">
                  {band.label}
                </Badge>
              )
            ) : (
              <Badge>Score recorded</Badge>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line pt-3 text-xs">
          <Badge variant="muted">{attempt.mode === "full" ? "Full" : attempt.mode === "quick" ? "Quick" : "Sprint"}</Badge>
          {attempt.autoSubmitted && <Badge variant="danger">Auto-submitted</Badge>}
          <span className="text-muted">{new Date(attempt.submittedAt).toLocaleDateString()}</span>
          <span className="text-faint">·</span>
          <span className="font-mono text-muted">{formatTimeUsed(attempt.timeUsedSeconds)}</span>
        </div>
      </section>

      <section className="card-glass rounded-2xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Sections</p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10px] uppercase tracking-widest text-faint">
              <th className="py-2 pr-3 font-semibold">Section</th>
              <th className="py-2 pr-3 text-right font-semibold">Correct</th>
              <th className="py-2 pr-3 text-right font-semibold">Wrong</th>
              <th className="py-2 pr-3 text-right font-semibold">Skipped</th>
              <th className="py-2 text-right font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {attempt.sections.map((s) => {
              const total = s.correct + s.wrong + s.skipped;
              const pct = total > 0 ? (s.correct / total) * 100 : 0;
              return (
                <tr key={s.id} className="border-b border-line/60 last:border-0">
                  <td className="py-2 pr-3 font-medium text-ink">{s.name}</td>
                  <td className="py-2 pr-3 text-right font-mono text-emerald">{s.correct}</td>
                  <td className="py-2 pr-3 text-right font-mono text-danger">{s.wrong}</td>
                  <td className="py-2 pr-3 text-right font-mono text-faint">{s.skipped}</td>
                  <td className="py-2 text-right font-mono text-ink">{pct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card-glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Review</p>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.value
                    ? "border-saffron/40 bg-saffron/10 text-saffron"
                    : "border-line text-muted hover:text-ink"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!bank ? (
          <p className="mt-3 text-sm text-muted">
            Question bank unavailable — detailed review is not possible.
          </p>
        ) : visible.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No questions match this filter.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {visible.map((pq) => {
              const q = bank.questions.find((bq) => bq.id === pq.id);
              if (!q) return null;
              return <ReviewQuestion key={pq.id} q={q} pq={pq} />;
            })}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="card-glass rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            Your attempts — {test.short}
          </p>
          <ul className="mt-3 space-y-2">
            {history.map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-xs text-muted">
                  {new Date(a.submittedAt).toLocaleDateString()}
                </span>
                <Badge variant="muted">{a.mode === "full" ? "Full" : a.mode === "quick" ? "Quick" : "Sprint"}</Badge>
                <span className="font-mono font-semibold text-ink">{a.percent.toFixed(1)}%</span>
                <span className="ml-auto font-mono text-xs text-faint">
                  {a.score}/{a.maxScore}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onRetake}>
          Retake
        </Button>
        <Link href="/pakistan/self-assessment" className="text-sm font-medium text-saffron hover:underline">
          Back to catalog
        </Link>
      </div>

      <p className="text-xs text-faint">
        {user
          ? "Saved to your profile."
          : "Saved on this device — sign in to keep your results."}
      </p>
    </div>
  );
}
