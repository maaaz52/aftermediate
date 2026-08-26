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

/* ---------- option sets ---------- */

const ENTRY_TESTS: { value: string; label: string; sub: string; streams: string[] }[] = [
  { value: "net", label: "NUST NET", sub: "200 marks · 75% of NUST merit", streams: ["pre-engineering", "ics", "icom", "alevel", "pre-medical"] },
  { value: "mdcat", label: "MDCAT", sub: "200 MCQs · 50% of medical merit", streams: ["pre-medical"] },
  { value: "ecat", label: "UET ECAT", sub: "400 marks · engineering", streams: ["pre-engineering"] },
  { value: "none", label: "Not yet", sub: "Haven't taken one", streams: ["pre-engineering", "ics", "icom", "alevel", "pre-medical"] },
];

const BOARDS = [
  "Lahore", "Federal", "Karachi", "Peshawar", "Multan", "Rawalpindi",
  "Gujranwala", "Sargodha", "Faisalabad", "AJK", "Cambridge / other",
].map((b) => ({ value: b, label: b }));

const PROVINCES = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad", "AJK", "Gilgit-Baltistan"]
  .map((p) => ({ value: p, label: p }));

const INTERESTS = [
  "Medicine & Healthcare", "Technology & Coding", "Engineering & Machines",
  "Business & Finance", "Design & Creativity", "Data & Numbers",
  "Writing & Communication", "Teaching & Mentoring", "Research & Science",
  "Helping People", "Building Things", "Leadership",
].map((i) => ({ value: i, label: i }));

/* ---------- sections ---------- */

const hasTest = (p: StudentProfile) => !!p.quiz.entryTest && p.quiz.entryTest !== "none";

export const QUIZ_SECTIONS: QuizSection[] = [
  {
    id: "stream",
    title: "What did you do in FSc?",
    subtitle: "This decides which doors we map for you.",
    questions: [
      {
        id: "stream", kind: "stream", label: "Your stream", required: true,
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
    subtitle: "Scan it or type it. We only need the totals.",
    questions: [
      { id: "marks", kind: "marksheet", label: "Scan your marksheet" },
      { id: "marks.matricObtained", kind: "number", label: "Matric obtained", required: true, min: 0 },
      { id: "marks.matricTotal", kind: "number", label: "Matric total", required: true, min: 1 },
      { id: "marks.fscObtained", kind: "number", label: "FSc obtained", required: true, min: 0 },
      { id: "marks.fscTotal", kind: "number", label: "FSc total", required: true, min: 1 },
      {
        id: "marks.fscPart1Obtained", kind: "number", label: "FSc Part-1 obtained", min: 0,
        help: "NUST weighs Part-1 at 15%.", showIf: (p) => p.quiz.entryTest === "net",
      },
      {
        id: "marks.fscPart1Total", kind: "number", label: "FSc Part-1 total", min: 1,
        showIf: (p) => p.quiz.entryTest === "net",
      },
    ],
  },
  {
    id: "merit",
    title: "Your entry test",
    subtitle: "This is the single biggest lever on your merit.",
    questions: [
      { id: "quiz.board", kind: "single", label: "Which board?", options: BOARDS },
      { id: "quiz.examYear", kind: "number", label: "FSc exam year", min: 2015, max: 2030 },
      {
        id: "quiz.entryTest", kind: "single", label: "Which entry test?", required: true,
        optionsFor: (p) =>
          ENTRY_TESTS.filter((t) => !p.stream || t.streams.includes(p.stream))
            .map(({ value, label, sub }) => ({ value, label, sub })),
      },
      {
        id: "marks.entryTestObtained", kind: "number", label: "Your score", min: 0,
        help: "Leave blank if you haven't got your result yet.", showIf: hasTest,
      },
    ],
  },
  {
    id: "money",
    title: "What can you afford?",
    subtitle: "Money is a merit factor too. Nobody tells you that.",
    questions: [
      { id: "quiz.city", kind: "text", label: "Which city do you live in?", required: true },
      { id: "quiz.province", kind: "single", label: "Province", options: PROVINCES },
      {
        id: "quiz.budgetMonthly", kind: "number", label: "Family budget (PKR per month)",
        required: true, min: 0, help: "A rough number is fine — it changes what we recommend.",
      },
      {
        id: "quiz.canRelocate", kind: "single", label: "Can you move city to study?",
        options: [
          { value: "yes", label: "Yes, anywhere" },
          { value: "in-province", label: "Only within my province" },
          { value: "no", label: "No, I need to stay home" },
        ],
      },
      {
        id: "quiz.needsScholarship", kind: "single", label: "Do you need a scholarship?",
        options: [
          { value: "must", label: "Yes — I can't go without one" },
          { value: "helpful", label: "It would help a lot" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
  {
    id: "pressure",
    title: "Who's deciding?",
    subtitle: "Be honest. This is what we help you talk about.",
    questions: [
      { id: "quiz.dreamField", kind: "text", label: "If it were entirely your call, what would you study?" },
      {
        id: "quiz.parentsExpect", kind: "single", label: "What do your parents expect?", required: true,
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
        id: "quiz.decisionMaker", kind: "single", label: "Who actually makes the final call?", required: true,
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
        required: true, min: 1, max: 5, help: "1 = struggling · 5 = fluent",
      },
      {
        id: "quiz.consistency", kind: "scale", label: "How consistent is your study routine?",
        required: true, min: 1, max: 5, help: "1 = all-nighters only · 5 = daily",
      },
    ],
  },
  {
    id: "interests",
    title: "What pulls you?",
    subtitle: "Pick everything that sounds interesting. We'll connect the dots.",
    questions: [
      { id: "interests", kind: "multi", label: "Your interests", required: true, options: INTERESTS },
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
    .every((q) => isAnswered(getAnswer(p, q.id)));
}

export function isQuizComplete(p: StudentProfile): boolean {
  return QUIZ_SECTIONS.every((s) => isSectionComplete(s, p));
}

export function firstIncompleteSection(p: StudentProfile): number {
  const i = QUIZ_SECTIONS.findIndex((s) => !isSectionComplete(s, p));
  return i === -1 ? QUIZ_SECTIONS.length : i;
}
