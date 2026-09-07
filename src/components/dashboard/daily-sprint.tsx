"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  buildPool,
  canonicalSection,
  computeStreak,
  dailyPick,
  dayNumber,
  gradeSprint,
  isSprintDoneToday,
  recipeFor,
  SPRINT_SIZE,
  streamTests,
} from "@/lib/sprint";
import { banks, pushAttempt, sprintAttempts } from "@/lib/practice";
import type { PracticeQuestion } from "@/lib/practice";
import type { PracticeAttempt } from "@/lib/types";
import { useStudent } from "@/lib/store";
import { cn } from "@/lib/utils";

type Phase = "idle" | "active" | "summary";

export function DailySprint() {
  const { profile, update } = useStudent();
  const stream = profile.stream;

  // Settled clock — Date.now() is impure during render, so keep it in state
  // and refresh on a timer (same pattern as watchlist-card).
  const [now, setNow] = React.useState(0);
  React.useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, []);

  const recipe = React.useMemo(() => recipeFor(stream), [stream]);
  const testIds = React.useMemo(() => streamTests(stream), [stream]);
  const pool = React.useMemo(() => buildPool(banks, testIds, recipe), [testIds, recipe]);
  const todayQuestions = React.useMemo(
    () => (now === 0 ? [] : dailyPick(pool, recipe, dayNumber(new Date(now)))),
    [pool, recipe, now]
  );

  const sprintHistory = React.useMemo(() => sprintAttempts(profile.practice), [profile.practice]);
  const streak = now === 0 ? 0 : computeStreak(sprintHistory, new Date(now));
  const doneToday = now !== 0 && isSprintDoneToday(sprintHistory, new Date(now));

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [questions, setQuestions] = React.useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [current, setCurrent] = React.useState(0);
  const [startedAt, setStartedAt] = React.useState(0);
  const [wasDoneBefore, setWasDoneBefore] = React.useState(false);
  const [streakBefore, setStreakBefore] = React.useState(0);
  const [lastAttempt, setLastAttempt] = React.useState<PracticeAttempt | null>(null);

  const currentQ = questions[current];

  const startSprint = () => {
    if (todayQuestions.length < SPRINT_SIZE) return;
    setQuestions(todayQuestions);
    setAnswers({});
    setCurrent(0);
    setStartedAt(Date.now());
    setLastAttempt(null);
    setPhase("active");
  };

  const choose = (optionIndex: number) => {
    if (!currentQ || answers[currentQ.id] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIndex }));
  };

  const next = () => {
    if (phase !== "active") return;
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      return;
    }
    // Event handlers may use Date.now() — only render is purity-checked.
    const attempt = gradeSprint(questions, answers, (Date.now() - startedAt) / 1000);
    setWasDoneBefore(doneToday);
    setStreakBefore(streak);
    setLastAttempt(attempt);
    update({ practice: pushAttempt(profile.practice, attempt) });
    setPhase("summary");
  };

  const cancel = () => setPhase("idle");

  // --- idle ----------------------------------------------------------------
  if (phase === "idle") {
    // Recipes are expanded (one slot per question) — group by label for display.
    const recipeSummary = recipe.reduce<Record<string, number>>((acc, slot) => {
      acc[slot.label] = (acc[slot.label] ?? 0) + slot.count;
      return acc;
    }, {});
    const canStart = now !== 0 && todayQuestions.length >= SPRINT_SIZE;
    return (
      <div
        className={cn(
          "card-glass relative flex flex-col rounded-2xl p-5",
          !doneToday && "ring-1 ring-saffron/40"
        )}
        data-tour="daily-sprint"
      >
        {!doneToday && (
          <span className="absolute -top-2.5 left-4 rounded-full bg-saffron px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-background">
            Do this first
          </span>
        )}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div>
            <p className="text-base font-bold text-ink">⚡ Daily Sprint</p>
            <p className="text-xs text-muted">5 questions · 2 minutes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🔥</span>
            <span className="font-mono text-lg font-extrabold text-ink">{streak}</span>
            <Badge variant={doneToday ? "emerald" : "saffron"}>
              {doneToday ? "Done today ✓" : "Not done yet"}
            </Badge>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted">
          Today: {Object.entries(recipeSummary).map(([label, count]) => `${count} × ${label}`).join(" · ")}
        </p>

        {stream === null && (
          <Link
            href="/onboard"
            className="mt-2 inline-block text-xs font-medium text-saffron hover:underline"
          >
            Pick your stream to personalize your sprint →
          </Link>
        )}

        <Button
          type="button"
          onClick={startSprint}
          disabled={!canStart}
          className="mt-auto w-full"
        >
          {canStart ? "Start today's sprint →" : "Sprints coming soon for your stream"}
        </Button>
      </div>
    );
  }

  // --- summary -------------------------------------------------------------
  if (phase === "summary" && lastAttempt) {
    const verdict =
      lastAttempt.percent === 100
        ? { label: "Perfect!", variant: "emerald" as const }
        : lastAttempt.percent >= 60
          ? { label: "Solid", variant: "saffron" as const }
          : { label: "Keep at it", variant: "danger" as const };
    const after = computeStreak(sprintHistory, new Date(now));
    return (
      <div className="card-glass rounded-2xl p-5">
        <p className="text-base font-bold text-ink">Sprint complete!</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="font-mono text-3xl font-extrabold text-ink">
            {lastAttempt.score} / {lastAttempt.maxScore}
          </span>
          <Badge variant={verdict.variant}>{verdict.label}</Badge>
        </div>

        {lastAttempt.sections.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {lastAttempt.sections.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted"
              >
                {s.name} {s.correct}/{s.correct + s.wrong + s.skipped} ✓
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-sm font-semibold text-ink">
          {wasDoneBefore
            ? `🔥 Streak stays at ${after} (already done today)`
            : `🔥 Streak: ${streakBefore} → ${after}!`}
        </p>

        <button
          type="button"
          onClick={cancel}
          className={cn(buttonVariants({ variant: "secondary", className: "mt-4 w-full" }))}
        >
          Done — back to dashboard
        </button>
      </div>
    );
  }

  // --- active --------------------------------------------------------------
  if (!currentQ) return null;
  const revealed = answers[currentQ.id] !== undefined;
  const chosen = answers[currentQ.id];
  const sectionLabel =
    recipe.find((s) => s.id === canonicalSection(currentQ.section))?.label ?? currentQ.section;
  const progress = ((current + (revealed ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-bold text-ink">{sectionLabel}</span>
        <span>
          {current + 1} / {questions.length}
        </span>
        <button
          type="button"
          onClick={cancel}
          className="rounded-lg px-2 py-1 text-faint transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Exit sprint"
        >
          {'\u2715'}
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-violet transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-4 text-sm font-semibold leading-relaxed text-ink">{currentQ.stem}</p>

      <div className="mt-3 flex flex-col gap-2">
        {currentQ.options.map((opt, i) => {
          const isCorrect = i === currentQ.correct;
          const isChosen = i === chosen;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={revealed}
              className={cn(
                "rounded-xl border-2 border-ink bg-surface px-4 py-3 text-left text-sm font-medium text-ink transition-colors sm:py-2.5",
                revealed && isCorrect && "border-emerald bg-emerald/15",
                revealed && isChosen && !isCorrect && "border-danger bg-danger/15",
                !revealed && "hover:bg-surface-2"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-3 min-h-4 text-xs font-bold text-ink">
        {revealed ? (chosen === currentQ.correct ? "Correct! ✓" : "Not quite") : ""}
      </p>

      {revealed && (
        <>
          <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
            {currentQ.explanation}
          </p>
          <button
            type="button"
            onClick={next}
            className={cn(buttonVariants({ variant: "default", className: "mt-3 w-full" }))}
          >
            {current < questions.length - 1 ? "Next →" : "See results →"}
          </button>
        </>
      )}
    </div>
  );
}