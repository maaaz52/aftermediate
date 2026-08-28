import universities from "@/data/ivy-league.json";
import scholarships from "@/data/abroad-scholarships.json";
import strategyJson from "@/data/ivy-strategy.json";
import storiesJson from "@/data/ivy-stories.json";

// ---- types (mirror the JSON schemas in the ivy-league design spec §4) ----

export type IvyTestingPolicy = "required" | "optional" | "flexible";
export type IvyAidPolicy = "need-blind" | "need-aware";

export interface IvyUniversity {
  id: string;
  name: string;
  location: string;
  founded: number;
  acceptanceRate: number;
  acceptanceRateCycle: string;
  testingPolicy: IvyTestingPolicy;
  testingPolicyNote: string;
  satMid50: { math: string; ebrw: string } | null;
  actMid50: string | null;
  gpaBenchmark: string;
  english: { toeflMin: number | null; ieltsMin: number | null; duolingoMin: number | null; exceptions: string };
  application: { platform: string; feeUsd: number; feePkr: number; feeWaiver: string; deadlines: { early: string; regular: string; cycleYear: string } };
  cost: { tuitionUsd: number; tuitionPkr: number; totalCostUsd: number; totalCostPkr: number; costCycle: string };
  financialAid: { intlPolicy: IvyAidPolicy; aidDetail: string; avgAwardUsd: number | null; percentIntlAid: number | null };
  uniquePrograms: string[];
  notableFacts: string[];
  sources: { admissions: string[]; aid: string[]; cost: string[]; english: string[] };
}

export interface AbroadScholarship {
  id: string;
  name: string;
  funder: string;
  category: string;
  countries: string[];
  level: string;
  coverage: string;
  coverageDetail: string;
  eligibility: string[];
  deadline: string;
  howToApply: string[];
  sourceUrls: string[];
  ivyLeague?: boolean;
}

export interface IvyTimelinePhase {
  id: string;
  phase: string;
  title: string;
  steps: string[];
  sourceUrls?: string[];
}

export interface IvyStrategySection {
  tips: string[];
  sourceUrls?: string[];
}

export interface IvyStrategyData {
  timeline: IvyTimelinePhase[];
  essays: IvyStrategySection;
  recommendations: IvyStrategySection;
  interviews: IvyStrategySection;
}

export interface IvyStory {
  id: string;
  type: "real" | "illustrative";
  name: string;
  school: string;
  year: string;
  background: string;
  challenges: string[];
  keyFactors: string[];
  sourceUrl: string | null;
}

export interface IvyStoriesData {
  stories: IvyStory[];
}

// ---- data (JSON imports cast per repo convention) ----

export const ivyData = universities as unknown as { rateAsOf: string; universities: IvyUniversity[] };
export const ivyUniversities = ivyData.universities;

const scholarshipsData = scholarships as unknown as { dataYear: number; rateAsOf: string; scholarships: AbroadScholarship[] };
export const ivyScholarshipsList = scholarshipsData.scholarships.filter((s) => s.ivyLeague === true);

export const ivyStrategy = strategyJson as unknown as IvyStrategyData;
export const ivyStories = storiesJson as unknown as IvyStoriesData;

// ---- helpers ----

export const TESTING_POLICY_LABELS: Record<IvyTestingPolicy, string> = {
  required: "SAT/ACT required",
  optional: "Test-optional",
  flexible: "Test-flexible",
};

export const TESTING_POLICY_OPTIONS = Object.keys(TESTING_POLICY_LABELS) as IvyTestingPolicy[];

export function filterIvyUniversities(
  list: IvyUniversity[],
  opts: { query?: string; testingPolicy?: string } = {}
): IvyUniversity[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  return list.filter((u) => {
    if (opts.testingPolicy && opts.testingPolicy !== "all" && u.testingPolicy !== opts.testingPolicy) return false;
    if (q) {
      const haystack = `${u.name} ${u.location} ${u.uniquePrograms.join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export interface IvyStats {
  mostCompetitive: IvyUniversity;
  mostGenerousAid: IvyUniversity | null;
  cheapestSticker: IvyUniversity;
  needBlindCount: number;
  averageAcceptance: number;
}

export function ivyStats(list: IvyUniversity[]): IvyStats {
  if (list.length === 0) throw new Error("ivyStats: list must be non-empty");
  const mostCompetitive = [...list].sort((a, b) => a.acceptanceRate - b.acceptanceRate)[0];
  const withAid = list.filter((u) => u.financialAid.avgAwardUsd !== null);
  const mostGenerousAid =
    withAid.length > 0
      ? [...withAid].sort((a, b) => (b.financialAid.avgAwardUsd ?? 0) - (a.financialAid.avgAwardUsd ?? 0))[0]
      : null;
  const cheapestSticker = [...list].sort((a, b) => a.cost.totalCostUsd - b.cost.totalCostUsd)[0];
  const needBlindCount = list.filter((u) => u.financialAid.intlPolicy === "need-blind").length;
  const averageAcceptance =
    Math.round((list.reduce((sum, u) => sum + u.acceptanceRate, 0) / list.length) * 10) / 10;
  return { mostCompetitive, mostGenerousAid, cheapestSticker, needBlindCount, averageAcceptance };
}
