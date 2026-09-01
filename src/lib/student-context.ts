/**
 * ============================================================
 *  WHO THE BOT IS TALKING TO
 * ============================================================
 *  Derived from the student's own profiles row so the bots can answer
 *  "what's my budget?" without being told.
 *
 *  Two rules keep that safe:
 *
 *  1. Only seven columns are read — name, stream, marks, interests, city,
 *     budget, quiz. bio, practice, watchlist, education, skills and avatar
 *     are deliberately ignored: repeating them in a prompt would widen the
 *     blast radius of a leaked transcript for no benefit, and a test fails
 *     if this module ever touches one.
 *  2. Nothing is trusted just because it came out of the database. Every
 *     value is type-checked, allowlisted against the quiz options it came
 *     from, clamped to a sane range, and flattened, so a newline in a name
 *     cannot smuggle an instruction into the system prompt.
 *
 *  A row with nothing usable returns null, so an un-onboarded student gets
 *  no context block at all rather than a block of zeros.
 *
 *  quiz is the source of truth; the flat city and budget columns are
 *  mirrors written by profile-sync, so quiz wins when both are present.
 */

import { pct } from "@/lib/aggregates";
import { optionValues } from "@/lib/quiz";
import type { Stream } from "@/lib/types";

export interface StudentContext {
  name?: string;
  stream?: Stream;
  /** FSc percentage, 0-100. A real zero is kept. */
  fscPct?: number;
  city?: string;
  /** PKR per month. */
  budgetMonthly?: number;
  interests?: string[];
  dreamField?: string;
}

/**
 * The columns this module may read, typed as whatever the database actually
 * held. Everything must survive a runtime check before it is used, and any
 * other column must never be touched.
 */
export interface ProfileRow {
  name?: unknown;
  stream?: unknown;
  marks?: unknown;
  interests?: unknown;
  city?: unknown;
  budget?: unknown;
  quiz?: unknown;
}

const NAME_MAX = 40;
const PLACE_MAX = 40;
const DREAM_MAX = 80;
const BUDGET_MAX = 10_000_000;

const STREAMS: string[] = optionValues("stream", "stream");
const INTERESTS: string[] = optionValues("interests", "interests");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Coerce to one printable line and cap it, so free text cannot break out of
 * the field it occupies in the prompt.
 */
export function sanitizeField(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const flat = value
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return flat ? flat.slice(0, max) : undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The store seeds fscObtained at 0, so zero means "no marksheet entered",
 * not "scored nothing" — the same rule isAnsweredFor applies to required
 * numbers in the quiz. A student who really scored 0% is not failed by this:
 * any positive mark still yields a percentage, however small.
 */
function deriveFscPct(marks: unknown): number | undefined {
  if (!isRecord(marks)) return undefined;
  const obtained = toFiniteNumber(marks.fscObtained);
  const total = toFiniteNumber(marks.fscTotal);
  if (obtained === undefined || total === undefined) return undefined;
  if (obtained <= 0 || total <= 0) return undefined;
  return Math.round(clamp(pct(obtained, total), 0, 100) * 10) / 10;
}

export function buildStudentContext(row: ProfileRow | null | undefined): StudentContext | null {
  if (!isRecord(row)) return null;
  const quiz = isRecord(row.quiz) ? row.quiz : {};
  const ctx: StudentContext = {};

  const name = sanitizeField(row.name, NAME_MAX);
  if (name) ctx.name = name;

  if (typeof row.stream === "string" && STREAMS.includes(row.stream)) {
    ctx.stream = row.stream as Stream;
  }

  const fscPct = deriveFscPct(row.marks);
  if (fscPct !== undefined) ctx.fscPct = fscPct;

  const city = sanitizeField(quiz.city ?? row.city, PLACE_MAX);
  if (city) ctx.city = city;

  const budget = toFiniteNumber(quiz.budgetMonthly ?? row.budget);
  if (budget !== undefined) ctx.budgetMonthly = Math.round(clamp(budget, 0, BUDGET_MAX));

  if (Array.isArray(row.interests)) {
    const interests = row.interests.filter(
      (i): i is string => typeof i === "string" && INTERESTS.includes(i)
    );
    if (interests.length > 0) ctx.interests = [...new Set(interests)];
  }

  const dream = sanitizeField(quiz.dreamField, DREAM_MAX);
  if (dream) ctx.dreamField = dream;

  return Object.keys(ctx).length > 0 ? ctx : null;
}

function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatStudentContext(ctx: StudentContext | null): string {
  if (!ctx) return "";
  const lines: string[] = [];

  if (ctx.name) lines.push(`Name: ${ctx.name}`);
  if (ctx.stream) lines.push(`Stream: ${ctx.stream}`);
  if (ctx.fscPct !== undefined) lines.push(`FSc: ${ctx.fscPct}%`);
  if (ctx.city) lines.push(`City: ${ctx.city}`);
  if (ctx.budgetMonthly !== undefined) {
    lines.push(`Monthly budget: PKR ${groupThousands(ctx.budgetMonthly)}`);
  }
  if (ctx.interests && ctx.interests.length > 0) {
    lines.push(`Interests: ${ctx.interests.join(", ")}`);
  }
  if (ctx.dreamField) lines.push(`Field they would choose themselves: ${ctx.dreamField}`);

  return lines.join("\n");
}
