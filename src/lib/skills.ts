import * as React from "react";

export const USD_TO_PKR = 280; // approx, hedged — update when rates move

export function pkr(valueUsd: number): string {
  if (valueUsd <= 0) return "Free";
  return `Rs ${Math.round(valueUsd * USD_TO_PKR).toLocaleString("en-US")}`;
}

export type SortDir = "asc" | "desc";
export function sortByKey<T>(items: T[], key: keyof T, dir: SortDir = "asc"): T[] {
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const cmp =
      typeof av === "string" ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
    return dir === "asc" ? cmp : -cmp;
  });
}

export function trackCounts(courses: { track: string }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of courses) out[c.track] = (out[c.track] ?? 0) + 1;
  return out;
}

// --- Skill paths (source of truth for course ids that MUST exist in skills-courses.json) ---
export interface SkillPath {
  id: string;
  title: string;
  subtitle: string;
  courseIds: string[];
}

export const skillPaths: SkillPath[] = [
  {
    id: "frontend-6mo",
    title: "Frontend Dev in 6 Months",
    subtitle: "HTML → CSS → JS → React → deploy",
    courseIds: [
      "freecodecamp-responsive",
      "javascript-info",
      "cs50-web",
      "react-bootcamp",
      "tailwind-scrimba",
      "frontend-mentor-practice",
    ],
  },
  {
    id: "designer-starter",
    title: "Freelance Designer Starter",
    subtitle: "Figma → color → UX → portfolio",
    courseIds: ["figma-basics", "google-ux", "color-theory", "design-portfolio", "gumroad-design"],
  },
  {
    id: "data-analyst-starter",
    title: "Data Analyst Starter",
    subtitle: "Excel → SQL → Python → Power BI",
    courseIds: ["excel-skills", "sql-basics", "python-data", "powerbi-dax", "kaggle-pandas"],
  },
  {
    id: "ai-prompt-work",
    title: "AI & Prompt Work",
    subtitle: "Prompting → AI tools → automation",
    courseIds: ["prompt-engineering", "chatgpt-productivity", "ai-tools-workflow", "automation-zapier"],
  },
  {
    id: "content-writer",
    title: "Content Writer Path",
    subtitle: "Grammar → SEO → copywriting → niches",
    courseIds: ["english-writing", "seo-basics", "copywriting-101", "content-marketing-hubspot", "freelance-writing"],
  },
];

export function validatePaths(courses: { id: string }[]): { missing: string[]; duplicates: string[] } {
  const ids = new Set(courses.map((c) => c.id));
  const counts = new Map<string, number>();
  for (const c of courses) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
  const duplicates = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  const missing: string[] = [];
  for (const p of skillPaths)
    for (const cid of p.courseIds) {
      if (!ids.has(cid)) missing.push(`${p.id}:${cid}`);
    }
  return { missing, duplicates };
}

export function pathProgress(pathId: string, done: Set<string>): { done: number; total: number; pct: number } {
  const p = skillPaths.find((x) => x.id === pathId);
  const total = p?.courseIds.length ?? 0;
  const doneCount = p?.courseIds.filter((id) => done.has(id)).length ?? 0;
  return { done: doneCount, total, pct: total ? Math.round((doneCount / total) * 100) : 0 };
}

export function readDays(pages: number, perDay = 40): number {
  return pages <= 0 ? 0 : Math.ceil(pages / perDay);
}

// --- Platform wizard (deterministic scoring) ---
export interface WizardAnswers {
  skill: string;
  experience: "none" | "some" | "pro";
  budget: "small" | "mid" | "premium";
  payout: "payoneer" | "any";
}
export interface WizardResult {
  id: string;
  score: number;
  reasons: string[];
}

// niche keywords per skill area, matched against platform.niches (case-insensitive substring)
const SKILL_NICHES: Record<string, string[]> = {
  design: ["design", "logo", "brand", "ui/ux", "graphic"],
  development: ["web", "development", "software", "programming", "mobile"],
  writing: ["writing", "content", "copywriting", "translation"],
  data: ["data", "analytics", "excel", "sql"],
  video: ["video", "animation", "editing"],
  other: [],
};
const EXPERIENCE_BONUS: Record<WizardAnswers["experience"], number> = { none: 3, some: 2, pro: 0 };
const BUDGET_BONUS: Record<WizardAnswers["budget"], number> = { small: 3, mid: 2, premium: 0 };

export function wizardScore(
  a: WizardAnswers,
  platforms: {
    id: string;
    name: string;
    niches: string[];
    newcomerFriendly: number;
    minWithdrawalUsd: number;
    pkrFriendly: boolean;
    fee: number;
  }[]
): WizardResult[] {
  return platforms
    .map((p) => {
      let score = 5;
      const reasons: string[] = [];
      const nicheHits = SKILL_NICHES[a.skill].filter((k) => p.niches.some((n) => n.toLowerCase().includes(k)));
      if (nicheHits.length > 0) {
        score += 4;
        reasons.push(`Strong fit for ${a.skill} work`);
      }
      score += Math.min(p.newcomerFriendly, 5);
      reasons.push(`Newcomer-friendliness ${p.newcomerFriendly}/5`);
      score += EXPERIENCE_BONUS[a.experience];
      if (a.experience === "none" && p.newcomerFriendly >= 4) reasons.push("Built for first-timers");
      if (a.budget === "small" && p.minWithdrawalUsd <= 30) {
        score += 2;
        reasons.push(`Low ${p.minWithdrawalUsd}$ withdrawal threshold`);
      }
      if (a.budget === "premium" && p.newcomerFriendly <= 2) {
        score += 5;
        reasons.push("Elite platform for experienced pros");
      }
      score += BUDGET_BONUS[a.budget];
      if (a.payout === "payoneer" && p.pkrFriendly) {
        score += 3;
        reasons.push("Pakistan-friendly payouts (Payoneer/bank)");
      }
      score -= p.fee / 20;
      return { id: p.id, score: Math.max(0, Math.round(score * 10) / 10), reasons };
    })
    .sort((x, y) => y.score - x.score);
}

// --- React hooks / browser utils ---
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);
  return [value, setValue];
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
