/**
 * ============================================================
 *  RETRIEVAL FOR THE GROUNDED CHATBOTS
 * ============================================================
 *  Instead of inlining a whole knowledge base into every system
 *  prompt, we score the corpus with BM25 and hand the model only
 *  the facts that match the question it was actually asked.
 *
 *  Two ways to improve a bot's aim without touching code paths:
 *  1. Edit the knowledge bases (src/data/*-chatbot-knowledge.ts).
 *  2. Edit ALIAS below — synonyms that let a paraphrase reach a
 *     fact whose wording it does not share.
 *
 *  This module is pure: no AI SDK, no Supabase, no next/*.
 */

import {
  abroadChatbotKnowledge,
  type KnowledgeTopic,
} from "@/data/abroad-chatbot-knowledge";
import { pakistanChatbotKnowledge } from "@/data/pakistan-chatbot-knowledge";
import { skillsChatbotKnowledge } from "@/data/skills-chatbot-knowledge";
import type { Persona } from "@/lib/chat-request";

export interface RetrievedFact {
  topicId: string;
  topicTitle: string;
  text: string;
  source: string;
}

export interface IndexedFact extends RetrievedFact {
  id: string;
  freq: Map<string, number>;
  length: number;
}

export interface RetrievalOptions {
  k?: number;
  minScore?: number;
}

/**
 * Paraphrase bridge: a user says "park cash", the fact says "blocked account".
 * These terms are appended to every fact in the topic, so the index derives
 * them from here at load time — no rebuild, no cache to invalidate.
 */
export const ALIAS: Record<string, string[]> = {
  // abroad
  "visa-process": ["processing time", "how long", "embassy", "appointment", "timeline", "apply"],
  documents: ["paperwork", "required docs", "certificate", "transcript", "checklist", "requirements"],
  "bank-statements": ["cash", "park", "show money", "balance", "funds", "afford", "savings", "sponsor account"],
  "money-questions": ["expensive", "budget", "living cost", "afford", "tuition fee", "cheap", "salary"],
  tests: ["exam", "language test", "score", "ielts", "toefl", "pte", "duolingo", "sat", "gre"],
  scholarships: ["funding", "fully funded", "grant", "stipend", "deadline", "apply", "sponsorship"],
  interviews: ["visa interview", "interview questions", "embassy interview", "screening"],
  "country-notes": ["which country", "post study work", "work while studying", "job after graduation", "cheap destination"],
  "scams-safety": ["agent", "fraud", "scam", "guaranteed", "fake offer", "trustworthy", "verification"],
  "ivy-league": ["harvard", "yale", "princeton", "acceptance rate", "financial aid", "need blind", "usa ranking"],
  // freelancing
  "zero-to-start": ["beginner", "start from scratch", "no experience", "free course", "first step"],
  "choosing-a-skill": ["which skill", "best skill", "in demand", "marketable", "what should i learn"],
  "building-a-portfolio": ["portfolio", "samples", "showcase", "work examples", "client ready"],
  "portfolio-projects": ["project idea", "practice project", "build something", "starter"],
  "portfolio-hosting": ["host", "deploy", "free domain", "github pages", "netlify", "vercel", "live site"],
  "pricing-basics": ["how much to charge", "quote", "hourly", "fixed price", "rate card", "undercharge"],
  "pricing-rates-pakistan": ["rate", "price", "usd", "pkr", "how much", "market rate", "logo cost"],
  "pricing-strategies": ["value based", "package", "bundle", "retainer", "monthly income", "raise rates"],
  "getting-paid": ["withdraw", "receive money", "payoneer", "wise", "paypal", "bank transfer", "payout"],
  "payment-fees": ["fees", "commission", "deduction", "exchange margin", "hidden cost", "percent cut"],
  "fbr-taxes": ["tax", "ntn", "filer", "income tax", "declaration", "tax return", "pseb"],
  "client-acquisition": ["proposal", "bid", "upwork profile", "win jobs", "get clients", "first gig"],
  "client-communication": ["scope", "revision", "contract terms", "client talk", "expectations"],
  "contracts-and-payments": ["contract", "deposit", "milestone", "upfront payment", "escrow", "agreement"],
  "difficult-clients": ["not paying", "late payment", "ghosting", "dispute", "unpaid invoice", "creep"],
  "scams-to-avoid": ["fake client", "registration fee", "scam", "advance fee", "phishing", "otp"],
  "time-management": ["balance studies", "exam season", "schedule", "burnout", "study and work", "hours"],
  // study in pakistan
  "choosing-where-to-apply": ["public or private", "which university", "shortlist", "hostel", "worth the fee", "government university"],
  "merit-strategy": ["aggregate", "closing merit", "merit list", "did not get admission", "missed merit", "repeat", "second list"],
  "scholarship-strategy": ["how to get scholarship", "financial aid office", "income certificate", "documents", "rejected", "stipend"],
  "admission-safety": ["recognised", "hec verified", "fake university", "agent", "scam", "attestation", "affiliated"],
};

const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "all", "also", "an", "and", "any", "are", "as", "at",
  "be", "because", "been", "before", "being", "between", "both", "but", "by", "can", "could",
  "do", "does", "for", "from", "had", "has", "have", "how", "i", "if", "in", "into", "is", "it",
  "its", "me", "more", "most", "much", "my", "no", "nor", "not", "of", "on", "or", "our", "so",
  "some", "such", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this",
  "to", "us", "was", "we", "were", "what", "when", "where", "which", "who", "why", "will", "with",
  "would", "you", "your",
]);

const K1 = 1.2;
const B = 0.75;
const TITLE_BOOST = 3;
const ID_BOOST = 2;
const DEFAULT_K = 8;
const DEFAULT_MIN_SCORE = 0.5;

export interface KnowledgeBase {
  updatedAt: string;
  topics: KnowledgeTopic[];
}

export const KNOWLEDGE_BASES: Partial<Record<Persona, KnowledgeBase>> = {
  safar: abroadChatbotKnowledge,
  hunar: skillsChatbotKnowledge,
  manzil: pakistanChatbotKnowledge,
};

function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(ches|shes|xes|zes)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
}

function repeat(tokens: string[], times: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < times; i++) out.push(...tokens);
  return out;
}

function toDoc(topic: KnowledgeTopic, text: string, source: string, index: number): IndexedFact {
  const terms = [
    ...tokenize(text),
    ...repeat(tokenize(topic.title), TITLE_BOOST),
    ...repeat(tokenize(topic.id), ID_BOOST),
    ...(ALIAS[topic.id] ?? []).flatMap(tokenize),
  ];
  const freq = new Map<string, number>();
  for (const term of terms) freq.set(term, (freq.get(term) ?? 0) + 1);
  return {
    id: `${topic.id}#${index}`,
    topicId: topic.id,
    topicTitle: topic.title,
    text,
    source,
    freq,
    length: terms.length,
  };
}

interface Corpus {
  docs: IndexedFact[];
  df: Map<string, number>;
  avgdl: number;
}

const EMPTY_CORPUS: Corpus = { docs: [], df: new Map(), avgdl: 0 };
const cache = new Map<Persona, Corpus>();

function corpus(persona: Persona): Corpus {
  const cached = cache.get(persona);
  if (cached) return cached;

  const kb = KNOWLEDGE_BASES[persona];
  if (!kb) {
    cache.set(persona, EMPTY_CORPUS);
    return EMPTY_CORPUS;
  }

  const docs: IndexedFact[] = [];
  for (const topic of kb.topics) {
    topic.facts.forEach((fact, i) => docs.push(toDoc(topic, fact.text, fact.source, i)));
  }

  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of doc.freq.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const totalLength = docs.reduce((n, doc) => n + doc.length, 0);
  const built: Corpus = { docs, df, avgdl: docs.length ? totalLength / docs.length : 0 };
  cache.set(persona, built);
  return built;
}

export function buildIndex(persona: Persona): IndexedFact[] {
  return corpus(persona).docs;
}

function idf(c: Corpus, term: string): number {
  const df = c.df.get(term) ?? 0;
  if (df === 0) return 0;
  return Math.log(1 + (c.docs.length - df + 0.5) / (df + 0.5));
}

export function retrieveFacts(
  persona: Persona,
  query: string,
  options: RetrievalOptions = {}
): { facts: RetrievedFact[]; covered: boolean } {
  const k = options.k ?? DEFAULT_K;
  const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
  const c = corpus(persona);
  const queryTerms = [...new Set(tokenize(query))];
  if (c.docs.length === 0 || queryTerms.length === 0) return { facts: [], covered: false };

  // One accidental word match is not evidence the corpus covers the question;
  // requiring two keeps off-domain chat out of the grounding block.
  const requiredMatches = Math.min(2, queryTerms.length);
  const scored: { doc: IndexedFact; score: number }[] = [];

  for (const doc of c.docs) {
    let matched = 0;
    let score = 0;
    for (const term of queryTerms) {
      const tf = doc.freq.get(term);
      if (!tf) continue;
      matched += 1;
      score +=
        idf(c, term) * ((tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * doc.length) / c.avgdl)));
    }
    if (matched >= requiredMatches && score >= minScore) scored.push({ doc, score });
  }

  scored.sort((a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id));
  const facts = scored
    .slice(0, k)
    .map(({ doc }): RetrievedFact => ({
      topicId: doc.topicId,
      topicTitle: doc.topicTitle,
      text: doc.text,
      source: doc.source,
    }));
  return { facts, covered: facts.length > 0 };
}

export function buildRetrievalQuery(
  messages: { role: "user" | "assistant"; content: string }[]
): string {
  return messages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content)
    .join(" ");
}

export function retrieveForMessages(
  persona: Persona,
  messages: { role: "user" | "assistant"; content: string }[]
): { facts: RetrievedFact[]; covered: boolean } {
  if (!KNOWLEDGE_BASES[persona]) return { facts: [], covered: false };
  return retrieveFacts(persona, buildRetrievalQuery(messages));
}

export function formatFacts(facts: RetrievedFact[]): string {
  const byTopic = new Map<string, string[]>();
  for (const fact of facts) {
    const lines = byTopic.get(fact.topicTitle) ?? [];
    lines.push(`- ${fact.text} [source: ${fact.source}]`);
    byTopic.set(fact.topicTitle, lines);
  }
  return [...byTopic.entries()]
    .map(([title, lines]) => `## ${title}\n${lines.join("\n")}`)
    .join("\n\n");
}
