/**
 * ============================================================
 *  WHAT THE SITE ACTUALLY IS
 * ============================================================
 *  One line per page a student can be sent to, in the order they
 *  meet them. Rahbar's system prompt is built from this list, so a
 *  page can only be described once it exists — and site-pages.test.ts
 *  fails if the sidebar and this list stop agreeing.
 *
 *  purpose is prompt text, not UI copy: keep it under 150 characters,
 *  and say what a student does here rather than what it is called.
 */

export interface SitePage {
  href: string;
  label: string;
  purpose: string;
}

export const SITE_PAGES: SitePage[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    purpose: "Home hub: where you stand today, your stream, FSc %, daily sprint and best-fit fields.",
  },
  {
    href: "/profile",
    label: "Profile",
    purpose: "Your answers, editable. The place to change marks, interests, skills, city and monthly budget.",
  },
  {
    href: "/onboard",
    label: "Onboarding",
    purpose: "The first-run quiz that fills the profile. Resumable, and it skips straight to the dashboard once done.",
  },
  {
    href: "/pakistan/universities",
    label: "Universities",
    purpose: "Admission steps, real fees and known faculties for Pakistani universities, with official links.",
  },
  {
    href: "/pakistan/entry-tests",
    label: "Entry Tests",
    purpose: "MDCAT, NET, ECAT and the rest: pattern, syllabus, fee and how to apply, from the conducting bodies.",
  },
  {
    href: "/pakistan/self-assessment",
    label: "Self Assessment",
    purpose: "Timed mock exams for local entry tests. Papers still being written are labelled, not playable yet.",
  },
  {
    href: "/pakistan/scholarships",
    label: "Scholarships",
    purpose: "HEC, need-based, merit and provincial funding for studying inside Pakistan.",
  },
  {
    href: "/pakistan/salary-insights",
    label: "Salary & Scope",
    purpose: "What each field pays in Pakistan, across government, private and freelancing paths.",
  },
  {
    href: "/merit",
    label: "Merit",
    purpose: "Aggregate calculators for NUST, FAST, UET and PMDC from matric, FSc and entry-test marks.",
  },
  {
    href: "/career",
    label: "Career",
    purpose: "Major cards with skill trees, day-in-the-life simulations and short courses, filtered by stream.",
  },
  {
    href: "/trends",
    label: "Trends",
    purpose: "Market charts: IT exports, company counts, youth unemployment and average income.",
  },
  {
    href: "/pakistan/assistant",
    label: "Manzil A.I",
    purpose: "Manzil, the study-in-Pakistan bot, answering on institutes, admissions, merit and scholarships.",
  },
  {
    href: "/abroad/countries",
    label: "Countries",
    purpose: "Study destinations compared on tuition, living cost, visa rules and the full pathway.",
  },
  {
    href: "/abroad/scholarships",
    label: "Scholarships",
    purpose: "Host-government, HEC foreign and university scholarships, each with its official link.",
  },
  {
    href: "/abroad/test-prep",
    label: "Test Prep",
    purpose: "IELTS, TOEFL, SAT and more: pattern, PKR fee and scoring, filterable by destination.",
  },
  {
    href: "/abroad/self-assessment",
    label: "Self Assessment",
    purpose: "Timed mocks for international tests such as IELTS and SAT, under real exam conditions.",
  },
  {
    href: "/abroad/ivy-league",
    label: "Ivy League",
    purpose: "Eight US Ivies: acceptance rates, testing policy, financial aid and the Pakistani route in.",
  },
  {
    href: "/money",
    label: "Money",
    purpose: "Affordability tiers, a cost calculator for studying abroad, destination stats, and scholarship listings.",
  },
  {
    href: "/convince",
    label: "Convince",
    purpose: "A printable bilingual report for parents, a Career Credit Score and an AI essay/CV desk.",
  },
  {
    href: "/abroad/assistant",
    label: "Safar A.I",
    purpose: "Safar, the study-abroad bot, answering from cited fees, deadlines, documents and visa rules.",
  },
  {
    href: "/skills/courses",
    label: "Courses",
    purpose: "Real courses filterable by track, level, cost and time, plus ready-made skill paths.",
  },
  {
    href: "/skills/books",
    label: "Books",
    purpose: "Hand-picked books by skill area, with free copies, read-time estimates and a queue.",
  },
  {
    href: "/skills/clients",
    label: "Clients",
    purpose: "How to find, price and keep clients, with scripts, templates and a quote builder.",
  },
  {
    href: "/skills/platforms",
    label: "Platforms",
    purpose: "Upwork, Fiverr, Toptal and others compared on fees, competition and payouts.",
  },
  {
    href: "/skills/chat",
    label: "Hunar A.I",
    purpose: "Hunar, the freelancing bot: skills, pricing, clients and getting paid from Pakistan.",
  },
  {
    href: "/college-essays",
    label: "College Essays",
    purpose: "Essay guides, a step-by-step drafting workspace, and Qalam, the essay-rating bot.",
  },
  {
    href: "/builder",
    label: "CV Builder",
    purpose: "Turns rough notes into recruiter-ready bullets, scores ATS as you type and exports a PDF.",
  },
  {
    href: "/reality-check",
    label: "Reality Check",
    purpose: "The hard numbers the site is built on — coming soon as its own page.",
  },
  {
    href: "/webinars",
    label: "Webinars",
    purpose: "Upcoming and recorded university, scholarship and career sessions, each linking out.",
  },
  {
    href: "/study",
    label: "Ustaad A.I",
    purpose: "Ustaad, the study tutor for FSc, MDCAT, ECAT and NET concepts and revision plans.",
  },
  {
    href: "/mentors",
    label: "Mentor Match",
    purpose: "Mentor cards searchable by field. The profiles shown are illustrative samples, not real people.",
  },
  {
    href: "/feedback",
    label: "Your Voice",
    purpose: "Share feedback, story or wishlist for the roadmap; vote and see what students want.",
  },
];
