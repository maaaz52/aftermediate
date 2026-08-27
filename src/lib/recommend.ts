import type { Major } from "@/lib/types";

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
