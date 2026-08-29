"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/store";
import {
  bestPercent,
  catalog,
  clearActive,
  formatClock,
  getBank,
  grade,
  loadActive,
  loadLastResult,
  orderFor,
  pushAttempt,
  quickMinutes,
  remainingSeconds,
  saveActive,
  saveLastResult,
  type ActiveExam,
  type PracticeBank,
  type PracticeMode,
  type PracticeQuestion,
  type StoredResult,
} from "@/lib/practice";
import type { EntryTest } from "@/lib/types";
import { ExamResults } from "@/components/practice/exam-results";

// ---- helpers ----

function findTest(testId: string): EntryTest | null {
  const found = catalog().find((item) => item.test.id === testId);
  return found ? found.test : null;
}

function modeLabel(mode: PracticeMode): string {
  return mode === "full" ? "Full" : mode === "quick" ? "Quick" : "Sprint";
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function firstUnansweredIndex(
  ids: string[],
  answers: Record<string, number>
): number {
  const idx = ids.findIndex((id) => !Number.isInteger(answers[id]));
  return idx === -1 ? 0 : idx;
}

function buildQuestionMap(bank: PracticeBank | null): Map<string, PracticeQuestion> {
  const map = new Map<string, PracticeQuestion>();
  for (const q of bank?.questions ?? []) map.set(q.id, q);
  return map;
}

// ---- intro pieces ----

function PatternTable({ test }: { test: EntryTest }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
              Section
            </th>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
              Questions
            </th>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
              Marks
            </th>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {test.pattern.map((row) => (
            <tr key={row.section} className="border-b border-line/60 last:border-0">
              <td className="px-3 py-2 font-medium text-ink">{row.section}</td>
              <td className="px-3 py-2 text-muted">{row.questions ?? "—"}</td>
              <td className="px-3 py-2 text-muted">{row.marks ?? "—"}</td>
              <td className="px-3 py-2 text-muted">{row.time ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InPreparationPanel({ test, basePath }: { test: EntryTest; basePath: string }) {
  return (
    <div
      className="animate-reveal card-glass mt-8 rounded-2xl p-6"
      style={{ animationDelay: "180ms" }}
    >
      <Badge variant="muted">Question bank in preparation</Badge>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        The official pattern for {test.short} is documented, but its question bank is not
        built yet. Practise with the tests that are ready — this page lights up when the
        bank ships.
      </p>
      <div className="mt-4">
        <PatternTable test={test} />
      </div>
      <div className="mt-5">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-saffron hover:underline"
        >
          ← Back to all tests
        </Link>
      </div>
    </div>
  );
}

function ModeCard({
  title,
  detail,
  sub,
  selected,
  onSelect,
}: {
  title: string;
  detail: string;
  sub?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "rounded-2xl border p-5 text-left transition-all",
        selected
          ? "border-saffron bg-saffron/10 ring-1 ring-saffron"
          : "border-line bg-surface hover:border-saffron/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-bold text-ink">{title}</span>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-saffron" />}
      </div>
      <p className="mt-1 font-mono text-sm text-muted">{detail}</p>
      {sub && <p className="mt-1 text-xs text-faint">{sub}</p>}
    </button>
  );
}

function IntroPhase({
  test,
  bank,
  mode,
  onModeChange,
  onBegin,
  active,
  onResume,
  onDiscard,
  basePath,
  isAbroad,
}: {
  test: EntryTest;
  bank: PracticeBank | null;
  mode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  onBegin: () => void;
  active: ActiveExam | null;
  onResume: () => void;
  onDiscard: () => void;
  basePath: string;
  isAbroad: boolean;
}) {
  const { profile } = useStudent();
  const best = bestPercent(profile.practice, test.id);
  const sameTestActive = active !== null && active.testId === test.id;
  // Snapshot for the resume banner's remaining clock — lazy initializer (the
  // only place an impure call is allowed during render); the live countdown
  // lives in the running phase.
  const [bannerNow] = React.useState(() => Date.now());

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex flex-wrap items-center gap-2">
        <Badge variant="saffron">Self Assessment</Badge>
        <span className="font-mono text-xs text-faint">{test.conductingBody}</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        {test.short}
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        {test.note ?? test.name}
      </p>

      {active && (
        sameTestActive ? (
          <div className="animate-reveal mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber/40 bg-amber/10 p-4">
            <div>
              <p className="text-sm font-bold text-ink">
                Resume in-progress attempt — the clock never stopped
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {modeLabel(active.mode)} · started{" "}
                {new Date(active.startedAt).toLocaleString()}
                {bank && (
                  <>
                    {" · "}
                    <span className={cn("font-mono", remainingSeconds(bank, active.startedAt, bannerNow) < 300 && "text-danger")}>
                      {formatClock(remainingSeconds(bank, active.startedAt, bannerNow))} left
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onResume}>
                Resume
              </Button>
              <Button size="sm" variant="secondary" onClick={onDiscard}>
                Discard
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-reveal mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-info/40 bg-info/10 p-4">
            <div>
              <p className="text-sm font-bold text-ink">
                You have an in-progress attempt for another test
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Discard it to clear the saved exam state.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={onDiscard}>
              Discard
            </Button>
          </div>
        )
      )}

      {!bank ? (
        <InPreparationPanel test={test} basePath={basePath} />
      ) : (
        <>
          <div
            className="animate-reveal card-glass mt-8 rounded-2xl p-6"
            style={{ animationDelay: "180ms" }}
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              What this is
            </h2>
            <div className="mt-3">
              <PatternTable test={test} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Badge variant="muted">
                {bank.marking.perQuestionMarks} mark
                {bank.marking.perQuestionMarks > 1 ? "s" : ""} per question
              </Badge>
              {bank.marking.negativeMarks > 0 ? (
                <Badge variant="danger">
                  −{bank.marking.negativeMarks} per wrong answer
                </Badge>
              ) : (
                <Badge variant="emerald">No negative marking</Badge>
              )}
              {bank.benchmarks.map((b) => (
                <Badge
                  key={b.label}
                  variant={best !== null && best >= b.percent ? "emerald" : "muted"}
                >
                  {b.label} · {b.percent}%
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">{bank.marking.note}</p>
            {best !== null && (
              <p className="mt-2 text-xs text-muted">
                Your best on {test.short}: <span className="font-mono text-emerald">{best}%</span>
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                Sources
              </span>
              {bank.provenance.sources.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {hostOf(url)}
                </a>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {bank.provenance.note}
            </p>
          </div>

          <div className="animate-reveal mt-6" style={{ animationDelay: "240ms" }}>
            <h2 className="text-lg font-bold text-ink">Choose your format</h2>
            <p className="mt-1 text-sm text-muted">
              Full mock runs the whole paper; Quick samples half of it at half the
              duration.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ModeCard
                title="Full mock"
                detail={`${bank.questions.length} questions · ${bank.durationMinutes} min`}
                sub="the official paper, fully timed"
                selected={mode === "full"}
                onSelect={() => onModeChange("full")}
              />
              <ModeCard
                title="Quick"
                detail={`${orderFor(bank, "quick").length} questions · ${quickMinutes(bank)} min`}
                sub="half paper, same section ratios"
                selected={mode === "quick"}
                onSelect={() => onModeChange("quick")}
              />
            </div>
            <Button className="mt-5 w-full sm:w-auto" size="lg" onClick={onBegin}>
              Begin test
            </Button>
          </div>
        </>
      )}

      <p className="mt-10 text-xs text-faint">
        {isAbroad
          ? "Practice platform — not affiliated with ETS, British Council, College Board, or any testing body. Test patterns change per cycle; confirm on official sources."
          : "Practice platform — not affiliated with PM&DC, NUST, or any conducting body. Patterns change per cycle; confirm on official sources."}
      </p>
    </div>
  );
}

// ---- running pieces ----

function QuestionPalette({
  bank,
  questionIds,
  answers,
  currentIndex,
  onJump,
  paletteRef,
}: {
  bank: PracticeBank;
  questionIds: string[];
  answers: Record<string, number>;
  currentIndex: number;
  onJump: (index: number) => void;
  paletteRef: React.RefObject<HTMLDivElement | null>;
}) {
  const questionMap = React.useMemo(() => buildQuestionMap(bank), [bank]);
  const answeredCount = questionIds.reduce(
    (n, id) => n + (Number.isInteger(answers[id]) ? 1 : 0),
    0
  );
  const groups = bank.sections.map((section) => ({
    section,
    entries: questionIds
      .map((id, index) => ({ id, index }))
      .filter(({ id }) => questionMap.get(id)?.section === section.id),
  }));

  function jumpToSection(sectionId: string) {
    const container = paletteRef.current;
    if (!container) return;
    const group = container.querySelector<HTMLElement>(
      `[data-palette-section="${sectionId}"]`
    );
    if (!group) return;
    const delta =
      group.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      4;
    container.scrollTo({ top: Math.max(0, delta), behavior: "smooth" });
  }

  return (
    <div
      ref={paletteRef}
      className="card-glass max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
        Answered: {answeredCount} · Unanswered: {questionIds.length - answeredCount}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {bank.sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => jumpToSection(section.id)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-ink"
          >
            {section.name}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {groups.map(({ section, entries }) => (
          <div key={section.id} data-palette-section={section.id}>
            <p className="text-xs font-bold text-ink">{section.name}</p>
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {entries.map(({ id, index }) => {
                const answered = Number.isInteger(answers[id]);
                const isCurrent = index === currentIndex;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={answered}
                    aria-label={`Question ${index + 1}${answered ? ", answered" : ""}`}
                    onClick={() => onJump(index)}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-md font-mono text-xs transition-colors",
                      answered
                        ? "bg-emerald text-background"
                        : "bg-surface-2 text-muted hover:text-ink",
                      isCurrent && "ring-2 ring-saffron"
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmitDialog({
  answered,
  total,
  onCancel,
  onConfirm,
}: {
  answered: number;
  total: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-submit-dialog-title"
        className="card-glass w-full max-w-md rounded-2xl p-6"
      >
        <h2 id="exam-submit-dialog-title" className="text-lg font-bold text-ink">
          Submit test?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Answered {answered} of {total} questions. {total - answered} unanswered. You
          cannot change answers after submitting.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Submit now
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- engine ----

export function ExamRunner({ testId, test: testProp }: { testId: string; test?: EntryTest }) {
  const bank = getBank(testId);
  const test = testProp ?? findTest(testId);
  const { profile, update } = useStudent();
  const basePath = testProp ? "/abroad/self-assessment" : "/pakistan/self-assessment";
  const isAbroad = testProp != null;

  const [phase, setPhase] = React.useState<"intro" | "running" | "done">("intro");
  const [mode, setMode] = React.useState<PracticeMode>("full");
  const [active, setActive] = React.useState<ActiveExam | null>(() => loadActive());
  const [result, setResult] = React.useState<StoredResult | null>(() => loadLastResult());

  // Running-session state — primed from the active record on Begin/Resume.
  const [startedAt, setStartedAt] = React.useState(0);
  const [questionIds, setQuestionIds] = React.useState<string[]>([]);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const [now, setNow] = React.useState(() => Date.now());
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  const submittedRef = React.useRef(false);
  const submitRef = React.useRef<(autoSubmitted: boolean) => void>(() => {});
  const paletteRef = React.useRef<HTMLDivElement>(null);
  const mobilePaletteRef = React.useRef<HTMLDivElement>(null);

  const questionMap = React.useMemo(() => buildQuestionMap(bank), [bank]);

  // Submit path — identical for manual and auto (expiry) submission. The active
  // record is the source of truth for questionIds/answers/startedAt; re-load it
  // here rather than trusting closure state (refresh-proof, corruption-guarded).
  function handleSubmit(autoSubmitted: boolean) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (!bank) return;
    const live = loadActive();
    const src: ActiveExam =
      live && live.testId === testId
        ? live
        : { testId, mode, startedAt, questionIds, answers };
    const timeUsedSeconds =
      bank.durationMinutes * 60 - remainingSeconds(bank, src.startedAt, Date.now());
    const outcome = grade(
      bank,
      src.mode,
      src.questionIds,
      src.answers,
      timeUsedSeconds,
      autoSubmitted
    );
    const stored: StoredResult = {
      testId,
      mode: src.mode,
      startedAt: src.startedAt,
      submittedAt: Date.now(),
      answers: src.answers,
      attempt: outcome.attempt,
      perQuestion: outcome.perQuestion,
    };
    saveLastResult(stored);
    clearActive();
    update({ practice: pushAttempt(profile.practice, outcome.attempt) });
    setActive(null);
    setResult(stored);
    setPhase("done");
  }

  // Keep the latest submit handler available to the countdown effect without
  // restarting the interval on every answer change.
  React.useEffect(() => {
    submitRef.current = handleSubmit;
  });

  // The single sanctioned setState-in-effect in the app — the countdown tick.
  // When the clock reaches zero, the same tick auto-submits (grade + done with
  // autoSubmitted true). The immediate tick() call covers resume-with-expired-clock.
  React.useEffect(() => {
    if (phase !== "running" || !bank) return;
    const tick = () => {
      if (remainingSeconds(bank, startedAt, Date.now()) <= 0) {
        submitRef.current(true);
        return;
      }
      setNow(Date.now());
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, startedAt, bank]);

  function begin() {
    if (!bank) return;
    const ids = orderFor(bank, mode);
    const fresh: ActiveExam = {
      testId,
      mode,
      startedAt: Date.now(),
      questionIds: ids,
      answers: {},
    };
    saveActive(fresh);
    setActive(fresh);
    setStartedAt(fresh.startedAt);
    setQuestionIds(ids);
    setAnswers({});
    setCurrentIndex(0);
    submittedRef.current = false;
    setPhase("running");
  }

  function resume() {
    if (!bank || !active || active.testId !== testId) return;
    const rec = active;
    setMode(rec.mode);
    setStartedAt(rec.startedAt);
    setQuestionIds(rec.questionIds);
    setAnswers(rec.answers);
    setCurrentIndex(firstUnansweredIndex(rec.questionIds, rec.answers));
    submittedRef.current = false;
    setPhase("running");
  }

  function discardActive() {
    clearActive();
    setActive(null);
  }

  function selectOption(questionId: string, optionIndex: number) {
    // Clicking the selected option keeps it — Clear response is the deselect path.
    if (answers[questionId] === optionIndex) return;
    const next = { ...answers, [questionId]: optionIndex };
    setAnswers(next);
    saveActive({ testId, mode, startedAt, questionIds, answers: next });
  }

  function clearAnswer(questionId: string) {
    if (!Number.isInteger(answers[questionId])) return;
    const next = { ...answers };
    delete next[questionId];
    setAnswers(next);
    saveActive({ testId, mode, startedAt, questionIds, answers: next });
  }

  function retake() {
    setMode("full");
    setPhase("intro");
  }

  if (!test) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Test not found.
        </h1>
        <Link
          href={basePath}
          className="mt-4 inline-block text-saffron"
        >
          ← Back to self-assessment
        </Link>
      </div>
    );
  }

  if (phase === "done" && result !== null && result.testId === testId) {
    return <ExamResults result={result} test={test} onRetake={retake} />;
  }

  if (phase === "running" && bank) {
    const remaining = remainingSeconds(bank, startedAt, now);
    const answeredCount = questionIds.reduce(
      (n, id) => n + (Number.isInteger(answers[id]) ? 1 : 0),
      0
    );
    const currentQid = questionIds[currentIndex] ?? null;
    const currentQuestion = currentQid ? (questionMap.get(currentQid) ?? null) : null;
    const currentSection = currentQuestion
      ? bank.sections.find((s) => s.id === currentQuestion.section)
      : undefined;

    return (
      <div>
        {/* Sticky exam bar — top-16 so it sits below the app's sticky TopNav (top-0 h-16). */}
        <div className="sticky top-16 z-40 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-bold text-ink">{test.short}</span>
              <Badge variant={mode === "full" ? "saffron" : "info"}>
                {modeLabel(mode)}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "font-mono text-lg tabular-nums",
                  remaining < 300 ? "text-danger" : "text-ink"
                )}
              >
                {formatClock(remaining)}
              </span>
              <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
                Submit
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
            {/* Main panel */}
            <div className="min-w-0">
              {currentQuestion && currentSection ? (
                <div className="card-glass rounded-2xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="muted">{currentSection.name}</Badge>
                    <span className="text-xs text-faint">
                      Question {currentIndex + 1} of {questionIds.length}
                    </span>
                  </div>
                  <p className="mt-4 font-medium leading-relaxed text-ink">
                    {currentQuestion.stem}
                  </p>
                  <div className="mt-5 space-y-2.5">
                    {currentQuestion.options.map((option, optionIndex) => {
                      const selected = answers[currentQid] === optionIndex;
                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => selectOption(currentQid, optionIndex)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all",
                            selected
                              ? "border-saffron bg-saffron/10 ring-1 ring-saffron"
                              : "border-line bg-surface hover:border-saffron/50"
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                              selected ? "border-saffron" : "border-line"
                            )}
                          >
                            {selected && (
                              <span className="h-2 w-2 rounded-full bg-saffron" />
                            )}
                          </span>
                          <span className="flex-1 text-ink">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => clearAnswer(currentQid)}
                      disabled={!Number.isInteger(answers[currentQid])}
                      className="text-xs font-medium text-faint transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                    >
                      Clear response
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    >
                      ← Prev
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentIndex >= questionIds.length - 1}
                      onClick={() =>
                        setCurrentIndex((i) => Math.min(questionIds.length - 1, i + 1))
                      }
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="card-glass rounded-2xl p-8 text-center">
                  <p className="text-sm text-muted">No questions in this exam.</p>
                </div>
              )}

              {/* Mobile palette — collapsible below lg */}
              <div className="mt-4 lg:hidden">
                <button
                  type="button"
                  id="exam-mobile-palette-trigger"
                  aria-expanded={paletteOpen}
                  aria-controls="exam-mobile-palette-panel"
                  onClick={() => setPaletteOpen((v) => !v)}
                  className="card-glass flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4"
                >
                  <span className="text-sm font-bold text-ink">
                    Question palette ({answeredCount} answered)
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-faint transition-transform",
                      paletteOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  id="exam-mobile-palette-panel"
                  role="region"
                  aria-labelledby="exam-mobile-palette-trigger"
                  hidden={!paletteOpen}
                  className="mt-2"
                >
                  <QuestionPalette
                    bank={bank}
                    questionIds={questionIds}
                    answers={answers}
                    currentIndex={currentIndex}
                    onJump={setCurrentIndex}
                    paletteRef={mobilePaletteRef}
                  />
                </div>
              </div>
            </div>

            {/* Desktop palette — sticky right column at lg+ */}
            <div className="sticky top-32 hidden lg:block">
              <QuestionPalette
                bank={bank}
                questionIds={questionIds}
                answers={answers}
                currentIndex={currentIndex}
                onJump={setCurrentIndex}
                paletteRef={paletteRef}
              />
            </div>
          </div>
        </div>

        {confirmOpen && (
          <SubmitDialog
            answered={answeredCount}
            total={questionIds.length}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              setConfirmOpen(false);
              handleSubmit(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <IntroPhase
      test={test}
      bank={bank}
      mode={mode}
      onModeChange={setMode}
      onBegin={begin}
      active={active}
      onResume={resume}
      onDiscard={discardActive}
      basePath={basePath}
      isAbroad={isAbroad}
    />
  );
}
