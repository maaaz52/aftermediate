export type TourChapterId = "getting-around" | "pakistan" | "abroad-money" | "skills-ai";

export interface TourStep {
  /** CSS selector for the spotlight target, e.g. '[data-tour="merit"]'. */
  target: string;
  title: string;
  body: string;
  /** Navigate to this route before highlighting (skipped when already there). */
  route?: string;
  /** Side effect dispatched when the step becomes active. */
  onEnter?: "open-rahbar" | "close-rahbar";
}

export interface TourChapter {
  id: TourChapterId;
  name: string;
  blurb: string;
  steps: TourStep[];
}

export const chapters: TourChapter[] = [
  {
    id: "getting-around",
    name: "Getting around",
    blurb: "dashboard & navigation",
    steps: [
      {
        target: '[data-tour="dashboard-welcome"]',
        route: "/dashboard",
        title: "Welcome to aftermediate",
        body: "This dashboard is your home base — your marks, streaks and recommendations update here as you use the site. Let's take a quick look around.",
      },
      {
        target: '[data-tour="sidebar-nav"]',
        route: "/dashboard",
        title: "Your navigation map",
        body: "Every tool lives in this sidebar, grouped from local universities to skills and A.I helpers. On a phone, the same links run along the top.",
      },
      {
        target: '[data-tour="top-nav"]',
        route: "/dashboard",
        title: "Quick actions up top",
        body: "Your account and sign-out live here. This bar also carries the mobile nav when the sidebar is hidden.",
      },
      {
        target: '[data-tour="daily-sprint"]',
        route: "/dashboard",
        title: "Daily Sprint",
        body: "Five questions, two minutes, every day. Keep the streak alive — it's the easiest habit on the site.",
      },
      {
        target: '[data-tour="rahbar-button"]',
        route: "/dashboard",
        title: "Rahbar A.I — your site guide",
        body: "Confused about any page? Ask Rahbar. It guides you around the site itself — try \"What is the Merit page?\" anytime.",
      },
    ],
  },
  {
    id: "pakistan",
    name: "Education in Pakistan",
    blurb: "universities, tests & merit",
    steps: [
      {
        target: '[data-tour="universities"]',
        route: "/pakistan/universities",
        title: "Universities, decoded",
        body: "Compare every major Pakistani university — programs, fees and real merit thresholds — before you shortlist anything.",
      },
      {
        target: '[data-tour="entry-tests"]',
        route: "/pakistan/entry-tests",
        title: "Entry Tests hub",
        body: "One place to understand ECAT, MDCAT and friends — patterns, dates and what to actually study.",
      },
      {
        target: '[data-tour="pakistan-self-assessment"]',
        route: "/pakistan/self-assessment",
        title: "Where do you stand?",
        body: "Answer a few questions and get an honest read on which fields fit you — before you commit years to one.",
      },
      {
        target: '[data-tour="pakistan-scholarships"]',
        route: "/pakistan/scholarships",
        title: "Local scholarships",
        body: "Every scholarship worth applying to, with eligibility spelled out. Free money first, always.",
      },
      {
        target: '[data-tour="merit"]',
        route: "/merit",
        title: "Know your number",
        body: "Your aggregate decides your admissions fate. This calculator shows exactly how your marks stack up.",
      },
      {
        target: '[data-tour="career"]',
        route: "/career",
        title: "Try before you commit",
        body: "Preview what a major actually leads to — courses, careers, salaries — before you pick it.",
      },
      {
        target: '[data-tour="trends"]',
        route: "/trends",
        title: "What the market wants",
        body: "Which fields are rising and which are saturated, based on real data — not auntie's opinions.",
      },
    ],
  },
  {
    id: "abroad-money",
    name: "Study abroad & money",
    blurb: "destinations & funding",
    steps: [
      {
        target: '[data-tour="countries"]',
        route: "/abroad/countries",
        title: "13 destinations, side by side",
        body: "Compare study destinations on cost, visas and Pakistani-friendliness — then narrow down to two or three.",
      },
      {
        target: '[data-tour="abroad-scholarships"]',
        route: "/abroad/scholarships",
        title: "International scholarships",
        body: "The funding Pakistani students actually win — with deadlines and eligibility in plain words.",
      },
      {
        target: '[data-tour="money"]',
        route: "/money",
        title: "Money is a merit factor",
        body: "Budget, cost calculator, scholarships — everything you need to plan the money side.",
      },
      {
        target: '[data-tour="convince"]',
        route: "/convince",
        title: "Convince your parents",
        body: "A ready-made case for studying abroad — evidence, costs and outcomes — built for the hardest audience: home.",
      },
      {
        target: '[data-tour="safar-ai"]',
        route: "/abroad/assistant",
        title: "Safar A.I — abroad guide",
        body: "Ask Safar anything about visas, universities or applications abroad. It only answers study-abroad questions.",
      },
    ],
  },
  {
    id: "skills-ai",
    name: "Skills, CV & your A.I helpers",
    blurb: "income tools & helpers",
    steps: [
      {
        target: '[data-tour="courses"]',
        route: "/skills/courses",
        title: "Learn skills that pay",
        body: "Curated free and paid courses that lead to actual freelance income — not certificate collectors.",
      },
      {
        target: '[data-tour="cv-builder"]',
        route: "/builder",
        title: "Build a hireable CV",
        body: "Turn your skills into a polished CV you can download and send — with A.I help for every line.",
      },
      {
        target: '[data-tour="hunar-ai"]',
        route: "/skills/chat",
        title: "Hunar A.I — skills coach",
        body: "Your mentor for freelancing: finding clients, pricing work and picking what to learn next.",
      },
      {
        target: '[data-tour="ustaad-ai"]',
        route: "/study",
        title: "Ustaad A.I — study tutor",
        body: "Stuck on a concept at midnight? Ustaad explains syllabus topics step by step, in plain language.",
      },
      {
        target: '[data-tour="rahbar-drawer"]',
        title: "Rahbar, opened live",
        body: "This is Rahbar — ask it how any page works, any time. It's open right now; try a question when the tour ends.",
        onEnter: "open-rahbar",
      },
      {
        target: '[data-tour="mentor-match"]',
        route: "/mentors",
        title: "Find a mentor",
        body: "Match with someone who's walked your path — university, career or abroad — and ask them anything.",
        onEnter: "close-rahbar",
      },
    ],
  },
];

export function getChapter(id: TourChapterId): TourChapter | undefined {
  return chapters.find((c) => c.id === id);
}
