export type EssayType = "personal" | "scholarship" | "both";

export interface StrategyInput {
  essayType: EssayType;
  universities: string[];
  major: string;
  extracurriculars: string[];
  profile: {
    stream: string | null;
    interests: string[];
    skills: string[];
    english?: number;
  };
}

export interface Theme {
  name: string;
  why: string;
}

export interface Strategy {
  approach: "narrative" | "analytical" | "hybrid";
  approachReason: string;
  themes: Theme[];
  structureTemplateId: "narrative-arc" | "challenge-growth" | "topic-deep-dive";
  prompts: string[];
}

export interface DraftAnalysis {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  longSentences: { text: string; words: number }[];
  tellingWords: string[];
  cliches: string[];
  suggestions: string[];
}

const CLICHES = [
  "from a young age",
  "in today's world",
  "life-changing",
  "opened my eyes",
  "think outside the box",
  "the sky is the limit",
  "reach for the stars",
  "against all odds",
  "turning point in my life",
  "made me who I am today",
  "i want to help humanity",
  "wanted to help humanity",
  "my passion for",
  "never gave up",
];

const TELLING_WORDS = [
  "happy", "sad", "nice", "good", "bad", "amazing", "awesome", "terrible",
  "wonderful", "great", "excited", "frustrated", "angry", "bored", "proud",
  "lonely", "scared",
];

export function splitSentences(text: string): string[] {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return [];
  return t.split(/(?<=[.!?])\s+/).filter(Boolean);
}

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function analyzeDraft(text: string): DraftAnalysis {
  const sentences = splitSentences(text);
  const wordCount = countWords(text);
  if (wordCount === 0) {
    return { wordCount: 0, sentenceCount: 0, avgSentenceLength: 0, longSentences: [], tellingWords: [], cliches: [], suggestions: [] };
  }
  const longSentences = sentences.map((s) => ({ text: s, words: countWords(s) })).filter((s) => s.words > 25);
  const lower = text.toLowerCase();
  const tellingWords = TELLING_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
  const cliches = CLICHES.filter((c) => lower.includes(c));
  const suggestions: string[] = [];
  if (longSentences.length > 0) {
    suggestions.push(`${longSentences.length} sentence${longSentences.length > 1 ? "s" : ""} over 25 words — vary your rhythm by splitting them.`);
  }
  if (tellingWords.length > 0) {
    suggestions.push(`You tell feelings with words (${tellingWords.join(", ")}) — replace them with one concrete moment that shows the feeling.`);
  }
  if (cliches.length > 0) {
    suggestions.push(`Cliché${cliches.length > 1 ? "s" : ""} found: "${cliches.join('", "')}" — cut it or make it specific to you.`);
  }
  if (wordCount < 250) {
    suggestions.push("Under 250 words — strong essays run 400-650; add one specific scene.");
  }
  if (wordCount > 700) {
    suggestions.push("Over 700 words — tighten by cutting your weakest paragraph.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Solid structure signals — now sharpen your best sentence and cut the rest.");
  }
  return {
    wordCount,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0,
    longSentences,
    tellingWords,
    cliches,
    suggestions,
  };
}

const THEME_BANK: { theme: string; keywords: string[]; why: string }[] = [
  { theme: "Curiosity", keywords: ["science", "math", "physics", "chemistry", "coding", "research", "question", "curious"], why: "A mind that asks its own questions stands out to admissions officers." },
  { theme: "Resilience", keywords: ["struggle", "failure", "overcome", "challenge", "effort", "determined", "setback"], why: "A specific setback overcome shows maturity and grit." },
  { theme: "Service", keywords: ["volunteer", "community", "help", "teach", "social", "ngo", "service"], why: "Service shows you will contribute to campus life, not just attend it." },
  { theme: "Leadership", keywords: ["lead", "president", "captain", "organise", "organize", "team", "mentor", "initiative"], why: "Leadership signals you will create things, not just consume them." },
  { theme: "Identity", keywords: ["culture", "urdu", "pakistan", "family", "tradition", "heritage", "background"], why: "A grounded sense of identity makes your story yours alone." },
  { theme: "Innovation", keywords: ["build", "create", "design", "startup", "idea", "invent", "app", "robot"], why: "Building things shows initiative and applied thinking." },
  { theme: "Ambition", keywords: ["dream", "goal", "future", "aspire", "career", "doctor", "engineer"], why: "Clear direction helps officers picture you on their campus." },
];

export function selectThemes(input: StrategyInput): Theme[] {
  const haystack = [...input.profile.interests, ...input.profile.skills, input.major, ...input.extracurriculars].join(" ").toLowerCase();
  const scored = THEME_BANK
    .map((b) => ({ theme: b, score: b.keywords.reduce((n, k) => n + (haystack.includes(k) ? 1 : 0), 0) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => ({ name: s.theme.theme, why: s.theme.why }));
  const fallback = ["Resilience", "Identity", "Curiosity"]
    .filter((d) => !scored.some((m) => m.name === d))
    .map((d) => ({ name: d, why: THEME_BANK.find((b) => b.theme === d)!.why }));
  return [...scored, ...fallback].slice(0, 4);
}

const STEM_MAJORS = ["engineering", "computer", "medicine", "medical", "physics", "math", "chemistry", "biology", "data science", "architecture"];

function isStem(input: StrategyInput): boolean {
  if (input.profile.stream === "pre-medical" || input.profile.stream === "pre-engineering" || input.profile.stream === "ics") return true;
  // A declared non-STEM stream is authoritative (e.g. icom stays non-STEM even if the major sounds technical).
  if (input.profile.stream !== null) return false;
  return STEM_MAJORS.some((m) => input.major.toLowerCase().includes(m));
}

function pickApproach(input: StrategyInput): { approach: Strategy["approach"]; reason: string } {
  if ((input.profile.english ?? 5) < 3) {
    return { approach: "narrative", reason: "Your English self-rating is low — a clear chronological story is the safest structure to write with confidence." };
  }
  const stem = isStem(input);
  if (input.essayType === "scholarship") {
    return stem
      ? { approach: "analytical", reason: "Scholarship committees reward clear outcomes — lead with what you did, learned, and plan to do." }
      : { approach: "hybrid", reason: "Scholarship essays need outcomes, but your strengths are personal — open with a story, then connect it to results." };
  }
  return stem
    ? { approach: "hybrid", reason: "You have technical depth worth showing — open with a specific moment, then analyze what it taught you." }
    : { approach: "narrative", reason: "Personal statements reward a story only you could tell — start with a scene and let the insight emerge." };
}

export function buildPrompts(input: StrategyInput, themes: Theme[]): string[] {
  const major = input.major.trim() || "your chosen field";
  const themeNames = themes.map((t) => t.name);
  const prompts: string[] = [
    `Tell the exact moment you first felt drawn to ${major} — a scene, not a summary.`,
    `Describe one time you struggled with ${major} or a project, and what you changed because of it.`,
    "Zoom out: what should the reader remember about you after one read?",
  ];
  if (input.extracurriculars.length > 0) {
    prompts.push(`Pick one extracurricular (${input.extracurriculars[0]}) and show a single moment inside it that reveals who you are.`);
  }
  if (input.essayType !== "personal") {
    prompts.push("Connect one of your achievements to a specific problem you want to solve after your degree — name the problem.");
  }
  if (themeNames.includes("Service")) prompts.push("Show a time you helped someone without being asked — what did you notice, and what did you do?");
  if (themeNames.includes("Leadership")) prompts.push("Tell a story of organising something small — what did you decide, and who pushed back?");
  if (themeNames.includes("Identity")) prompts.push("Describe one detail of your family, city, or culture that shaped how you see the world — why does it matter now?");
  if (themeNames.includes("Resilience")) prompts.push("Write about a failure that embarrassed you and what you did next — include what you lost.");
  if (themeNames.includes("Innovation") || themeNames.includes("Curiosity")) prompts.push("Show a question you kept asking until you found the answer — what did finding it feel like?");
  if (input.universities.length > 0) prompts.push(`Imagine your first month at ${input.universities[0]} — which club, class, or conversation do you seek out, and why?`);
  return [...new Set(prompts)].slice(0, 5);
}

export function collegeEssaysStrategy(input: StrategyInput): Strategy {
  const { approach, reason } = pickApproach(input);
  const themes = selectThemes(input);
  const structureTemplateId = approach === "narrative" ? "narrative-arc" : approach === "analytical" ? "topic-deep-dive" : "challenge-growth";
  return { approach, approachReason: reason, themes, structureTemplateId, prompts: buildPrompts(input, themes) };
}
