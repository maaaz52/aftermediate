"use client";

import * as React from "react";
import { QuestionField } from "@/components/quiz/question-field";
import { visibleQuestions, type QuizSection } from "@/lib/quiz";
import type { StudentProfile } from "@/lib/store";

interface Props {
  section: QuizSection;
  profile: StudentProfile;
  onChange: (id: string, value: unknown) => void;
  marksheet?: React.ReactNode;
}

export function QuizSectionView({ section, profile, onChange, marksheet }: Props) {
  const questions = visibleQuestions(section, profile);

  return (
    <div className="animate-rise">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{section.title}</h1>
      <p className="mt-2 text-muted">{section.subtitle}</p>

      <div className="mt-8 grid gap-7">
        {questions.map((q) =>
          q.kind === "marksheet" ? (
            <React.Fragment key={q.id}>{marksheet}</React.Fragment>
          ) : (
            <QuestionField key={q.id} question={q} profile={profile} onChange={onChange} />
          )
        )}
      </div>
    </div>
  );
}
