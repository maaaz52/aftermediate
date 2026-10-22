import type { Pursuit } from "@/lib/types";

export interface RealityBenchmark {
  id: string;
  metric: string;
  label: string;
  context: string;
  scope: string;
  source: string;
  sourceUrl: string;
  published: string;
  reviewedAt: string;
  methodology: string;
  applicablePursuits: Pursuit[] | "all";
  accent: "violet" | "saffron" | "emerald" | "info";
}

/**
 * Every figure shown on Reality Check is intentionally local, dated, and
 * traceable. Keep this catalogue static so the page remains fast and no
 * third-party service or credential is required at request time.
 */
export const REALITY_BENCHMARKS: RealityBenchmark[] = [
  {
    id: "nsct",
    metric: "33,038",
    label: "senior computing students benchmarked",
    context: "National average: 46.28 / 100",
    scope: "Pakistan · 7th & 8th semester computing students · 2026",
    source: "Higher Education Commission Pakistan",
    sourceUrl: "https://www.hec.gov.pk/english/scholarshipsgrants/Documents/Complete%20NSCT%20Report%20and%20Analytics.pdf",
    published: "2026",
    reviewedAt: "2026-10-22",
    methodology: "HEC's National Skill Competency Test assessed 33,038 students who completed the assessment. It is a national cohort benchmark, not a prediction of an individual student's outcome.",
    applicablePursuits: ["computing-ai"],
    accent: "violet",
  },
  {
    id: "pasha-openings",
    metric: "32,685",
    label: "technical openings reported",
    context: "Across responding IT and ITeS employers",
    scope: "Pakistan · 250+ IT / ITeS companies · 2025",
    source: "Pakistan Software Houses Association (P@SHA)",
    sourceUrl: "https://www.linkedin.com/posts/pashapk_pashareport-skillsreport2025-pashaskillssurvey-activity-7370781643378331648-YKM_",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "P@SHA's Skills Survey reports employer needs from participating companies. These are reported openings, not guaranteed roles for every applicant.",
    applicablePursuits: ["computing-ai"],
    accent: "saffron",
  },
  {
    id: "ict-exports",
    metric: "US$3.8bn",
    label: "Pakistan ICT-services exports",
    context: "+18.3% year over year",
    scope: "Pakistan · FY2025",
    source: "State Bank of Pakistan",
    sourceUrl: "https://www.sbp.org.pk/reports/annual/aarFY25/Chapter-05.pdf",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "Official FY25 services-trade reporting. Growth reflects the sector, not an individual salary or hiring guarantee.",
    applicablePursuits: ["computing-ai"],
    accent: "emerald",
  },
  {
    id: "skills-shift",
    metric: "59%",
    label: "of workers may need training by 2030",
    context: "AI, cybersecurity & technology literacy are rising",
    scope: "Global employer survey · 55 economies · 2025 report",
    source: "World Economic Forum",
    sourceUrl: "https://www.weforum.org/publications/the-future-of-jobs-report-2025-jp",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "The Future of Jobs Report surveyed more than 1,000 employers. It describes workforce trends, not a Pakistan-specific student ranking.",
    applicablePursuits: "all",
    accent: "info",
  },
  {
    id: "github-activity",
    metric: "230 / min",
    label: "new repositories created on GitHub",
    context: "36m developers joined GitHub in 2025",
    scope: "Global developer ecosystem · 2025",
    source: "GitHub Octoverse",
    sourceUrl: "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "GitHub platform activity. This is global ecosystem context, not a measure of how a Pakistani student compares with peers.",
    applicablePursuits: ["computing-ai"],
    accent: "violet",
  },
];

export function benchmarksFor(pursuit: Pursuit | undefined): RealityBenchmark[] {
  return REALITY_BENCHMARKS.filter(
    (benchmark) => benchmark.applicablePursuits === "all" || benchmark.applicablePursuits.includes(pursuit ?? "undecided")
  );
}

export function isReviewDue(benchmark: RealityBenchmark, today = new Date()): boolean {
  const reviewed = new Date(`${benchmark.reviewedAt}T00:00:00Z`);
  const ageInDays = (today.getTime() - reviewed.getTime()) / 86_400_000;
  return ageInDays > 365;
}
