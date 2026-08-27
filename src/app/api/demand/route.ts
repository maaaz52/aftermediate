import { generateStructured } from "@/lib/ai";
import type { Stream } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a global labor-market analyst for a Pakistani career guidance platform.
For the given student stream, interests and countries, write ONE short insight line (max 14 words) per country explaining why it is a strong destination for THIS student.
Ground it in concrete facts: visa route, skill shortage, salary, post-study work rights.
Return strict JSON only: {"insights":[{"country":"...","insight":"..."}]}. No markdown, no extra text.`;

const VALID_STREAMS = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stream = body.stream as Stream;

    if (!stream) {
      return new Response(JSON.stringify({ error: "stream is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (!VALID_STREAMS.includes(stream as (typeof VALID_STREAMS)[number])) {
      return new Response(JSON.stringify({ error: "Invalid stream value" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const interests = Array.isArray(body.interests)
      ? body.interests.filter((i: unknown): i is string => typeof i === "string")
      : [];
    const countries = Array.isArray(body.countries)
      ? body.countries.filter((c: unknown): c is string => typeof c === "string")
      : [];

    if (!Array.isArray(body.countries) || countries.length === 0) {
      return new Response(JSON.stringify({ error: "countries must be a non-empty array" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const result = await generateStructured<{ insights: { country: string; insight: string }[] }>(
      `Stream: ${stream}\nInterests: ${interests.join(", ") || "none given"}\nCountries: ${countries.join(", ")}`,
      SYSTEM
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("demand insight error", err);
    return new Response(JSON.stringify({ error: "Failed to generate insights" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}