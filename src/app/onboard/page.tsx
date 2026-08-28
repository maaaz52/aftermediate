"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { QuizSectionView } from "@/components/quiz/quiz-section";
import { MarksheetStep } from "@/components/quiz/marksheet-step";
import { useStudent } from "@/lib/store";
import {
  QUIZ_SECTIONS,
  entryTestTotalFor,
  firstIncompleteSection,
  setAnswer,
} from "@/lib/quiz";

export default function OnboardPage() {
  const router = useRouter();
  const { profile, update, hydrated } = useStudent();

  const [step, setStep] = React.useState(0);
  const started = React.useRef(false);

  // Open at the earliest unfinished section; never trust a stale saved index.
  React.useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    setStep(Math.min(profile.quizStep, firstIncompleteSection(profile)));
  }, [hydrated, profile]);

  const section = QUIZ_SECTIONS[step];
  const total = QUIZ_SECTIONS.length;
  const isLast = step === total - 1;

  function change(id: string, value: unknown) {
    let next = setAnswer(profile, id, value);
    // Entry-test totals are implied by the test, never asked.
    if (id === "quiz.entryTest") {
      next = setAnswer(next, "marks.entryTestTotal", entryTestTotalFor(value as string));
      next = setAnswer(next, "marks.entryTestObtained", undefined);
    }
    update(next);
  }

  function go(to: number) {
    const clamped = Math.max(0, Math.min(total - 1, to));
    setStep(clamped);
    update({ quizStep: clamped });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish() {
    update({ quizCompletedAt: new Date().toISOString(), quizStep: total - 1 });
    router.replace("/dashboard");
  }

  if (!hydrated) {
    return (
      <div className="grid-bg grid min-h-screen place-items-center">
        <p className="font-mono text-sm text-faint">loading your answers…</p>
      </div>
    );
  }

  return (
    <div className="grid-bg relative min-h-screen">
      <header className="relative mx-auto flex h-20 max-w-3xl items-center justify-between px-4">
        <Link href="/"><Brand /></Link>
        <span className="font-mono text-xs text-faint">
          step {step + 1} / {total}
        </span>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pb-24">
        <div className="mb-8 h-1.5 w-full overflow-hidden border-2 border-ink bg-surface-2">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        <QuizSectionView
          key={section.id}
          section={section}
          profile={profile}
          onChange={change}
          marksheet={
            <MarksheetStep
              onExtract={({ marks, stream }) => {
                update({
                  marks: { ...profile.marks, ...marks },
                  ...(stream ? { stream } : {}),
                });
              }}
            />
          }
        />

        <div className="mt-10 flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
            <ArrowLeft /> Back
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => go(step + 1)}>
              Skip
            </Button>
            {isLast ? (
              <Button size="lg" className="gap-2" onClick={finish}>
                <Sparkles className="h-4 w-4" /> Build my map <ArrowRight />
              </Button>
            ) : (
              <Button size="lg" onClick={() => go(step + 1)}>
                Continue <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
