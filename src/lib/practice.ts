import type { EntryTest, PracticeAttempt, PracticeMode } from "./types";
import netJson from "@/data/practice-net.json";
import mdcatJson from "@/data/practice-mdcat.json";
import ecatJson from "@/data/practice-ecat.json";
import fungatJson from "@/data/practice-fungat.json";
import lcatJson from "@/data/practice-lcat.json";
import ibaJson from "@/data/practice-iba.json";
import gikiJson from "@/data/practice-giki.json";
import comsatsJson from "@/data/practice-comsats.json";
import ntsNatJson from "@/data/practice-nts-nat.json";
import pieasJson from "@/data/practice-pieas.json";
import akuJson from "@/data/practice-aku.json";
import latJson from "@/data/practice-lat.json";
import ieltsJson from "@/data/practice-ielts.json";
import satJson from "@/data/practice-sat.json";
import toeflJson from "@/data/practice-toefl.json";
import greJson from "@/data/practice-gre.json";
import gmatJson from "@/data/practice-gmat.json";
import pteJson from "@/data/practice-pte.json";
import duolingoJson from "@/data/practice-duolingo.json";
import actJson from "@/data/practice-act.json";
import entryJson from "@/data/entry-tests.json";
import abroadSelfAssessmentJson from "@/data/abroad-self-assessment.json";

export type { PracticeAttempt, PracticeMode } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuestionProvenance = "official-sample" | "past-paper" | "practice";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface PracticeQuestion {
  id: string;
  section: string;
  topic: string;
  difficulty: QuestionDifficulty;
  stem: string;
  options: string[];
  correct: number;
  explanation: string;
  provenance: QuestionProvenance;
  sourceUrls: string[];
}

export interface PracticeSection {
  id: string;
  name: string;
  questionCount: number;
}

export interface PracticeMarking {
  perQuestionMarks: number;
  correctMarks: number;
  negativeMarks: number;
  totalMarks: number;
  note: string;
}

export interface PracticeBenchmark {
  label: string;
  percent: number;
}

export interface PracticeBank {
  testId: string;
  schemaVersion: number;
  provenance: { note: string; sources: string[] };
  durationMinutes: number;
  marking: PracticeMarking;
  benchmarks: PracticeBenchmark[];
  sections: PracticeSection[];
  questions: PracticeQuestion[];
}

export interface GradedQuestion {
  id: string;
  chosen: number | null;
  correct: boolean;
}

export interface GradeOutcome {
  attempt: PracticeAttempt;
  perQuestion: GradedQuestion[];
}

export interface CatalogItem {
  test: EntryTest;
  bank: PracticeBank | null;
  status: "ready" | "preparation";
}

/** In-progress attempt persisted across refreshes. Never synced. */
export interface ActiveExam {
  testId: string;
  mode: PracticeMode;
  startedAt: number; // epoch ms — the clock reference
  questionIds: string[];
  answers: Record<string, number>;
}

/** Graded result for the review screen. Overwritten each submission. Never synced. */
export interface StoredResult {
  testId: string;
  mode: PracticeMode;
  startedAt: number;
  submittedAt: number;
  answers: Record<string, number>;
  attempt: PracticeAttempt;
  perQuestion: GradedQuestion[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const netBank = netJson as unknown as PracticeBank;
const mdcatBank = mdcatJson as unknown as PracticeBank;
const ecatBank = ecatJson as unknown as PracticeBank;
const fungatBank = fungatJson as unknown as PracticeBank;
const lcatBank = lcatJson as unknown as PracticeBank;
const ibaBank = ibaJson as unknown as PracticeBank;
const gikiBank = gikiJson as unknown as PracticeBank;
const comsatsBank = comsatsJson as unknown as PracticeBank;
const ntsNatBank = ntsNatJson as unknown as PracticeBank;
const pieasBank = pieasJson as unknown as PracticeBank;
const akuBank = akuJson as unknown as PracticeBank;
const latBank = latJson as unknown as PracticeBank;
const ieltsBank = ieltsJson as unknown as PracticeBank;
const satBank = satJson as unknown as PracticeBank;
const toeflBank = toeflJson as unknown as PracticeBank;
const greBank = greJson as unknown as PracticeBank;
const gmatBank = gmatJson as unknown as PracticeBank;
const pteBank = pteJson as unknown as PracticeBank;
const duolingoBank = duolingoJson as unknown as PracticeBank;
const actBank = actJson as unknown as PracticeBank;

export const banks: Record<string, PracticeBank> = {
  net: netBank,
  mdcat: mdcatBank,
  ecat: ecatBank,
  fungat: fungatBank,
  lcat: lcatBank,
  iba: ibaBank,
  giki: gikiBank,
  comsats: comsatsBank,
  "nts-nat": ntsNatBank,
  pieas: pieasBank,
  aku: akuBank,
  lat: latBank,
  ielts: ieltsBank,
  sat: satBank,
  toefl: toeflBank,
  gre: greBank,
  gmat: gmatBank,
  pte: pteBank,
  duolingo: duolingoBank,
  act: actBank,
};

export const entryTests = (
  entryJson as unknown as { dataYear: number; tests: EntryTest[] }
).tests;

export function getBank(testId: string): PracticeBank | null {
  return banks[testId] ?? null;
}

export function buildCatalog(
  tests: EntryTest[],
  bankMap: Record<string, PracticeBank>
): CatalogItem[] {
  return tests.map((test) => {
    const bank = bankMap[test.id] ?? null;
    return { test, bank, status: bank ? "ready" : "preparation" };
  });
}

export function catalog(): CatalogItem[] {
  return buildCatalog(entryTests, banks);
}

export const abroadTests = (
  abroadSelfAssessmentJson as unknown as { dataYear: number; tests: EntryTest[] }
).tests;

export function catalogAbroad(): CatalogItem[] {
  return buildCatalog(abroadTests, banks);
}

// ---------------------------------------------------------------------------
// Exam construction
// ---------------------------------------------------------------------------

export function fullOrder(bank: PracticeBank): string[] {
  return bank.questions.map((q) => q.id);
}

/**
 * Deterministic half-paper: stride-2 within each section. Preserves section
 * ratios exactly (MDCAT: 41/23/18/5/5 = 92 Qs) and is stable across visits.
 */
export function quickOrder(bank: PracticeBank): string[] {
  const out: string[] = [];
  for (const section of bank.sections) {
    const qs = bank.questions.filter((q) => q.section === section.id);
    for (let i = 0; i < qs.length; i += 2) out.push(qs[i].id);
  }
  return out;
}

export function quickMinutes(bank: PracticeBank): number {
  return Math.round(bank.durationMinutes / 2);
}

export function orderFor(bank: PracticeBank, mode: PracticeMode): string[] {
  return mode === "full" ? fullOrder(bank) : quickOrder(bank);
}

// ---------------------------------------------------------------------------
// Grading (pure)
// ---------------------------------------------------------------------------

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function grade(
  bank: PracticeBank,
  mode: PracticeMode,
  questionIds: string[],
  answers: Record<string, number>,
  timeUsedSeconds: number,
  autoSubmitted: boolean
): GradeOutcome {
  const byId = new Map(bank.questions.map((q) => [q.id, q] as const));
  const stats = new Map(
    bank.sections.map((s) => [s.id, { correct: 0, wrong: 0, skipped: 0 }])
  );

  const perQuestion: GradedQuestion[] = [];
  let correctCount = 0;
  let wrongCount = 0;

  for (const id of questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    const chosen = Number.isInteger(answers[id]) ? answers[id] : null;
    const isCorrect = chosen !== null && chosen === q.correct;
    const bucket = stats.get(q.section);
    if (chosen === null) {
      if (bucket) bucket.skipped++;
    } else if (isCorrect) {
      correctCount++;
      if (bucket) bucket.correct++;
    } else {
      wrongCount++;
      if (bucket) bucket.wrong++;
    }
    perQuestion.push({ id, chosen, correct: isCorrect });
  }

  const score = Math.max(
    0,
    correctCount * bank.marking.correctMarks - wrongCount * bank.marking.negativeMarks
  );
  const maxScore = bank.marking.perQuestionMarks * questionIds.length;
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;

  const attempt: PracticeAttempt = {
    id: makeId(),
    testId: bank.testId,
    mode,
    submittedAt: new Date().toISOString(),
    autoSubmitted,
    timeUsedSeconds: Math.max(0, Math.round(timeUsedSeconds)),
    score,
    maxScore,
    percent,
    sections: bank.sections.map((s) => ({
      id: s.id,
      name: s.name,
      ...(stats.get(s.id) ?? { correct: 0, wrong: 0, skipped: 0 }),
    })),
  };

  return { attempt, perQuestion };
}

// ---------------------------------------------------------------------------
// Profile helpers (pure)
// ---------------------------------------------------------------------------

export const ATTEMPT_CAP = 50;

export function pushAttempt(
  list: PracticeAttempt[],
  attempt: PracticeAttempt
): PracticeAttempt[] {
  return [attempt, ...list].slice(0, ATTEMPT_CAP);
}

export function sprintAttempts(list: PracticeAttempt[]): PracticeAttempt[] {
  return list.filter((a) => a.mode === "sprint");
}

/** Mock-test attempts only — sprints are habit practice, not readiness mocks. */
export function mockAttempts(list: PracticeAttempt[]): PracticeAttempt[] {
  return list.filter((a) => a.mode !== "sprint");
}

export function attemptsFor(list: PracticeAttempt[], testId: string): PracticeAttempt[] {
  return list.filter((a) => a.testId === testId);
}

export function bestPercent(list: PracticeAttempt[], testId: string): number | null {
  const mine = attemptsFor(list, testId);
  if (mine.length === 0) return null;
  return Math.max(...mine.map((a) => a.percent));
}

export function latestAttempt(
  list: PracticeAttempt[],
  testId: string
): PracticeAttempt | null {
  return attemptsFor(list, testId)[0] ?? null;
}

// ---------------------------------------------------------------------------
// Clock helpers
// ---------------------------------------------------------------------------

export function remainingSeconds(bank: PracticeBank, startedAt: number, now: number): number {
  const used = (now - startedAt) / 1000;
  return Math.max(0, Math.round(bank.durationMinutes * 60 - used));
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// ---------------------------------------------------------------------------
// Transient storage (never synced; SSR- and corruption-guarded)
// ---------------------------------------------------------------------------

const ACTIVE_KEY = "aftermediate:exam:active:v1";
const RESULT_KEY = "aftermediate:exam:lastResult:v1";

function safeRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function loadActive(): ActiveExam | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as ActiveExam;
    if (
      !value ||
      typeof value.testId !== "string" ||
      typeof value.startedAt !== "number" ||
      !Array.isArray(value.questionIds) ||
      typeof value.answers !== "object" ||
      value.answers === null
    ) {
      safeRemove(ACTIVE_KEY);
      return null;
    }
    return value;
  } catch {
    safeRemove(ACTIVE_KEY);
    return null;
  }
}

export function saveActive(active: ActiveExam): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
  } catch {
    // storage full/unavailable — the exam still works in memory
  }
}

export function clearActive(): void {
  if (typeof window === "undefined") return;
  safeRemove(ACTIVE_KEY);
}

export function loadLastResult(): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredResult;
    if (!value || typeof value.testId !== "string" || !value.attempt || !Array.isArray(value.perQuestion)) {
      safeRemove(RESULT_KEY);
      return null;
    }
    return value;
  } catch {
    safeRemove(RESULT_KEY);
    return null;
  }
}

export function saveLastResult(result: StoredResult): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    // ignore — review screen falls back to in-memory state
  }
}
