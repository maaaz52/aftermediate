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
