/**
 * ============================================================
 *  MANZIL'S KNOWLEDGE BASE — STUDY INSIDE PAKISTAN
 * ============================================================
 *  Two halves:
 *  - DERIVED: universities, entry tests and scholarships are read
 *    from the same JSON the explorer pages render, via
 *    src/lib/pakistan-facts.ts. Do not hand-copy those facts here
 *    — fix the JSON and both the page and the bot update together.
 *  - AUTHORED (below): the judgment questions no dataset answers.
 *    Add facts as `{ text, source }`; every fact needs a real URL,
 *    because Manzil cites it.
 *
 *  If Manzil keeps missing a question, do not reword the fact —
 *  add the student's vocabulary to ALIAS in src/lib/knowledge.ts
 *  under the topic's id.
 *
 *  Bump `updatedAt` when you review the authored facts.
 *  DO NOT put secrets or personal data here — retrieved facts are
 *  sent to the AI model with every chat message.
 * ============================================================
 */

import type { KnowledgeTopic } from "@/data/abroad-chatbot-knowledge";
import {
  deriveEntryTestTopics,
  deriveScholarshipTopics,
  deriveUniversityTopics,
} from "@/lib/pakistan-facts";

const HEC_RECOGNISED = "https://www.hec.gov.pk/english/universities/pages/recognised.aspx";
const HEC_SCHOLARSHIPS = "https://www.hec.gov.pk/english/scholarshipsgrants/pages/default.aspx";

const authoredTopics: KnowledgeTopic[] = [
  {
    id: "choosing-where-to-apply",
    title: "Choosing Where to Apply — Public vs Private",
    facts: [
      {
        text: "Public sector universities charge far lower tuition than private ones but close at much higher merit, so a realistic list mixes both: one or two aspirational public options, a mid-tier public option, and a private option you could actually afford if merit does not land.",
        source: HEC_RECOGNISED,
      },
      {
        text: "Apply to several universities, not one. Entry tests and merit lists run on different calendars, so applying widely costs application fees but protects against a single closing merit moving against you in one bad year.",
        source: HEC_RECOGNISED,
      },
      {
        text: "For students moving city, hostel availability and cost belong in the budget from the start: hostel, mess and travel home can add substantially to the advertised tuition, and universities do not guarantee on-campus hostel seats to every admitted student.",
        source: HEC_RECOGNISED,
      },
      {
        text: "A degree's value depends more on the department than the university's overall name. Check which faculties a university is actually known for before paying a premium for the brand.",
        source: HEC_RECOGNISED,
      },
    ],
  },
  {
    id: "merit-strategy",
    title: "Merit, Aggregates and What to Do If You Miss",
    facts: [
      {
        text: "Merit in Pakistan is an aggregate, not your FSc percentage alone. Universities weigh the entry test heavily — NUST computes NET 75% + FSc 15% + Matric 10% — so a strong test score can outweigh an average FSc, and a weak test score is rarely rescued by good marks.",
        source: "https://ugadmissions.nust.edu.pk/",
      },
      {
        text: "Closing merit moves every year with the applicant pool and paper difficulty. Treat last year's closing merit as a guide with a margin, not a threshold to hit exactly.",
        source: HEC_RECOGNISED,
      },
      {
        text: "Missing merit at one university is not the end of the cycle. Second and third merit lists move as admitted students confirm seats elsewhere, so keep checking the portal and keep the fee ready before the confirmation deadline.",
        source: HEC_RECOGNISED,
      },
      {
        text: "If no list moves far enough, the realistic options are a related programme at the same university, the same programme at a less competitive university, or repeating the entry test next cycle. Repeating only helps where the test — not the FSc marks — was the weak half of the aggregate, since FSc marks are fixed.",
        source: HEC_RECOGNISED,
      },
    ],
  },
  {
    id: "scholarship-strategy",
    title: "Actually Winning a Scholarship, Not Just Finding One",
    facts: [
      {
        text: "Most need-based scholarships in Pakistan are applied for after you hold an admission offer, through the university's own financial aid office rather than directly to the funder. Securing admission comes first; the funding application follows it.",
        source: HEC_SCHOLARSHIPS,
      },
      {
        text: "Need-based applications are decided largely on documented family income, so the paperwork is the application: CNICs, income certificates or salary slips, utility bills and bank statements. Applications are commonly rejected for incomplete documents rather than for insufficient need.",
        source: HEC_SCHOLARSHIPS,
      },
      {
        text: "Most programmes bar holding two awards at once, so read the stacking rules before accepting the first offer — a smaller scholarship accepted early can disqualify you from a larger one later in the cycle.",
        source: HEC_SCHOLARSHIPS,
      },
      {
        text: "Scholarship cycles are announced per year and deadlines are short once opened. Assemble the document set before the cycle opens rather than after, and check the official page directly instead of relying on forwarded messages.",
        source: HEC_SCHOLARSHIPS,
      },
    ],
  },
  {
    id: "admission-safety",
    title: "Recognition, Fake Institutes and Admission Scams",
    facts: [
      {
        text: "Before paying any institute, confirm it appears on HEC's list of recognised universities and degree-awarding institutions, and that the specific programme is recognised. A degree from an unrecognised institute is not accepted for government jobs, HEC scholarships or further study.",
        source: HEC_RECOGNISED,
      },
      {
        text: "No agent can guarantee admission or a scholarship. Universities admit on published merit and funders award on published criteria, so a guaranteed seat in exchange for a fee is a scam regardless of the paperwork shown.",
        source: HEC_RECOGNISED,
      },
      {
        text: "Pay fees only into the university's official bank account through its own challan or portal, never into a personal account, and keep the receipt. Verify a fee demand on the university's official website or admissions office before transferring.",
        source: HEC_RECOGNISED,
      },
      {
        text: "Affiliation is not the same as recognition. Some institutes advertise affiliation with a recognised university for one programme while offering others with no such standing, so check the specific programme rather than the institute's general claim.",
        source: HEC_RECOGNISED,
      },
    ],
  },
];

export const pakistanChatbotKnowledge: {
  updatedAt: string;
  topics: KnowledgeTopic[];
} = {
  updatedAt: "2026-09-02",
  topics: [
    ...deriveUniversityTopics(),
    ...deriveEntryTestTopics(),
    ...deriveScholarshipTopics(),
    ...authoredTopics,
  ],
};
