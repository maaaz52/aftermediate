export const TONE_META = [
  { id: "loved", label: "Loved it", icon: "Laugh", color: "#10B981" },
  { id: "liked", label: "Liked it", icon: "Smile", color: "#3B82F6" },
  { id: "meh", label: "Meh", icon: "Meh", color: "#d99a2b" },
  { id: "disappointed", label: "Disappointed", icon: "Frown", color: "#f97316" },
  { id: "frustrated", label: "Frustrated", icon: "Angry", color: "#d63d3d" },
] as const;

export type ToneId = (typeof TONE_META)[number]["id"];

export const PERSONAS = [
  { id: "students", label: "Students" },
  { id: "professionals", label: "Professionals" },
  { id: "beginners", label: "Beginners" },
  { id: "educators", label: "Educators" },
] as const;
export type PersonaId = (typeof PERSONAS)[number]["id"];

export const PRIORITIES = [
  { id: "p0", label: "P0 — Must have" },
  { id: "p1", label: "P1 — Should have" },
  { id: "p2", label: "P2 — Nice to have" },
] as const;
export type PriorityId = (typeof PRIORITIES)[number]["id"];

export type SentimentTag = "highly-positive" | "positive" | "constructive" | "critical";
export type SentimentResult = { tag: SentimentTag; score: number; summary: string };

const POSITIVE_WORDS = ["amazing", "awesome", "great", "love", "loved", "excellent", "fantastic", "incredible", "helpful", "best"];
const NEGATIVE_WORDS = ["bad", "terrible", "awful", "worst", "hate", "broke", "broken", "confusing", "useless", "disappointing"];
const CONSTRUCTIVE_CUES = ["could improve", "suggestion", "maybe", "but", "however", "would be better"];

const TONE_BASE: Record<ToneId, number> = {
  loved: 85,
  liked: 70,
  meh: 50,
  disappointed: 30,
  frustrated: 15,
};

export function analyzeSentiment(tone: ToneId, rating: number, text = ""): SentimentResult {
  let score = TONE_BASE[tone] + Math.round(((rating - 5) / 5) * 20);
  const lower = text.toLowerCase();
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) score += 4;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) score -= 6;
  if (CONSTRUCTIVE_CUES.some((c) => lower.includes(c))) score -= 5;
  score = Math.max(0, Math.min(100, score));
  const tag: SentimentTag = score >= 85 ? "highly-positive" : score >= 60 ? "positive" : score >= 40 ? "constructive" : "critical";
  return { tag, score, summary: summarize(tone, rating, text) };
}

function summarize(tone: ToneId, rating: number, text: string): string {
  if (rating >= 8 || rating <= 3) return `Rated ${rating}/10`;
  const lower = text.toLowerCase();
  const hit = [...POSITIVE_WORDS, ...NEGATIVE_WORDS].find((w) => lower.includes(w));
  if (hit) {
    const words = text.trim().split(/\s+/);
    const idx = words.findIndex((w) => w.toLowerCase().includes(hit));
    if (idx >= 0) return words.slice(idx, idx + 8).join(" ");
  }
  return `Shared a ${tone} experience`;
}

export const MEDIA_RULES = {
  image: { maxBytes: 5 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp", "image/gif"] },
  video: { maxBytes: 25 * 1024 * 1024, types: ["video/mp4", "video/webm"] },
  audio: { maxBytes: 25 * 1024 * 1024, types: ["audio/mpeg", "audio/webm", "audio/wav"] },
} as const;
export type MediaKind = keyof typeof MEDIA_RULES;

export function mediaKindFor(file: Pick<File, "type">): MediaKind | null {
  const t = file.type;
  if ((MEDIA_RULES.image.types as readonly string[]).includes(t)) return "image";
  if ((MEDIA_RULES.video.types as readonly string[]).includes(t)) return "video";
  if ((MEDIA_RULES.audio.types as readonly string[]).includes(t)) return "audio";
  return null;
}

export function validateMedia(file: File): { ok: true } | { ok: false; error: string } {
  const kind = mediaKindFor(file);
  if (!kind) return { ok: false, error: `Unsupported file type${file.type ? ` (${file.type})` : ""}` };
  const limit = MEDIA_RULES[kind].maxBytes / (1024 * 1024);
  if (file.size > MEDIA_RULES[kind].maxBytes) return { ok: false, error: `${kind} files must be ${limit}MB or smaller` };
  return { ok: true };
}

export const CLOSINGS: Record<ToneId, string> = {
  loved: "Thank you — your excitement means the world to us.",
  liked: "Thank you — we're glad it landed well.",
  meh: "Thanks for the honesty — that's exactly what helps us improve.",
  disappointed: "We're sorry it fell short — thank you for telling us.",
  frustrated: "We hear you, and we're sorry. Thank you for speaking up.",
};
