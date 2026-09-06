export type Stream = "pre-medical" | "pre-engineering" | "ics" | "icom" | "alevel";

export interface Marks {
  matricObtained: number;
  matricTotal: number;
  fscObtained: number;
  fscTotal: number;
  fscPart1Obtained?: number;
  fscPart1Total?: number;
  entryTestObtained?: number;
  entryTestTotal?: number;
}

export interface Stat {
  value: string;
  year: string;
  source: string;
  source_url: string;
  note?: string;
}

export interface AggregateFormula {
  component: string;
  weight: number; // percentage
  label: string;
}

export interface University {
  id: string;
  name: string;
  short: string;
  city: string;
  type: "public" | "private";
  category: "engineering" | "medical" | "computing" | "business";
  streams: Stream[];
  programs: { name: string; closingMerit?: number; year?: string }[];
  formulas: {
    note: string;
    components: AggregateFormula[];
    eligibility: string[];
  };
  entryTest: string;
  source_url: string;
}

export interface Major {
  id: string;
  name: string;
  field: string;
  emoji: string;
  tagline: string;
  streams: Stream[];
  demand: "high" | "medium" | "low";
  salaryRange: { low: number; high: number; currency: string; note: string };
  whyNow: Stat;
  description: string;
  skillTree: {
    stage: string;
    skills: { name: string; cert?: string }[];
  }[];
  dayInLife: {
    scenario: string;
    title: string;
    options: { label: string; result: string; insight: string }[];
  }[];
  courses: string[];
  universities: string[];
  realityCheck: string;
}

export interface RealityCheck {
  id: string;
  myth: string;
  fact: string;
  stat: Stat;
  urdu: string;
}

export interface Scholarship {
  id: string;
  name: string;
  funder: string;
  country: string;
  level: string;
  coverage: string;
  eligibility: string[];
  englishTest: string;
  deadline: string;
  source_url: string;
}

export interface Course {
  id: string;
  name: string;
  provider: string;
  field: string;
  level: string;
  duration: string;
  cost: string;
  url: string;
}

export interface AbroadDestination {
  country: string;
  flag: string;
  approxStudents: string;
  tuition: string;
  living: string;
  postStudyWork: string;
  keyPoint: string;
}

export interface QuizAnswers {
  // merit
  board?: string;
  examYear?: number;
  entryTest?: "net" | "mdcat" | "ecat" | "none";
  // money & location
  city?: string;
  province?: string;
  budgetMonthly?: number; // PKR per month
  canRelocate?: "yes" | "in-province" | "no";
  needsScholarship?: "must" | "helpful" | "no";
  // aspirations & pressure
  dreamField?: string;
  parentsExpect?: "doctor" | "engineer" | "civil-service" | "business" | "my-choice" | "unsure";
  decisionMaker?: "me" | "parents" | "together";
  parentsFirmness?: number; // 1-5
  // readiness
  certifications?: number;
  projects?: number;
  english?: number; // 1-5
  consistency?: number; // 1-5
}

export interface DemandCountry {
  country: string;
  flag: string;
  score: number; // 0-100, mix of job demand + post-study work rights
  reason: string; // static one-line insight (fallback when AI unavailable)
  focus: string; // in-demand specializations, e.g. "Mechanical / Electrical"
}

export type ScholarshipCategory =
  | "hec"
  | "need-based"
  | "merit-based"
  | "university-specific"
  | "provincial";

export interface PakistanUniversity {
  id: string;
  name: string;
  short: string;
  city: string;
  type: "public" | "private";
  streams: Stream[];
  ranking: { label: string; sourceUrl: string };
  entryTest: string;
  intro: string;
  admissionSteps: { title: string; detail: string }[];
  fees: {
    summary: string;
    programFees?: { program: string; perYear: number; note?: string }[];
    sourceUrl: string;
  };
  bestFields: { field: string; why: string }[];
  sourceUrls: string[];
}

export interface PakistanScholarship {
  id: string;
  name: string;
  category: ScholarshipCategory;
  funder: string;
  level: string;
  coverage: string;
  eligibility: string[];
  deadline: string;
  sourceUrl: string;
  note?: string;
  /** Extended fields for detail pages */
  duration?: string;
  renewable?: boolean;
  documentsRequired?: string[];
  howToApply?: string[];
  exclusiveFor?: string;
  awardCount?: string;
  tips?: string[];
  contactInfo?: string;
}

export type SalaryLevel = "entry" | "mid" | "senior";

export interface SalaryField {
  id: string;
  name: string;
  emoji: string;
  streams: Stream[];
  salaries: Record<SalaryLevel, [number, number]>; // [min, max] thousands of PKR/month
  demand: "high" | "medium" | "low";
  growth: number; // % per year (approximate)
  stability: "high" | "medium" | "low";
  notes?: string;
  sources: string[];
}

export interface CareerPath {
  id: "freelancing" | "government" | "private";
  name: string;
  emoji: string;
  pros: string[];
  cons: string[];
  incomeRange: string;
  bestFor: string;
}

export interface EntryTest {
  id: string;
  name: string;
  short: string;
  category?: string;
  streams: Stream[];
  conductingBody: string;
  acceptedBy: string[];
  fee: string;
  frequency: string;
  validity: string;
  pattern: { section: string; questions?: number; marks?: number; time?: string }[];
  syllabus: { subject: string; topics: string[] }[];
  howToApply: string[];
  sourceUrls: string[];
  note?: string;
}

export type AbroadRegion = "europe" | "asia" | "north-america";

export interface AbroadCurrency {
  code: string;        // "EUR"
  name: string;        // "Euro"
  symbol: string;      // "€"
  toPkr: number;       // 1 unit = X PKR
  rateAsOf: string;    // "2026-08"
}

export interface CostRange {
  min: number;
  max: number; // PKR
}

export interface MonthlyLiving {
  rent: number;
  food: number;
  transport: number;
  utilities: number;
  misc: number; // PKR/month
}

export interface AbroadOneTime {
  applicationFee: number;
  visaFee: number;
  insurance: number;
  flight: number; // PKR
}

export interface AbroadCountry {
  id: string;                // "germany"
  name: string;              // "Germany"
  flag: string;              // "🇩🇪"
  intro: string;             // 2-3 sentences: profile overview
  region: AbroadRegion;
  capital: string;
  language: string;          // "German"
  currency: AbroadCurrency;
  visa: {
    type: string;            // "National D Student Visa"
    feePkr: number;
    processingTime: string;  // "4–8 weeks"
    keyPoints: string[];     // proof of funds, blocked account, etc.
  };
  intakes: string[];         // ["October", "April"]
  tuition: Record<"ug" | "masters" | "phd", CostRange>; // PKR/year
  living: {
    bigCity: MonthlyLiving;
    smallCity: MonthlyLiving;
  };
  oneTime: AbroadOneTime;
  postStudyWork: string;     // "18-month job-seeking visa"
  postStudyWorkMonths: number; // 18 — numeric for sorting/stat strip
  pathway: { title: string; detail: string }[]; // numbered application journey
  documents: string[];
  requiredTests: string[];   // ids from abroad-tests.json
  topFields: string[];
  pros: string[];
  cons: string[];
  sources: { label: string; url: string }[];
  /** Extended fields for detail pages */
  topUniversities?: { name: string; ranking?: string; programs: string[] }[];
  scholarshipsAvailable?: string[];
  climate?: string;
  cultureTips?: string[];
  studentLife?: string;
  workRights?: string;
  applicationDeadlines?: { intake: string; deadline: string }[];
}

export type CityTier = "big" | "small";
export type Lifestyle = "frugal" | "moderate" | "comfortable";
export type DegreeLevel = "ug" | "masters" | "phd";

export type AbroadScholarshipCategory =
  | "hec"                 // HEC Pakistan foreign programs
  | "host-government"     // Fulbright, Chevening, DAAD, GKS, CSC, etc.
  | "university-specific" // named university awards
  | "merit-based"
  | "need-based";

export interface AbroadScholarship {
  id: string;
  name: string;
  funder: string;
  category: AbroadScholarshipCategory;
  countries: string[];       // AbroadCountry ids, or ["multiple"]
  level: "bachelors" | "masters" | "phd" | "multiple";
  coverage: "full" | "partial";
  coverageDetail: string;    // "Tuition + living stipend + airfare"
  eligibility: string[];     // Pakistani-specific requirements
  deadline: string;          // hedged, e.g. "Jan 2027 cycle (approx.)"
  howToApply: string[];
  sourceUrls: string[];
  /** Extended fields for detail pages */
  ivyLeague?: boolean;
  duration?: string;
  renewable?: boolean;
  documentsRequired?: string[];
  exclusiveFor?: string;
  tips?: string[];
  contactInfo?: string;
}

export type AbroadTestKind = "english" | "aptitude" | "graduate" | "language";

export type PracticeMode = "full" | "quick" | "sprint";

export interface PracticeAttempt {
  id: string;
  testId: string;
  mode: PracticeMode;
  submittedAt: string; // ISO
  autoSubmitted: boolean;
  timeUsedSeconds: number;
  score: number;
  maxScore: number;
  percent: number; // 1 decimal
  sections: { id: string; name: string; correct: number; wrong: number; skipped: number }[];
}

export interface AbroadTest {
  id: string;                // "ielts"
  name: string;              // "IELTS Academic"
  short: string;             // "IELTS"
  kind: AbroadTestKind;
  countries: string[];       // AbroadCountry ids where required/accepted
  pattern: { section: string; content: string; duration: string }[];
  feePkr: number;            // approximate, one sitting
  feeNote: string;           // "Varies by centre; PKR 59,000 typical in 2026"
  frequency: string;
  validity: string;          // "2 years"
  competitiveScore: string;  // "7.0+ for top universities"
  prep: {
    tips: string[];
    resources: { label: string; url: string }[];
  };
  sourceUrls: string[];
}

export type { WatchlistEntry } from "./watchlist";
