import type { StudentProfile } from "@/lib/store";

export type QuestionKind =
  | "single" | "multi" | "number" | "text" | "scale" | "stream" | "marksheet";

export interface QuestionOption {
  value: string;
  label: string;
  sub?: string;
}

export interface Question {
  id: string; // dotted path: "stream", "quiz.city", "marks.entryTestObtained"
  kind: QuestionKind;
  label: string;
  help?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  required?: boolean;
  showIf?: (p: StudentProfile) => boolean;
  optionsFor?: (p: StudentProfile) => QuestionOption[];
}

export interface QuizSection {
  id: string;
  title: string;
  subtitle: string;
  questions: Question[];
}

export function entryTestTotalFor(t: string | undefined): number {
  if (t === "ecat") return 400;
  return 200; // net, mdcat
}

/* ---------- dotted-path access ---------- */

export function getAnswer(p: StudentProfile, id: string): unknown {
  const [head, tail] = id.split(".");
  if (!tail) return (p as unknown as Record<string, unknown>)[head];
  const branch = (p as unknown as Record<string, Record<string, unknown>>)[head];
  return branch ? branch[tail] : undefined;
}

export function setAnswer(p: StudentProfile, id: string, value: unknown): StudentProfile {
  const [head, tail] = id.split(".");
  if (!tail) return { ...p, [head]: value } as StudentProfile;
  const branch = (p as unknown as Record<string, Record<string, unknown>>)[head] ?? {};
  return { ...p, [head]: { ...branch, [tail]: value } } as StudentProfile;
}

function isAnswered(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function isAnsweredFor(q: Question, v: unknown): boolean {
  if (!isAnswered(v)) return false;

  if (q.kind === "number" || q.kind === "scale") {
    // Required numerics must clear their minimum. This is what stops the
    // store's seeded marks defaults (0) from counting as a real answer.
    return (v as number) >= (q.min ?? 1);
  }

  if (q.kind === "single" || q.kind === "stream") {
    const opts = q.options ?? [];
    return opts.length === 0 || opts.some((o) => o.value === v);
  }

  if (q.kind === "multi") {
    const opts = q.options ?? [];
    const sel = v as string[];
    return opts.length === 0 || sel.every((s) => opts.some((o) => o.value === s));
  }

  return true;
}

/* ---------- option sets ---------- */

const INTERESTS = [
  "Medicine & Healthcare", "Technology & Coding", "Engineering & Machines",
  "Business & Finance", "Design & Creativity", "Data & Numbers",
  "Writing & Communication", "Teaching & Mentoring", "Research & Science",
  "Helping People", "Building Things", "Leadership",
].map((i) => ({ value: i, label: i }));

/* ---------- sections ---------- */

export const QUIZ_SECTIONS: QuizSection[] = [
  {
    id: "stream",
    title: "What did you do in FSc?",
    subtitle: "This decides which doors we map for you.",
    questions: [
      {
        id: "stream", kind: "stream", label: "Your stream",
        options: [
          { value: "pre-medical", label: "FSc Pre-Medical", sub: "Biology · Chemistry · Physics" },
          { value: "pre-engineering", label: "FSc Pre-Engineering", sub: "Math · Chemistry · Physics" },
          { value: "ics", label: "ICS", sub: "Computer Science · Physics · Math" },
          { value: "icom", label: "I.Com", sub: "Commerce · Accounting" },
          { value: "alevel", label: "A-Levels", sub: "Cambridge International" },
        ],
      },
    ],
  },
  {
    id: "marks",
    title: "Your marksheet",
    subtitle: "Scan it or skip — you can always add marks later.",
    questions: [
      { id: "marks", kind: "marksheet", label: "Scan your marksheet" },
    ],
  },
  {
    id: "pressure",
    title: "Who's deciding?",
    subtitle: "Be honest. This is what we help you talk about.",
    questions: [
      { id: "quiz.dreamField", kind: "text", label: "If it were entirely your call, what would you study?" },
      {
        id: "quiz.parentsExpect", kind: "single", label: "What do your parents expect?",
        options: [
          { value: "doctor", label: "Doctor" },
          { value: "engineer", label: "Engineer" },
          { value: "civil-service", label: "CSS / civil service" },
          { value: "business", label: "Business / family business" },
          { value: "my-choice", label: "Whatever I choose" },
          { value: "unsure", label: "I'm not sure" },
        ],
      },
      {
        id: "quiz.decisionMaker", kind: "single", label: "Who actually makes the final call?",
        options: [
          { value: "me", label: "Me" },
          { value: "parents", label: "My parents" },
          { value: "together", label: "We decide together" },
        ],
      },
      {
        id: "quiz.parentsFirmness", kind: "scale", label: "How firm are they about it?",
        min: 1, max: 5, help: "1 = open to anything · 5 = completely set",
      },
    ],
  },
  {
    id: "readiness",
    title: "Where are you now?",
    subtitle: "This builds your worth score — no wrong answers.",
    questions: [
      { id: "quiz.certifications", kind: "number", label: "Certifications completed", min: 0, max: 20 },
      { id: "quiz.projects", kind: "number", label: "Projects built", min: 0, max: 20 },
      {
        id: "quiz.english", kind: "scale", label: "How comfortable is your English?",
        min: 1, max: 5, help: "1 = struggling · 5 = fluent",
      },
      {
        id: "quiz.consistency", kind: "scale", label: "How consistent is your study routine?",
        min: 1, max: 5, help: "1 = all-nighters only · 5 = daily",
      },
    ],
  },
  {
    id: "interests",
    title: "What pulls you?",
    subtitle: "Pick everything that sounds interesting. We'll connect the dots.",
    questions: [
      { id: "interests", kind: "multi", label: "Your interests", options: INTERESTS },
    ],
  },
];

/* ---------- derived logic ---------- */

export function visibleQuestions(s: QuizSection, p: StudentProfile): Question[] {
  return s.questions
    .filter((q) => (q.showIf ? q.showIf(p) : true))
    .map((q) => (q.optionsFor ? { ...q, options: q.optionsFor(p) } : q));
}

export function isSectionComplete(s: QuizSection, p: StudentProfile): boolean {
  return visibleQuestions(s, p)
    .filter((q) => q.required)
    .every((q) => isAnsweredFor(q, getAnswer(p, q.id)));
}

export function isQuizComplete(p: StudentProfile): boolean {
  return QUIZ_SECTIONS.every((s) => isSectionComplete(s, p));
}

export function firstIncompleteSection(p: StudentProfile): number {
  const i = QUIZ_SECTIONS.findIndex((s) => !isSectionComplete(s, p));
  return i === -1 ? QUIZ_SECTIONS.length : i;
}
