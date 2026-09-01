/**
 * ============================================================
 *  MANZIL'S DERIVED FACTS — GENERATED FROM THE SITE'S OWN DATA
 * ============================================================
 *  Manzil does not get a hand-written copy of the universities,
 *  entry tests and scholarships: it reads the same JSON the
 *  explorer pages render. Correct a fee on the Universities page
 *  and Manzil quotes the corrected fee, with no second file to
 *  remember.
 *
 *  Two rules hold every function below together:
 *  1. Every fact names its own subject. BM25 scores facts, not
 *     topics, so "tuition is PKR X" is unreachable — it must say
 *     which university it is about.
 *  2. Vague source fields stay vague. Where the JSON says
 *     "announced per cycle", the fact says that too. Never turn
 *     a cycle-based deadline into a concrete date.
 *
 *  This module is pure: no AI SDK, no Supabase, no next/*.
 */

import type { KnowledgeFact, KnowledgeTopic } from "@/data/abroad-chatbot-knowledge";
import universitiesJson from "@/data/pakistan-universities.json";

interface ProgramFee {
  program: string;
  perYear: number;
  note: string;
}

interface UniversityRecord {
  id: string;
  name: string;
  short: string;
  city: string;
  type: string;
  entryTest: string;
  intro: string;
  ranking: { label: string; sourceUrl: string };
  admissionSteps: { title: string; detail: string }[];
  // Present on only half the records, hence optional — inferring this from
  // the JSON module yields a union that will not compile against `.map`.
  fees: { summary: string; programFees?: ProgramFee[]; sourceUrl: string };
  bestFields: { field: string; why: string }[];
  sourceUrls: string[];
}

const universities = (universitiesJson as { universities: UniversityRecord[] }).universities;

/** "NUST (National University of Sciences & Technology), Islamabad" */
function subjectOf(uni: UniversityRecord): string {
  return `${uni.short} (${uni.name}), ${uni.city}`;
}

function universityFacts(uni: UniversityRecord): KnowledgeFact[] {
  const subject = subjectOf(uni);

  const programLines = (uni.fees.programFees ?? [])
    .map((p) => ` ${p.program}: PKR ${p.perYear.toLocaleString("en-US")} per year (${p.note}).`)
    .join("");

  return [
    {
      text: `${subject} is a ${uni.type} sector university. ${uni.intro} Ranking: ${uni.ranking.label}. Its entry test is ${uni.entryTest}.`,
      source: uni.ranking.sourceUrl,
    },
    {
      text: `Admission to ${subject} goes through ${uni.entryTest}. Steps: ${uni.admissionSteps
        .map((s) => `${s.title} — ${s.detail}`)
        .join(" ")}`,
      source: uni.sourceUrls[0],
    },
    {
      text: `${subject} fees — ${uni.fees.summary}.${programLines}`,
      source: uni.fees.sourceUrl,
    },
    {
      text: `${subject} is strongest in ${uni.bestFields
        .map((f) => `${f.field} (${f.why})`)
        .join(" ")}`,
      source: uni.sourceUrls[0],
    },
  ];
}

export function deriveUniversityTopics(): KnowledgeTopic[] {
  return universities.map((uni) => ({
    id: `uni-${uni.id}`,
    title: `${uni.short} — ${uni.name}, ${uni.city}`,
    facts: universityFacts(uni),
  }));
}
