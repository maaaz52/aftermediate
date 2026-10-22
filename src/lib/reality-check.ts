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

export interface RealityTrackAction {
  label: string;
  body: string;
  href: string;
}

export interface RealityTrack {
  id: "health" | "engineering" | "tech" | "business" | "society" | "explore";
  pursuits: Pursuit[];
  label: string;
  eyebrow: string;
  headline: string;
  description: string;
  heroBenchmarkIds: [string, string, string];
  proofLabel: string;
  proofTarget: string;
  proofWhy: string;
  actions: [RealityTrackAction, RealityTrackAction, RealityTrackAction];
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
    id: "internship-policy",
    metric: "3 credits",
    label: "of supervised internship now required",
    context: "For all undergraduate degree programmes",
    scope: "Pakistan · HEC policy announcement · 2025",
    source: "Higher Education Commission Pakistan",
    sourceUrl: "https://www.hec.gov.pk/english/news/news/Pages/HEC-Announces-Mandatory-Professional-Certifications-%26-Internships-for-Undergraduate-Degrees.aspx",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "HEC announced a minimum three-credit supervised internship requirement for undergraduate programmes. Universities implement policy on their own timelines and placements are not guaranteed by this figure.",
    applicablePursuits: "all",
    accent: "emerald",
  },
  {
    id: "mdcat-registrations",
    metric: "140,071",
    label: "MDCAT registrations recorded",
    context: "For the 2025 national admission test",
    scope: "Pakistan · PM&DC · MDCAT 2025",
    source: "Pakistan Medical & Dental Council",
    sourceUrl: "https://www.pmdc.pk/Documents/press/Press%20release%20MDCAT%202025.pdf",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "PM&DC reported successful registrations for MDCAT 2025. It measures test registrations, not the number of available seats or a student's probability of admission.",
    applicablePursuits: ["medicine-healthcare"],
    accent: "saffron",
  },
  {
    id: "mdcat-weight",
    metric: "50%",
    label: "of medical admission merit is MDCAT",
    context: "HSSC contributes 40% and Matric 10%",
    scope: "Pakistan · PM&DC admissions guidance",
    source: "Pakistan Medical & Dental Council",
    sourceUrl: "https://www.pmdc.pk/Home/FAQs",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "PM&DC publishes the national merit weightages; provincial admission bodies apply them within the relevant admission process.",
    applicablePursuits: ["medicine-healthcare"],
    accent: "saffron",
  },
  {
    id: "pec-graduates",
    metric: "57,091",
    label: "engineering graduates in PEC analytics",
    context: "Across PEC's own registered systems",
    scope: "Pakistan · PEC live analytics · accessed 2026",
    source: "Pakistan Engineering Council",
    sourceUrl: "https://my.pec.org.pk/",
    published: "2026",
    reviewedAt: "2026-10-22",
    methodology: "PEC's live analytics reports engineering-graduate records in the Council's systems. It is not presented as a single graduating year's cohort.",
    applicablePursuits: ["engineering"],
    accent: "violet",
  },
  {
    id: "pec-placement",
    metric: "1,899",
    label: "graduate trainees placed through PEC",
    context: "With 52 employer partners listed",
    scope: "Pakistan · PEC Graduate Engineer Training analytics · accessed 2026",
    source: "Pakistan Engineering Council",
    sourceUrl: "https://my.pec.org.pk/",
    published: "2026",
    reviewedAt: "2026-10-22",
    methodology: "PEC's live GET programme analytics reports placements and employer partners. It is a programme measure, not a count of all engineering jobs in Pakistan.",
    applicablePursuits: ["engineering"],
    accent: "emerald",
  },
  {
    id: "pec-programs",
    metric: "1,309",
    label: "engineering programmes tracked by PEC",
    context: "Across 30 engineering disciplines",
    scope: "Pakistan · PEC live analytics · accessed 2026",
    source: "Pakistan Engineering Council",
    sourceUrl: "https://my.pec.org.pk/",
    published: "2026",
    reviewedAt: "2026-10-22",
    methodology: "PEC's live analytics lists engineering disciplines and programme counts. Programme accreditation and eligibility should be checked directly before enrolment.",
    applicablePursuits: ["engineering"],
    accent: "info",
  },
  {
    id: "online-work-share",
    metric: "15.3%",
    label: "of global online workers came from Pakistan",
    context: "Up from 13% in 2023",
    scope: "Pakistan · Online Labour Index cited by SBP · 2024",
    source: "State Bank of Pakistan",
    sourceUrl: "https://www.sbp.org.pk/reports/annual/aarFY25/Complete.pdf",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "SBP cited the Online Labour Index's Pakistan share. It describes platform supply and does not represent earnings, job quality, or every freelancer.",
    applicablePursuits: ["business-finance", "arts-design"],
    accent: "violet",
  },
  {
    id: "youth-business-loans",
    metric: "Rs64bn",
    label: "lent to more than 120,000 young people",
    context: "Through the Youth Business & Agriculture Loan Scheme",
    scope: "Pakistan · Prime Minister's Youth Programme · 2025",
    source: "Prime Minister's Youth Programme",
    sourceUrl: "https://spark.pmyp.gov.pk/PDF/spark%20sep%202025.pdf",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "PMYP reported scheme lending and beneficiary totals. A loan is not a grant and individual eligibility, repayment, and approval rules apply.",
    applicablePursuits: ["business-finance"],
    accent: "emerald",
  },
  {
    id: "freelance-exports",
    metric: "US$985m",
    label: "freelancing exports recorded in FY25",
    context: "Nearly tripled in three years, according to SBP",
    scope: "Pakistan · FY2025",
    source: "State Bank of Pakistan",
    sourceUrl: "https://www.sbp.org.pk/reports/half/arFY26/chapter5.pdf",
    published: "2026",
    reviewedAt: "2026-10-22",
    methodology: "SBP reports aggregate freelancing export receipts. It does not indicate a typical freelancer's income or a guaranteed route to work.",
    applicablePursuits: ["business-finance", "arts-design"],
    accent: "saffron",
  },
  {
    id: "research-phds",
    metric: "31,353",
    label: "PhD scholars listed in Pakistan's HEC repository",
    context: "Graduated through 2022–23",
    scope: "Pakistan · HEC PhD Country Directory · reported 2024",
    source: "Higher Education Commission Pakistan",
    sourceUrl: "https://www.hec.gov.pk/english/news/AnnualReports/Annual-Report-2023-24.pdf",
    published: "2024",
    reviewedAt: "2026-10-22",
    methodology: "HEC reports progressive PhD-directory registrations, not a one-year graduating cohort or a measure of individual research quality.",
    applicablePursuits: ["research-science", "law-social-sciences"],
    accent: "violet",
  },
  {
    id: "research-dissertations",
    metric: "19,250",
    label: "full-text dissertations available publicly",
    context: "In the Pakistan Research Repository",
    scope: "Pakistan · HEC annual report · reported 2024",
    source: "Higher Education Commission Pakistan",
    sourceUrl: "https://www.hec.gov.pk/english/news/AnnualReports/Annual-Report-2023-24.pdf",
    published: "2024",
    reviewedAt: "2026-10-22",
    methodology: "HEC's report counts uploaded full-text theses in its repository. It represents research material available to study, not a student ranking.",
    applicablePursuits: ["research-science", "law-social-sciences"],
    accent: "info",
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
    id: "pasha-upskilling",
    metric: "61,515",
    label: "existing roles flagged for upskilling",
    context: "By participating IT and ITeS employers",
    scope: "Pakistan · 250+ IT / ITeS companies · 2025",
    source: "Pakistan Software Houses Association (P@SHA)",
    sourceUrl: "https://www.linkedin.com/posts/pashapk_pashareport-skillsreport2025-pashaskillssurvey-activity-7370781643378331648-YKM_",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "P@SHA's Skills Survey reports employer needs from participating companies. This describes reported reskilling demand, not a count of individual students.",
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
    metric: "39%",
    label: "of existing skills may change by 2030",
    context: "AI, cybersecurity & technology literacy are rising",
    scope: "Global employer survey · 55 economies · 2025 report",
    source: "World Economic Forum",
    sourceUrl: "https://www.weforum.org/publications/the-future-of-jobs-report-2025-jp",
    published: "2025",
    reviewedAt: "2026-10-22",
    methodology: "The Future of Jobs Report surveyed more than 1,000 employers across 55 economies. It describes workforce trends, not a Pakistan-specific student ranking.",
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

export const REALITY_TRACKS: RealityTrack[] = [
  {
    id: "health",
    pursuits: ["medicine-healthcare"],
    label: "Medicine & healthcare",
    eyebrow: "Merit is only the gate",
    headline: "In medicine, the path starts before the white coat.",
    description: "Admission is fiercely structured. Your marks and MDCAT open the door; exposure, stamina, and a plan determine how you walk through it.",
    heroBenchmarkIds: ["mdcat-registrations", "mdcat-weight", "internship-policy"],
    proofLabel: "Field exposure",
    proofTarget: "2 health-related experiences",
    proofWhy: "A clear understanding of patients, systems, or health problems helps you choose medicine for the work—not only the title.",
    actions: [
      { label: "Admission readiness", body: "Turn the 50% MDCAT weight into a weekly revision and timed-practice plan.", href: "/practice" },
      { label: "Field proof", body: "Document one health, science, volunteer, or patient-care learning experience responsibly.", href: "/career" },
      { label: "Clear explanation", body: "Write why this path fits you beyond ‘I want to be a doctor.’", href: "/study" },
    ],
  },
  {
    id: "engineering",
    pursuits: ["engineering"],
    label: "Engineering",
    eyebrow: "A degree must become practice",
    headline: "Engineering is a credential. Practice makes it believable.",
    description: "PEC tracks thousands of graduates, programmes, and training placements. The differentiator is whether you can turn theory into a working solution.",
    heroBenchmarkIds: ["pec-graduates", "pec-placement", "pec-programs"],
    proofLabel: "Build proof",
    proofTarget: "2 finished technical builds",
    proofWhy: "Calculations, models, prototypes, CAD, labs, or field work are the evidence that makes engineering knowledge easier to trust.",
    actions: [
      { label: "Build something", body: "Choose one physical, analytical, or digital engineering problem and finish a small working version.", href: "/skills/courses" },
      { label: "Check the pathway", body: "Verify the accreditation and practice requirements attached to your intended programme.", href: "/pakistan" },
      { label: "Explain the result", body: "Show the constraint, the decision you made, and what your solution changed.", href: "/builder" },
    ],
  },
  {
    id: "tech",
    pursuits: ["computing-ai"],
    label: "Computing, software & AI",
    eyebrow: "Visible work compounds",
    headline: "The market can see work before it sees your degree.",
    description: "Pakistan's digital sector is growing while global building velocity keeps accelerating. Your advantage is a body of work someone else can open, run, and understand.",
    heroBenchmarkIds: ["nsct", "github-activity", "ict-exports"],
    proofLabel: "Build proof",
    proofTarget: "2 finished projects",
    proofWhy: "A finished project gives you something concrete to explain, improve, and show—not just a topic you studied.",
    actions: [
      { label: "Ship a build", body: "Choose one useful problem and release a first version this month.", href: "/skills/courses" },
      { label: "Learn with proof", body: "Pair one relevant credential with a project that uses it.", href: "/skills/courses" },
      { label: "Make it visible", body: "Write a short project case study that explains the result in plain English.", href: "/builder" },
    ],
  },
  {
    id: "business",
    pursuits: ["business-finance"],
    label: "Business, finance & entrepreneurship",
    eyebrow: "Ideas need evidence",
    headline: "A business idea becomes real when someone chooses it.",
    description: "Pakistan's youth are building online, freelancing globally, and using formal finance to start. The strongest early signal is not a pitch—it is a problem you have tested.",
    heroBenchmarkIds: ["youth-business-loans", "online-work-share", "freelance-exports"],
    proofLabel: "Market proof",
    proofTarget: "2 customer or market tests",
    proofWhy: "A small interview, a first sale, a landing page, or a financial model is stronger evidence than an idea kept in your notes app.",
    actions: [
      { label: "Find a real problem", body: "Speak to five people who might pay for, use, or benefit from an idea.", href: "/mentor-match" },
      { label: "Test the numbers", body: "Build a simple cost, price, and break-even view before chasing a big launch.", href: "/skills/courses" },
      { label: "Show the learning", body: "Turn one insight from your test into a concise case study or pitch.", href: "/builder" },
    ],
  },
  {
    id: "society",
    pursuits: ["law-social-sciences", "arts-design", "research-science"],
    label: "Research, society & creative work",
    eyebrow: "Your voice needs a body of work",
    headline: "Ideas carry further when you can show the work behind them.",
    description: "Research, law, social impact, design, and media reward judgment and clarity. Build a portfolio of questions investigated, work published, and people served.",
    heroBenchmarkIds: ["research-phds", "research-dissertations", "internship-policy"],
    proofLabel: "Portfolio proof",
    proofTarget: "2 published or documented pieces",
    proofWhy: "A research note, case brief, design case study, article, campaign, or community project lets your thinking travel beyond the classroom.",
    actions: [
      { label: "Choose a question", body: "Find one issue you care about and define the people, evidence, and outcome involved.", href: "/career" },
      { label: "Make the work visible", body: "Publish a concise brief, case study, article, or portfolio piece with clear sources.", href: "/builder" },
      { label: "Find feedback", body: "Ask a mentor or peer for one concrete critique, then improve the work once.", href: "/mentor-match" },
    ],
  },
  {
    id: "explore",
    pursuits: ["undecided"],
    label: "Exploring your direction",
    eyebrow: "Exploring is a stage, not a stop",
    headline: "You do not need a perfect answer. You need evidence for the next one.",
    description: "Use short experiments to narrow the field: a real problem, a person doing the work, and one small piece you can complete.",
    heroBenchmarkIds: ["skills-shift", "internship-policy", "research-dissertations"],
    proofLabel: "Exploration proof",
    proofTarget: "2 field experiments",
    proofWhy: "Trying small, structured experiences reveals more about fit than waiting for certainty to arrive.",
    actions: [
      { label: "Try one field", body: "Choose a one-week project or conversation in a field you are curious about.", href: "/career" },
      { label: "Capture the evidence", body: "Write what gave you energy, what felt difficult, and what you want to test next.", href: "/dashboard" },
      { label: "Compare paths", body: "Use careers and mentors to compare the everyday work, not only the title.", href: "/mentor-match" },
    ],
  },
];

export function realityTrackFor(pursuit: Pursuit | undefined): RealityTrack {
  return REALITY_TRACKS.find((track) => track.pursuits.includes(pursuit ?? "undecided"))
    ?? REALITY_TRACKS.find((track) => track.id === "explore")!;
}

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
