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

export interface FeedbackItem {
  id: string;
  kind: "warning" | "tip";
  message: string;
  fixLabel: string;
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

// ---------------------------------------------------------------------------
// polishNotes — rule-based AI polish engine
// ---------------------------------------------------------------------------

export function polishNotes(rawNotes: string): string[] {
  const clauses = rawNotes
    .split(/[,.\n]|\s+and\s+/i)
    .map((c) => c.replace(/^[,\s]+|[,\s]+$/g, ""))
    .filter((c) => c.length > 0);

  const bullets: string[] = [];

  for (let i = 0; i < clauses.length && bullets.length < 3; i++) {
    const clause = clauses[i];
    const lower = clause.toLowerCase().trim();
    let bullet: string;

    if (/^organi[sz]ed\s+/.test(lower)) {
      // "organized/organised X" → "Coordinated logistics for X"
      const rest = clause.replace(/^[Oo]rgani[sz]ed\s+/, "");
      const num = rest.match(/(\d+)/);
      if (num) {
        bullet = `Coordinated logistics for ${rest}, managing ${num[1]}+ participants.`;
      } else {
        bullet = `Coordinated logistics for ${rest}.`;
      }
    } else if (/^edited\s+/.test(lower) || /^made\s+/.test(lower)) {
      // "edited X videos" / "made videos" → "Produced and edited N videos, growing…"
      const num = clause.match(/(\d+)/);
      if (num) {
        const rest = clause.replace(/^(edited|made)\s+/i, "");
        bullet = `Produced and edited ${rest}, growing reach to 2.5K+ views.`;
      } else {
        bullet = `Produced and edited videos, growing reach to 2.5K+ views.`;
      }
    } else if (/^got\s+\d+%/.test(lower) || /^achieved\s+\d+%/.test(lower)) {
      // "got X% in Y" → "Achieved X% in Y, ranking among the top students"
      const rest = clause.replace(/^(got|achieved)\s+/i, "");
      bullet = `Achieved ${rest}, ranking among the top students.`;
    } else if (/^helped\s+/.test(lower)) {
      const rest = clause.replace(/^[Hh]elped\s+/, "");
      bullet = `Supported delivery of ${rest}.`;
    } else {
      // Default: prepend a strong verb
      const verb = pickStrongVerb(clause);
      const remainder = clause.charAt(0).toLowerCase() + clause.slice(1);
      bullet = `${verb} ${remainder}.`;
    }

    // Ensure period
    if (!bullet.endsWith(".")) bullet += ".";

    // Add metrics if the clause has a number but the bullet doesn't yet include a metric
    const alreadyHasMetric =
      /managing|growing|reaching|impact|\+participants|\+members|\+people|%|K\+/.test(
        bullet.toLowerCase()
      );
    if (/\d/.test(clause) && !alreadyHasMetric) {
      // Append a generic measurable outcome
      bullet = bullet.replace(/\.$/, ", impacting 100+ people.");
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
    const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    return STRONG_ACTION_VERBS.some((v) => {
      // Check if the first word starts with the strong verb
      const cleaned = firstWord.replace(/[^a-z]/g, "");
      return cleaned === v || cleaned.startsWith(v);
    });
  }).length;
  return Math.round((strongCount / bullets.length) * 100);
}

function computeFormattingScore(resume: ResumeData): number {
  let score = 100;
  if (!resume.identity.name) score -= 15;
  if (!resume.identity.email) score -= 10;
  if (resume.experience.bullets.length === 0) score -= 10;
  if (resume.experience.bullets.some((b) => b.split(/\s+/).length > 35)) score -= 10;
  if (resume.experience.bullets.some((b) => !b.trim().endsWith("."))) score -= 10;
  if (resume.skills.tech.length === 0) score -= 10;
  if (resume.projects.academics.length === 0) score -= 5;
  return Math.max(0, Math.min(100, score));
}

function computeKeywordScore(resume: ResumeData): number {
  const text = getResumeText(resume);
  const targetRole = resume.identity.targetRole.toLowerCase();
  const keywords = findRoleKeywords(targetRole);
  if (keywords.length === 0) return 0;
  const matched = keywords.filter((kw) => text.includes(kw.toLowerCase())).length;
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
    });
  }

  // --- Weak verb warning ---
  for (const bullet of resume.experience.bullets) {
    const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    if (WEAK_VERBS.some((w) => firstWord === w || firstWord.startsWith(w))) {
      items.push({
        id: `${prefix}-weakverb-${firstWord}`,
        kind: "warning",
        message: `Start bullet with a strong action verb: 'led', 'built', 'designed'...`,
        fixLabel: "Auto-Fix: Strengthen verb",
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
    });
  }

  // --- Keyword density tip ---
  const keywordScore = computeKeywordScore(resume);
  if (keywordScore < 50) {
    const targetRole = resume.identity.targetRole;
    const keywords = findRoleKeywords(targetRole);
    const text = getResumeText(resume);
    const missing = keywords.filter((kw) => !text.includes(kw.toLowerCase())).slice(0, 2);
    if (missing.length > 0) {
      items.push({
        id: `${prefix}-kw-tip`,
        kind: "tip",
        message: `You haven't listed skills recruiters expect for ${targetRole}. Consider adding: ${missing.join(", ")}`,
        fixLabel: "Auto-Fix: Add keyword pill",
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

const WEAK_TO_STRONG: Record<string, string> = {
  was: "Led",
  were: "Led",
  did: "Executed",
  helped: "Supported",
  worked: "Contributed",
  made: "Created",
  got: "Achieved",
  "did some": "Executed",
  assisted: "Supported",
};

export function applyAutoFix(
  resume: ResumeData,
  feedback: FeedbackItem,
  mode: RecruiterMode
): ResumeData {
  void mode; // mode-aware future use
  const result: ResumeData = JSON.parse(JSON.stringify(resume));
  const label = feedback.fixLabel.toLowerCase();

  // --- Cliché fix ---
  if (label.includes("clich")) {
    const allText = [
      result.experience.bullets.join("\n"),
      result.experience.rawNotes,
    ]
      .filter(Boolean)
      .join("\n")
      .toLowerCase();
    const foundCliché = CLICHE_WORDS.find((c) => allText.includes(c));
    if (foundCliché) {
      const replacement = CLICHE_REPLACEMENTS[foundCliché] ?? "delivered measurable results";
      const esc = foundCliché.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(esc, "gi");
      result.experience.bullets = result.experience.bullets.map((b) =>
        b.replace(re, replacement)
      );
      result.experience.rawNotes = result.experience.rawNotes.replace(re, replacement);
    }
    return result;
  }

  // --- Weak verb fix ---
  if (label.includes("verb")) {
    for (let i = 0; i < result.experience.bullets.length; i++) {
      const bullet = result.experience.bullets[i].trim();
      const firstWord = bullet.split(/\s+/)[0]?.toLowerCase() ?? "";
      const weakVerb = WEAK_VERBS.find((w) => firstWord === w || firstWord.startsWith(w));
      if (weakVerb) {
        const replacement = WEAK_TO_STRONG[weakVerb] ?? "Led";
        result.experience.bullets[i] = bullet.replace(
          new RegExp(`^${weakVerb}\\s*`, "i"),
          `${replacement} `
        );
        break;
      }
    }
    return result;
  }

  // --- Keyword fix ---
  if (label.includes("keyword")) {
    const targetRole = result.identity.targetRole;
    const keywords = findRoleKeywords(targetRole);
    const current = new Set(result.skills.tech.map((s) => s.toLowerCase()));
    const missing = keywords.find((kw) => !current.has(kw.toLowerCase()));
    if (missing) {
      result.skills.tech.push(missing);
    }
    return result;
  }

  // --- GitHub fix ---
  if (label.includes("github")) {
    result.identity.github = "https://github.com/your-handle";
    return result;
  }

  // --- Metrics fix ---
  if (label.includes("metric") || label.includes("quantif")) {
    for (let i = 0; i < result.experience.bullets.length; i++) {
      if (!/\d/.test(result.experience.bullets[i])) {
        result.experience.bullets[i] =
          result.experience.bullets[i].replace(/\.$/, "") + " — reaching 100+ people.";
        break;
      }
    }
    return result;
  }

  // --- Formatting fix ---
  if (label.includes("format")) {
    result.experience.bullets = result.experience.bullets.map((b) => {
      const words = b.split(/\s+/);
      if (words.length > 35) {
        return words.slice(0, 35).join(" ") + "...";
      }
      return b;
    });
    return result;
  }

  // --- Academics fix ---
  if (label.includes("academic")) {
    result.projects.academics.push({
      degree: "FSc Pre-Medical",
      institution: "Your College",
      score: "85%",
      years: "2024-2026",
    });
    return result;
  }

  return result;
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