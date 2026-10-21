import type { Major, Pursuit, Stream } from "@/lib/types";
import { getMajorsByStream } from "@/lib/data";

/** Maps quiz interest labels to major `field` values. */
const INTEREST_FIELDS: Record<string, string[]> = {
  "Medicine & Healthcare": ["Healthcare", "Life Sciences", "HealthTech"],
  "Technology & Coding": ["Technology", "HealthTech", "Finance + Tech"],
  "Engineering & Machines": ["Engineering"],
  "Business & Finance": ["Business", "Finance + Tech"],
  "Data & Numbers": ["Technology", "Finance + Tech"],
  "Research & Science": ["Life Sciences", "Healthcare", "Engineering", "Technology"],
  "Building Things": ["Engineering", "Technology"],
  "Helping People": ["Healthcare", "Business"],
  "Design & Creativity": ["Technology", "Business"],
  "Teaching & Mentoring": ["Healthcare", "Technology", "Business"],
  "Writing & Communication": ["Business", "Finance + Tech"],
  "Leadership": ["Business", "Finance + Tech"],
};

const DEMAND_RANK: Record<Major["demand"], number> = { high: 2, medium: 1, low: 0 };

const PURSUIT_FIELDS: Partial<Record<Pursuit, string[]>> = {
  "medicine-healthcare": ["Healthcare", "Life Sciences", "HealthTech"],
  engineering: ["Engineering"],
  "computing-ai": ["Technology", "HealthTech", "Finance + Tech"],
  "business-finance": ["Business", "Finance + Tech"],
  "research-science": ["Life Sciences", "Healthcare", "Engineering", "Technology"],
};

/**
 * A desired direction should drive discovery. Stream remains a fallback for
 * students who have not chosen one and continues to be used elsewhere for
 * admission eligibility.
 */
export function majorsForPursuit(majors: Major[], pursuit: Pursuit | undefined, fallbackStream: Stream): Major[] {
  if (!pursuit || pursuit === "undecided") return getMajorsByStream(fallbackStream);
  const fields = PURSUIT_FIELDS[pursuit];
  if (!fields) return majors;
  const matches = majors.filter((major) => fields.includes(major.field));
  return matches.length > 0 ? matches : majors;
}

/**
 * Rank majors for the dashboard's "best-fit fields" strip:
 * 1. interest overlap with the student's quiz interests (2 pts each)
 * 2. demand (high > medium > low)
 * 3. top-end salary as the final tie-breaker
 */
export function bestFields(majors: Major[], interests: string[], limit = 5): Major[] {
  return [...majors]
    .map((m) => {
      const match = interests.filter((i) => INTEREST_FIELDS[i]?.includes(m.field)).length;
      return { m, score: match * 2 + DEMAND_RANK[m.demand] };
    })
    .sort((a, b) => b.score - a.score || b.m.salaryRange.high - a.m.salaryRange.high)
    .slice(0, limit)
    .map(({ m }) => m);
}
