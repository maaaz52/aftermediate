import { generateText } from "ai";
import { NextResponse } from "next/server";
import { model, AI_MAX_RETRIES, AI_TIMEOUT_MS, parseStructuredJson } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  isTranslatableText,
  normalizeTranslations,
  TRANSLATION_BATCH_MAX_CHARS,
  TRANSLATION_BATCH_MAX_ITEMS,
} from "@/lib/translation";

const RATE_WINDOW_MS = 15 * 60_000;
const RATE_MAX = 48;

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }
  if (!(await checkRateLimit(`translate:${clientKey(request)}`, RATE_MAX, RATE_WINDOW_MS))) {
    return NextResponse.json({ error: "Translation is temporarily busy. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const texts = body && typeof body === "object" && "texts" in body ? body.texts : null;
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > TRANSLATION_BATCH_MAX_ITEMS ||
    !texts.every((value) => typeof value === "string" && isTranslatableText(value))) {
    return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
  }
  if (texts.reduce((total, text) => total + text.length, 0) > TRANSLATION_BATCH_MAX_CHARS) {
    return NextResponse.json({ error: "Translation request is too large." }, { status: 413 });
  }

  const source = Object.fromEntries(texts.map((text, index) => [String(index), text]));
  try {
    const { text } = await generateText({
      model,
      system: [
        "You are a precise English-to-Urdu translator for a Pakistani student guidance website.",
        "Translate into natural Urdu written in Urdu script. Preserve brand names, university names, course codes, abbreviations, URLs, emails, numbers, dates, currency values, and all technical identifiers exactly.",
        "Do not add explanations, markdown, or new information. Return only one valid JSON object with the exact same numeric keys and translated string values.",
      ].join(" "),
      prompt: JSON.stringify(source),
      maxRetries: AI_MAX_RETRIES,
      abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
    const parsed = parseStructuredJson(text);
    const translations = normalizeTranslations(
      parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {},
      Object.keys(source)
    );
    if (Object.keys(translations).length !== texts.length) throw new Error("Incomplete translation response");
    return NextResponse.json({ translations });
  } catch (error) {
    console.error("Page translation failed", error);
    return NextResponse.json({ error: "Unable to translate this page right now." }, { status: 503 });
  }
}
