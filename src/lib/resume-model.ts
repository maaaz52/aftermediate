// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateId = "silicon" | "academic" | "glass";
export type RecruiterMode = "startup" | "corporate" | "university";
export type TabId = "identity" | "experience" | "projects" | "skills";

export interface ResumeData {
  identity: {
    name: string;
    email: string;
    phone: string;
    location: string;
    github: string;
    linkedin: string;
    targetRole: string;
  };
  experience: {
    rawNotes: string;
    bullets: string[];
    polished: boolean;
  };
  projects: {
    entries: { title: string; org: string; year: string; description: string }[];
    academics: { degree: string; institution: string; score: string; years: string }[];
    certificates: string[];
    leadership: string[];
  };
  skills: {
    tech: string[];
    soft: string[];
  };
}

export interface AtsBreakdown {
  formatting: number; // 0-100
  actionVerbs: number; // 0-100
  keywords: number; // 0-100
}

export interface AtsResult {
  impactScore: number; // 0-100 overall
  breakdown: AtsBreakdown;
}

export type FixType =
  | "cliche"
  | "weakverb"
  | "keywords"
  | "github"
  | "metrics"
  | "formatting"
  | "academics"
  | "actionverbs";

export interface FeedbackItem {
  id: string;
  kind: "warning" | "tip";
  message: string;
  fixLabel: string;
  /** Machine-readable fix kind — applyAutoFix dispatches on this, not on fixLabel text */
  fixType: FixType;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STRONG_ACTION_VERBS = [
  "led",
  "built",
  "designed",
  "coordinated",
  "grew",
  "organized",
  "launched",
  "produced",
  "managed",
  "created",
  "developed",
  "improved",
  "increased",
  "reduced",
  "delivered",
  "founded",
  "volunteered",
  "trained",
  "mentored",
  "won",
  "achieved",
  "raised",
  "edited",
  "filmed",
  "taught",
  "wrote",
  // Rewrite outputs of the weak-verb auto-fixes (kept strong so re-fixes are no-ops)
  "owned",
  "executed",
  "contributed",
  "supported",
] as const;

export const WEAK_VERBS = [
  "was",
  "were",
  "did",
  "helped",
  "worked",
  "made",
  "got",
  "did some",
  "assisted",
] as const;

export const CLICHE_WORDS = [
  "hardworking",
  "passionate",
  "team player",
  "dedicated",
  "self-motivated",
  "go-getter",
  "fast learner",
] as const;

export const ROLE_KEYWORDS: Record<string, string[]> = {
  "web developer": ["HTML", "CSS", "JavaScript", "Git", "React", "Responsive Design", "APIs"],
  "graphic designer": ["Canva", "Photoshop", "Illustrator", "Typography", "Branding", "Figma"],
  "pre-med research intern": [
    "Research",
    "Lab",
    "Data Analysis",
    "Scientific Writing",
    "Biology",
    "Chemistry",
  ],
  "data analyst": ["Excel", "SQL", "Python", "Data Visualization", "Statistics", "Power BI"],
  "software engineer": ["Python", "Java", "Git", "APIs", "Algorithms", "Databases"],
  "content creator": ["Video Editing", "SEO", "Social Media", "Scriptwriting", "Analytics"],
  "business intern": ["Excel", "Presentations", "Market Research", "Communication", "Reporting"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the ROLE_KEYWORDS entry whose key is a substring of normalized targetRole */
function findRoleKeywords(targetRole: string): string[] {
  const normalized = targetRole.toLowerCase();
  for (const [key, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (normalized.includes(key)) return keywords;
  }
  return [];
}

/** Determine which strong verb to prepend based on content cues. */
function pickStrongVerb(clause: string): string {
  const lower = clause.toLowerCase();
  if (/research|study/i.test(lower)) return "Researched";
  if (/organi[sz]e/i.test(lower)) return "Coordinated";
  if (/write|blog|doc/i.test(lower)) return "Wrote";
  if (/creat|design|develop/i.test(lower)) return "Developed";
  if (/teach|mentor|train|guide/i.test(lower)) return "Mentored";
  if (/lead|manage|supervis|head/i.test(lower)) return "Led";
  if (/volunteer/i.test(lower)) return "Volunteered";
  if (/present|demo/i.test(lower)) return "Presented";
  if (/launch|start|found/i.test(lower)) return "Launched";
  if (/build|implement/i.test(lower)) return "Built";
  return "Developed";
}

/** Whether a word matches one of pickStrongVerb's content cues (i.e. it is verb-like). */
function matchesVerbCue(word: string): boolean {
  return /research|study|organi[sz]e|write|blog|doc|creat|design|develop|teach|mentor|train|guide|lead|manage|supervis|head|volunteer|present|demo|launch|start|found|build|implement/i.test(
    word
  );
}

/** True when a word is (or inflects to) a strong action verb, incl. UK "organised". */
function isStrongVerb(word: string): boolean {
  const cleaned = word
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/organi[sz]ed/, "organized");
  return STRONG_ACTION_VERBS.some((v) => cleaned === v || cleaned.startsWith(v));
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Bare trailing preposition left dangling after a count phrase is removed. */
const DANGLING_PREPOSITIONS = /\s+(?:for|by|at|in|with)\s*$/i;
/** Preposition stranded right before another prepositional phrase ("for in 2023"). */
const PREPOSITION_BEFORE_PREPOSITION = /\s+(?:for|by|at|in|with)(?=\s+(?:for|by|at|in|with)\b)/i;

/**
 * Strip prepositions stranded when a count phrase is carved out of the middle
 * of a clause ("organized an event for 200 students in 2023" → "an event in 2023"):
 * - a bare trailing preposition ("event for" → "event")
 * - a preposition stranded right before another preposition ("for in 2023" → "in 2023")
 * The loop handles chains ("for with in 2023").
 */
function stripTrailingPrepositions(text: string): string {
  let result = text.trim();
  let previous: string;
  do {
    previous = result;
    result = result
      .replace(PREPOSITION_BEFORE_PREPOSITION, "")
      .replace(DANGLING_PREPOSITIONS, "")
      .trim();
  } while (result !== previous && result.length > 0);
  return result;
}

// ---------------------------------------------------------------------------
// Weak-verb rewrites (shared by polishNotes and applyAutoFix)
// ---------------------------------------------------------------------------

/** Explicit weak phrases are matched before the single-verb map. */
const WEAK_PHRASE_REWRITES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^was\s+responsible\s+for\s+/i, "Owned"],
  [/^were\s+responsible\s+for\s+/i, "Owned"],
  [/^was\s+in\s+charge\s+of\s+/i, "Led"],
  [/^were\s+in\s+charge\s+of\s+/i, "Led"],
  [/^was\s+tasked\s+with\s+/i, "Owned"],
  [/^were\s+tasked\s+with\s+/i, "Owned"],
  [/^helped\s+with\s+/i, "Supported delivery of"],
  [/^assisted\s+with\s+/i, "Supported"],
  [/^did\s+some\s+/i, "Executed"],
];

const WEAK_VERB_REWRITES: Record<string, string> = {
  was: "Led",
  were: "Led",
  did: "Executed",
  helped: "Supported",
  worked: "Contributed",
  made: "Created",
  got: "Achieved",
  assisted: "Supported",
};

/**
 * Rewrite text that starts with a weak verb/phrase to a strong-verb lead.
 * Returns null when no weak verb is found at the start.
 */
function rewriteWeakVerb(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  for (const [pattern, strong] of WEAK_PHRASE_REWRITES) {
    if (pattern.test(lower)) {
      const rest = stripTrailingPrepositions(trimmed.replace(pattern, ""));
      return `${strong} ${lowerFirst(rest)}`;
    }
  }

  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase() ?? "";
  const strong = WEAK_VERB_REWRITES[firstWord];
  if (strong) {
    const rest = stripTrailingPrepositions(trimmed.replace(new RegExp(`^${firstWord}\\s*`, "i"), ""));
    return `${strong} ${lowerFirst(rest)}`;
  }
  return null;
}

/**
 * Make a clause/bullet start with a strong action verb without duplicating the
 * clause's own verb ("managed a team" → "Led a team", never "Led managed a team").
 */
function forceStrongVerbStart(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const firstWord = trimmed.split(/\s+/)[0] ?? "";
  if (firstWord && isStrongVerb(firstWord)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  const verb = pickStrongVerb(trimmed);
  let remainder = lowerFirst(trimmed);
  const firstLower = firstWord.toLowerCase();
  if (
    (WEAK_VERBS as readonly string[]).includes(firstLower) ||
    (matchesVerbCue(firstWord) && pickStrongVerb(firstWord) === verb)
  ) {
    remainder = lowerFirst(remainder.slice(firstWord.length).trim());
  }
  return `${verb} ${stripTrailingPrepositions(remainder)}`;
}

// ---------------------------------------------------------------------------
// polishNotes — rule-based AI polish engine
// ---------------------------------------------------------------------------

/** Real participant/impact counts — never years, percentages, or bare numbers. */
const COUNT_PATTERN =
  /(\d+)\s*(?:students|people|members|participants|kids|attendees|teams|videos|subscribers|views|projects|events)\b/i;

/**
 * Split raw notes into clauses without corrupting numbers:
 * - sentence boundaries only on ". " (so "2.5K" survives)
 * - all commas split, then adjacent fragments are re-joined when the boundary
 *   sits between digits (so "1,000" and "raising 1,000 rupees" survive,
 *   but "2023, I organized" splits cleanly)
 */
function splitClauses(rawNotes: string): string[] {
  return rawNotes
    .split(/\n/)
    .flatMap((line) => line.split(/\.\s+/))
    .flatMap((part) => {
      const fragments = part.split(/,\s*|\s+and\s+/i);
      const joined: string[] = [];
      for (const fragment of fragments) {
        const prev = joined[joined.length - 1];
        if (prev !== undefined && /\d$/.test(prev) && /^\d/.test(fragment)) {
          joined[joined.length - 1] = `${prev},${fragment}`;
        } else {
          joined.push(fragment);
        }
      }
      return joined;
    })
    .map((c) => c.replace(/^[\s,]+|[\s,]+$/g, "").replace(/\.+$/, "").trim())
    .filter((c) => c.length > 0);
}

/**
 * "organized X for N students" → "Coordinated logistics for X, managing N+ participants."
 * The count phrase is removed from the subject so prepositions are never duplicated.
 */
function rewriteOrganized(rest: string): string {
  const count = COUNT_PATTERN.exec(rest);
  if (count) {
    const cleanRest = stripTrailingPrepositions(rest.replace(count[0], "").replace(/\s+/g, " "));
    const subject = cleanRest || "the event";
    return `Coordinated logistics for ${subject}, managing ${count[1]}+ participants.`;
  }
  return `Coordinated logistics for ${stripTrailingPrepositions(rest)}.`;
}

/** "edited N videos" → "Produced and edited N videos." */
function rewriteEdited(rest: string): string {
  return `Produced and edited ${stripTrailingPrepositions(rest)}.`;
}

/** "got N% in X" → "Achieved N% in X." */
function rewriteGot(rest: string): string {
  return `Achieved ${stripTrailingPrepositions(rest)}.`;
}

/** "helped with X" → "Supported delivery of X." */
function rewriteHelped(rest: string): string {
  return `Supported delivery of ${stripTrailingPrepositions(rest)}.`;
}

export function polishNotes(rawNotes: string): string[] {
  const clauses = splitClauses(rawNotes);
  const bullets: string[] = [];

  for (let i = 0; i < clauses.length && bullets.length < 3; i++) {
    // Strip leading first-person pronouns before routing
    const clause = clauses[i].replace(/^(?:i|we|they|my)\s+/i, "");
    const lower = clause.toLowerCase().trim();
    let bullet: string;

    if (/^organi[sz]ed\s+/.test(lower)) {
      bullet = rewriteOrganized(clause.replace(/^organi[sz]ed\s+/i, ""));
    } else if (/^(?:edited|made)\s+/.test(lower)) {
      // "edited N videos" → "Produced and edited N videos."
      bullet = rewriteEdited(clause.replace(/^(?:edited|made)\s+/i, ""));
    } else if (/^(?:got|scored|achieved)\s+\d+%/.test(lower)) {
      // "got 88% in X" → "Achieved 88% in X."
      bullet = rewriteGot(clause.replace(/^(?:got|scored|achieved)\s+/i, ""));
    } else if (/^helped\s+/.test(lower)) {
      // "helped organize X" → organized rewrite; "helped with X" → "Supported delivery of X."
      const afterHelped = clause.replace(/^helped\s+/i, "");
      if (/^(?:to\s+)?organi[sz]e\s+/i.test(afterHelped)) {
        bullet = rewriteOrganized(afterHelped.replace(/^(?:to\s+)?organi[sz]e\s+/i, ""));
      } else {
        bullet = rewriteHelped(afterHelped.replace(/^with\s+/i, ""));
      }
    } else {
      // Default: rewrite a weak opening, otherwise prepend a strong verb
      const rewrite = rewriteWeakVerb(clause);
      bullet = rewrite !== null ? `${rewrite}.` : `${forceStrongVerbStart(clause)}.`;
    }

    bullets.push(bullet);
  }

  // Pad to 3 bullets
  while (bullets.length < 3) {
    bullets.push(
      "Developed skills in project management through academic coursework and extracurricular activities."
    );
  }

  // Cap at 3
  const result = bullets.slice(0, 3).map((b) => {
    let s = b.trim();
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (!s.endsWith(".")) s += ".";
    return s;
  });

  return result;
}

// ---------------------------------------------------------------------------
// computeAts
// ---------------------------------------------------------------------------

function getResumeText(resume: ResumeData): string {
  const parts: string[] = [
    ...Object.values(resume.identity),
    ...resume.experience.bullets,
    ...resume.skills.tech,
    ...resume.skills.soft,
    ...resume.projects.entries.map((e) => e.description),
  ];
  return parts.join(" ").toLowerCase();
}

function computeActionVerbScore(bullets: string[]): number {
  if (bullets.length === 0) return 0;
  const strongCount = bullets.filter((b) => {
    const firstWord = b.trim().split(/\s+/)[0] ?? "";
    return isStrongVerb(firstWord);
  }).length;
  return Math.round((strongCount / bullets.length) * 100);
}

function computeFormattingScore(resume: ResumeData): number {
  let score = 100;
  if (!resume.identity.name) score -= 15;
  if (!resume.identity.email) score -= 10;
  if (resume.experience.bullets.length === 0) score -= 10;
  if (resume.experience.bullets.some((b) => b.split(/\s+/).length > 30)) score -= 10;
  if (resume.experience.bullets.some((b) => !b.trim().endsWith("."))) score -= 10;
  if (resume.skills.tech.length === 0) score -= 10;
  if (resume.projects.academics.length === 0) score -= 5;
  return Math.max(0, Math.min(100, score));
}

/** Whole-token/phrase matching — "Git" must not match "digital", but "Data Visualization" matches as a phrase. */
function keywordMatches(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function computeKeywordScore(resume: ResumeData): number {
  const text = getResumeText(resume);
  const targetRole = resume.identity.targetRole.toLowerCase();
  const keywords = findRoleKeywords(targetRole);
  if (keywords.length === 0) return 0;
  const matched = keywords.filter((kw) => keywordMatches(text, kw)).length;
  return Math.round((matched / keywords.length) * 100);
}

export function computeAts(resume: ResumeData, mode: RecruiterMode): AtsResult {
  const formatting = computeFormattingScore(resume);
  const actionVerbs = computeActionVerbScore(resume.experience.bullets);
  const keywords = computeKeywordScore(resume);

  let impactScore: number;
  switch (mode) {
    case "startup":
      impactScore = actionVerbs * 0.4 + keywords * 0.35 + formatting * 0.25;
      break;
    case "university":
      impactScore = formatting * 0.5 + actionVerbs * 0.25 + keywords * 0.25;
      break;
    case "corporate":
      impactScore = actionVerbs * 0.35 + keywords * 0.35 + formatting * 0.3;
      break;
  }

  return {
    impactScore: Math.round(impactScore),
    breakdown: {
      formatting,
      actionVerbs,
      keywords,
    },
  };
}

// ---------------------------------------------------------------------------
// generateFeedback
// ---------------------------------------------------------------------------

function modePrefix(mode: RecruiterMode): string {
  switch (mode) {
    case "startup":
      return "s";
    case "corporate":
      return "c";
    case "university":
      return "u";
  }
}

export function generateFeedback(resume: ResumeData, mode: RecruiterMode): FeedbackItem[] {
  const items: FeedbackItem[] = [];
  const prefix = modePrefix(mode);

  const allText = [
    ...resume.experience.bullets,
    resume.experience.rawNotes,
    ...resume.skills.tech,
    ...resume.skills.soft,
  ]
    .join(" ")
    .toLowerCase();

  // --- Cliché warning ---
  const foundCliché = CLICHE_WORDS.find((c) => allText.includes(c));
  if (foundCliché) {
    items.push({
      id: `${prefix}-cliche-${foundCliché}`,
      kind: "warning",
      message: `"${foundCliché}" is a cliché. Replace with a concrete achievement.`,
      fixLabel: "Auto-Fix: Replace cliché",
      fixType: "cliche",
    });
  }

  // --- Weak verb warning ---
  for (const bullet of resume.experience.bullets) {
    const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    if ((WEAK_VERBS as readonly string[]).includes(firstWord)) {
      items.push({
        id: `${prefix}-weakverb-${firstWord}`,
        kind: "warning",
        message: `Start bullet with a strong action verb: 'led', 'built', 'designed'...`,
        fixLabel: "Auto-Fix: Strengthen verb",
        fixType: "weakverb",
      });
      break; // one warning is enough
    }
  }

  // --- Action verb strength tip ---
  const avScore = computeActionVerbScore(resume.experience.bullets);
  if (avScore < 70) {
    const messages: Record<RecruiterMode, string> = {
      startup: "Most bullets should start with strong action verbs. Recruiters scan for impact words.",
      corporate: "Consider revising bullet points to begin with strong action verbs for greater impact.",
      university: "Try starting each bullet with a strong action verb to showcase your contributions.",
    };
    items.push({
      id: `${prefix}-av-tip`,
      kind: "tip",
      message: messages[mode],
      fixLabel: "Auto-Fix: Strengthen verbs",
      fixType: "actionverbs",
    });
  }

  // --- Keyword density tip ---
  const keywordScore = computeKeywordScore(resume);
  if (keywordScore < 50) {
    const targetRole = resume.identity.targetRole;
    const keywords = findRoleKeywords(targetRole);
    const text = getResumeText(resume);
    const missing = keywords.filter((kw) => !keywordMatches(text, kw)).slice(0, 2);
    if (missing.length > 0) {
      items.push({
        id: `${prefix}-kw-tip`,
        kind: "tip",
        message: `You haven't listed skills recruiters expect for ${targetRole}. Consider adding: ${missing.join(", ")}`,
        fixLabel: "Auto-Fix: Add keyword pill",
        fixType: "keywords",
      });
    }
  }

  // --- GitHub tip for developer/engineer roles ---
  const targetLower = resume.identity.targetRole.toLowerCase();
  if (
    (targetLower.includes("developer") || targetLower.includes("engineer")) &&
    !resume.identity.github
  ) {
    items.push({
      id: `${prefix}-github-tip`,
      kind: "tip",
      message: `No GitHub link detected for a ${resume.identity.targetRole} target. Add one to showcase your work.`,
      fixLabel: "Auto-Fix: Add GitHub link",
      fixType: "github",
    });
  }

  // --- Formatting tip ---
  const formattingScore = computeFormattingScore(resume);
  if (formattingScore < 80) {
    const messages: Record<RecruiterMode, string> = {
      startup: "Bullets should be punchy — keep them under 30 words and end with periods.",
      corporate:
        "Improve formatting: keep bullets under 30 words and ensure they end with periods for a professional look.",
      university:
        "Well-formatted bullets are easier for admissions officers to read. Keep them concise with periods.",
    };
    items.push({
      id: `${prefix}-fmt-tip`,
      kind: "tip",
      message: messages[mode],
      fixLabel: "Auto-Fix: Improve formatting",
      fixType: "formatting",
    });
  }

  // --- No metrics warning ---
  const allBulletsHaveNumbers = resume.experience.bullets.every((b) => /\d/.test(b));
  if (resume.experience.bullets.length > 0 && !allBulletsHaveNumbers) {
    items.push({
      id: `${prefix}-metrics-warn`,
      kind: "warning",
      message:
        "No numbers found in your bullets. Quantify: 'managed 200+ students', 'grew channel to 1K subscribers'",
      fixLabel: "Auto-Fix: Add metric",
      fixType: "metrics",
    });
  }

  // --- University mode: academics tip ---
  if (mode === "university" && resume.projects.academics.length === 0) {
    items.push({
      id: `${prefix}-acad-tip`,
      kind: "tip",
      message:
        "Admissions officers look for academics — add your FSc/A-Level scores.",
      fixLabel: "Auto-Fix: Add academic entry",
      fixType: "academics",
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// applyAutoFix
// ---------------------------------------------------------------------------

const CLICHE_REPLACEMENTS: Record<string, string> = {
  hardworking: "consistently delivered",
  passionate: "deeply committed to",
  "team player": "collaborated across teams",
  dedicated: "consistently committed to",
  "self-motivated": "independently drove",
  "go-getter": "proactively pursued",
  "fast learner": "quickly mastered",
};

/**
 * Mode-appropriate outcome framing. Honesty rule: only ever appended to a
 * bullet that ALREADY contains a number — never fabricated on its own.
 */
const OUTCOME_SUFFIXES: Record<RecruiterMode, string> = {
  startup: "driving measurable growth",
  university: "demonstrating strong commitment",
  corporate: "supporting business outcomes",
};

/** Cliché fix: rewrite bullets/rawNotes AND scrub the cliché pill from skills. */
function fixCliche(result: ResumeData): ResumeData {
  const allText = [
    result.experience.bullets.join("\n"),
    result.experience.rawNotes,
    ...result.skills.tech,
    ...result.skills.soft,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  const found = CLICHE_WORDS.find((c) => allText.includes(c));
  if (!found) return result;
  const replacement = CLICHE_REPLACEMENTS[found] ?? "delivered measurable results";
  const esc = found.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(esc, "gi");
  result.experience.bullets = result.experience.bullets.map((b) => b.replace(re, replacement));
  result.experience.rawNotes = result.experience.rawNotes.replace(re, replacement);
  const scrubSkill = (s: string) => s.replace(re, "").replace(/^\s+|\s+$/g, "");
  result.skills.tech = result.skills.tech.map(scrubSkill).filter(Boolean);
  result.skills.soft = result.skills.soft.map(scrubSkill).filter(Boolean);
  return result;
}

/** Weak-verb fix: rewrite the first bullet that opens with a weak verb/phrase. */
function fixWeakVerb(result: ResumeData): ResumeData {
  for (let i = 0; i < result.experience.bullets.length; i++) {
    const rewritten = rewriteWeakVerb(result.experience.bullets[i]);
    if (rewritten !== null) {
      result.experience.bullets[i] = rewritten;
      break;
    }
  }
  return result;
}

/** Action-verb fix: same weak-verb rewrite first; otherwise force a strong-verb opener. */
function fixActionVerbs(result: ResumeData): ResumeData {
  for (let i = 0; i < result.experience.bullets.length; i++) {
    const rewritten = rewriteWeakVerb(result.experience.bullets[i]);
    if (rewritten !== null) {
      result.experience.bullets[i] = rewritten;
      return result;
    }
  }
  for (let i = 0; i < result.experience.bullets.length; i++) {
    const bullet = result.experience.bullets[i].trim();
    if (!bullet) continue;
    const firstWord = bullet.split(/\s+/)[0] ?? "";
    if (!isStrongVerb(firstWord)) {
      result.experience.bullets[i] = `${forceStrongVerbStart(bullet)}.`;
      break;
    }
  }
  return result;
}

function fixKeywords(result: ResumeData): ResumeData {
  const keywords = findRoleKeywords(result.identity.targetRole);
  const current = new Set(result.skills.tech.map((s) => s.toLowerCase()));
  const missing = keywords.find((kw) => !current.has(kw.toLowerCase()));
  if (missing) {
    result.skills.tech.push(missing);
  }
  return result;
}

/**
 * Metrics fix: only frame numbers that already exist — append a mode-appropriate
 * outcome to the first bullet that has a real number but no outcome framing.
 */
function fixMetrics(result: ResumeData, mode: RecruiterMode): ResumeData {
  const suffix = OUTCOME_SUFFIXES[mode];
  for (let i = 0; i < result.experience.bullets.length; i++) {
    const bullet = result.experience.bullets[i].trim();
    if (!bullet) continue;
    if (/\d/.test(bullet) && !bullet.includes(suffix)) {
      result.experience.bullets[i] = `${bullet.replace(/\.$/, "")}, ${suffix}.`;
      break;
    }
  }
  return result;
}

export function applyAutoFix(
  resume: ResumeData,
  feedback: FeedbackItem,
  mode: RecruiterMode
): ResumeData {
  const result: ResumeData = JSON.parse(JSON.stringify(resume));

  switch (feedback.fixType) {
    case "cliche":
      return fixCliche(result);
    case "weakverb":
      return fixWeakVerb(result);
    case "actionverbs":
      return fixActionVerbs(result);
    case "keywords":
      return fixKeywords(result);
    case "github":
      result.identity.github = "https://github.com/your-handle";
      return result;
    case "metrics":
      return fixMetrics(result, mode);
    case "formatting":
      result.experience.bullets = result.experience.bullets.map((b) => {
        const words = b.split(/\s+/);
        return words.length > 30 ? words.slice(0, 30).join(" ") + "..." : b;
      });
      return result;
    case "academics":
      if (
        !result.projects.academics.some(
          (a) => a.degree === "FSc Pre-Medical" && a.institution === "Your College"
        )
      ) {
        result.projects.academics.push({
          degree: "FSc Pre-Medical",
          institution: "Your College",
          score: "85%",
          years: "2024-2026",
        });
      }
      return result;
    default:
      return result;
  }
}

// ---------------------------------------------------------------------------
// rewriteBullet & makeQuantifiable — canvas hover-to-rewrite (Task 3)
// ---------------------------------------------------------------------------

/**
 * Single-bullet AI rewrite: replace clichés, then fix a weak-verb opener.
 * Honesty rules: never invents content (clichés are replaced with mapped
 * phrasing, weak verbs with the same rewrites as the polish engine) and the
 * output is deterministic. Returns the input unchanged when there is nothing
 * to improve.
 */
export function rewriteBullet(bullet: string): string {
  const lower = bullet.toLowerCase();
  const found = CLICHE_WORDS.find((c) => lower.includes(c));
  let result = bullet;
  if (found) {
    const replacement = CLICHE_REPLACEMENTS[found] ?? "delivered measurable results";
    const escaped = found.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), replacement);
  }
  const rewritten = rewriteWeakVerb(result);
  if (rewritten !== null) result = rewritten;
  return result === bullet ? bullet : result;
}

/**
 * Single-bullet quantifier: appends a mode-appropriate outcome ONLY when the
 * bullet already contains a number and lacks the outcome phrasing. Returns
 * the input unchanged otherwise — numbers are framed, never fabricated.
 */
export function makeQuantifiable(bullet: string, mode: RecruiterMode): string {
  const trimmed = bullet.trim();
  if (!/\d/.test(trimmed)) return bullet;
  const suffix = OUTCOME_SUFFIXES[mode];
  if (trimmed.includes(suffix)) return bullet;
  return `${trimmed.replace(/\.$/, "")}, ${suffix}.`;
}

// ---------------------------------------------------------------------------
// suggestSkills
// ---------------------------------------------------------------------------

export function suggestSkills(targetRole: string, current: string[]): string[] {
  const keywords = findRoleKeywords(targetRole);
  const currentLower = new Set(current.map((s) => s.toLowerCase()));
  const filtered = keywords.filter((kw) => !currentLower.has(kw.toLowerCase()));
  return filtered.slice(0, 4);
}
