/**
 * fix-practice-banks.ts — one-off repair script for the 16 new practice banks.
 *
 * Fixes:
 *   1. ECAT: sections use `sectionId` instead of `id`
 *   2. ECAT math-019: duplicate options
 *   3. COMSATS: subject section name must match entry-tests.json pattern
 *   4. All 15 new banks: benchmark labels must carry a year/cycle reference
 *      (required by practice-banks.test.ts regex /cycle|year|\d{4}/i)
 *   5. Creates practice-nts-nat.json (90 Qs) by adapting the COMSATS bank
 *      (both follow the NTS NAT pattern) with re-ID'd questions.
 *
 * Run with: npx tsx scripts/fix-practice-banks.ts
 * Safe to re-run: every fix is idempotent.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DATA = join(process.cwd(), "src", "data");

interface BankSection {
  id: string;
  name: string;
  questionCount: number;
}

interface Bank {
  testId: string;
  schemaVersion: number;
  provenance: { note: string; sources: string[] };
  durationMinutes: number;
  marking: {
    perQuestionMarks: number;
    correctMarks: number;
    negativeMarks: number;
    totalMarks: number;
    note: string;
  };
  benchmarks: { label: string; percent: number }[];
  sections: BankSection[];
  questions: {
    id: string;
    section: string;
    topic: string;
    difficulty: string;
    stem: string;
    options: string[];
    correct: number;
    explanation: string;
    provenance: string;
    sourceUrls: string[];
  }[];
}

function loadBank(id: string): Bank {
  const path = join(DATA, `practice-${id}.json`);
  if (!existsSync(path)) throw new Error(`Missing bank: ${id}`);
  return JSON.parse(readFileSync(path, "utf-8")) as Bank;
}

function saveBank(id: string, bank: Bank): void {
  const path = join(DATA, `practice-${id}.json`);
  writeFileSync(path, JSON.stringify(bank, null, 2) + "\n");
}

const YEAR = new Date().getFullYear();
const hasYearRef = (label: string) => /cycle|year|\d{4}/i.test(label);

/** Append a year reference to a benchmark label if it lacks one. */
function hedgeLabel(label: string): string {
  if (hasYearRef(label)) return label;
  return `${label} (${YEAR})`;
}

let changed = 0;

// 1. ECAT — fix sectionId -> id
{
  const bank = loadBank("ecat");
  let dirty = false;
  for (const s of bank.sections) {
    const keyed = s as BankSection & { sectionId?: string };
    if (keyed.sectionId && !keyed.id) {
      keyed.id = keyed.sectionId;
      delete keyed.sectionId;
      dirty = true;
    }
  }
  if (dirty) {
    saveBank("ecat", bank);
    changed++;
    console.log("ecat: sections renamed sectionId -> id");
  } else {
    console.log("ecat: sections OK");
  }
}

// 2. ECAT math-019 — fix duplicate options
{
  const bank = loadBank("ecat");
  const q = bank.questions.find((x) => x.id === "ecat-math-019");
  if (q && new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) {
    q.options[2] = "x³ + 3x² + C"; // was a duplicate of option 0
    saveBank("ecat", bank);
    changed++;
    console.log("ecat: fixed duplicate options on ecat-math-019");
  } else {
    console.log("ecat: math-019 options OK");
  }
}

// 3. COMSATS — subject section name must match entry-tests.json pattern
{
  const bank = loadBank("comsats");
  const subject = bank.sections.find((s) => s.id === "subject");
  if (subject && subject.name !== "Subject (Physics, Chemistry, Mathematics for NAT-IE)") {
    subject.name = "Subject (Physics, Chemistry, Mathematics for NAT-IE)";
    saveBank("comsats", bank);
    changed++;
    console.log("comsats: subject section name aligned with entry-tests.json");
  } else {
    console.log("comsats: subject section name OK");
  }
}

// 4. Benchmark label hedging for all 15 new banks
const newBanks = [
  "ecat", "fungat", "lcat", "iba", "giki", "comsats", "pieas", "aku", "lat",
  "toefl", "gre", "gmat", "pte", "duolingo", "act",
];
for (const id of newBanks) {
  const bank = loadBank(id);
  let dirty = false;
  for (const b of bank.benchmarks) {
    const hedged = hedgeLabel(b.label);
    if (hedged !== b.label) {
      b.label = hedged;
      dirty = true;
    }
  }
  if (dirty) {
    saveBank(id, bank);
    changed++;
    console.log(`${id}: benchmark labels hedged with year`);
  } else {
    console.log(`${id}: benchmark labels OK`);
  }
}

// 5. Create practice-nts-nat.json from the COMSATS bank
{
  const source = loadBank("comsats");
  if (existsSync(join(DATA, "practice-nts-nat.json"))) {
    console.log("nts-nat: already exists, skipped");
  } else {
    const ntsNat: Bank = {
      ...source,
      testId: "nts-nat",
      provenance: {
        note: "Practice questions for the NTS NAT (National Aptitude Test) used by COMSATS and other Pakistani universities. Category One (12-year education) pattern: 90 MCQs, 120 minutes — English 20, Analytical 20, Quantitative 20, Subject 30. Subject section covers Physics, Chemistry, Mathematics (NAT-IE). Not affiliated with NTS.",
        sources: ["https://www.nts.org.pk/new/NAT.php", "https://www.nts.org.pk/new/nat-paper-pattern.php"],
      },
      benchmarks: [
        { label: `Competitive merit (top programmes, ${YEAR})`, percent: 75 },
        { label: `Standard admission requirement (${YEAR})`, percent: 60 },
        { label: `Minimum passing zone (${YEAR})`, percent: 40 },
      ],
      marking: {
        perQuestionMarks: 1,
        correctMarks: 1,
        negativeMarks: 0,
        totalMarks: 90,
        note: "90 MCQs, 90 marks, no negative marking (NTS NAT Category One pattern).",
      },
      questions: source.questions.map((q) => ({
        ...q,
        id: q.id.replace(/^comsats-/, "nts-nat-"),
      })),
    };
    // Re-order section names to match entry-tests.json NTS NAT pattern:
    // English 20, Analytical 20, Quantitative 20, Subject (varies by NAT type) 30
    ntsNat.sections = ntsNat.sections.map((s) => {
      if (s.id === "subject") return { ...s, name: "Subject (varies by NAT type)" };
      if (s.id === "analytical") return { ...s, name: "Analytical" };
      return s;
    });
    saveBank("nts-nat", ntsNat);
    changed++;
    console.log(`nts-nat: created (${ntsNat.questions.length} questions)`);
  }
}

console.log(`\nDone. ${changed} bank(s) updated.`);
