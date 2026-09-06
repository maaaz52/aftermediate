import { generateStructured } from "@/lib/ai";
import type { Stream } from "@/lib/types";
import { jsonError, jsonOk } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody, requireAuth } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a global labor-market analyst for a Pakistani career guidance platform.
For the given student stream, interests and countries, write ONE short insight line (max 14 words) per country explaining why it is a strong destination for THIS student.
Ground it in concrete facts: visa route, skill shortage, salary, post-study work rights.
Return strict JSON only: {"insights":[{"country":"...","insight":"..."}]}. No markdown, no extra text.`;

const VALID_STREAMS = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"] as const;

const MAX_BODY_BYTES = 64 * 1024;
const MAX_INTERESTS = 20;
const MAX_COUNTRIES = 20;

/** Allow 15 demand lookups per user per minute. */
const RATE_MAX = 15;
const RATE_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
  try {
    const auth = await requireAuth("Sign in to see demand insights");
    if (!auth.ok) return auth.error;
    const { user } = auth;

    if (!checkRateLimit(`demand:${user.id}`, RATE_MAX, RATE_WINDOW_MS)) {
      return jsonError("Too many requests. Try again in a moment.", 429);
    }

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const body = bodyResult.value as Record<string, unknown>;

    const stream = body.stream as Stream | undefined;
    if (!stream) return jsonError("stream is required", 400);
    if (!VALID_STREAMS.includes(stream as (typeof VALID_STREAMS)[number])) {
      return jsonError("Invalid stream value", 400);
    }

    const interests = Array.isArray(body.interests)
      ? body.interests.filter((i: unknown): i is string => typeof i === "string").slice(0, MAX_INTERESTS)
      : [];
    const countries = Array.isArray(body.countries)
      ? body.countries.filter((c: unknown): c is string => typeof c === "string").slice(0, MAX_COUNTRIES)
      : [];

    if (countries.length === 0) {
      return jsonError("countries must be a non-empty array", 400);
    }

    const result = await generateStructured<{ insights: { country: string; insight: string }[] }>(
      `Stream: ${stream}\nInterests: ${interests.join(", ") || "none given"}\nCountries: ${countries.join(", ")}`,
      SYSTEM
    );

    return jsonOk(result);
  } catch (err) {
    console.error("demand insight error", err);
    return jsonError("Failed to generate insights", 500);
  }
}