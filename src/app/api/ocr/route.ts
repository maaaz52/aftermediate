import { generateText } from "ai";
import { model } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/require-user";
import { jsonError, jsonOk } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Refuse bodies bigger than this before reading them. */
const MAX_BODY_BYTES = 6 * 1024 * 1024;
/** A marksheet image data-URL should stay far below this. */
const MAX_IMAGE_CHARS = 5 * 1024 * 1024;

/** Allow 10 scans per user per minute — plenty for real use, too slow for abuse. */
const RATE_MAX = 10;
const RATE_WINDOW_MS = 60 * 1000;

const SYSTEM = `You are an expert at reading Pakistani FSc / intermediate marksheets.
Extract the student's marks into clean JSON. Return ONLY valid JSON, no markdown.

The JSON must look like:
{
  "board": "string or null",
  "stream": "pre-medical | pre-engineering | ics | icom | null",
  "matricObtained": number,
  "matricTotal": number,
  "fscObtained": number,
  "fscTotal": number,
  "fscPart1Obtained": number | null,
  "fscPart1Total": number | null,
  "subjects": [{"name":"string","obtained":number,"total":number}],
  "confidence": number (0-100)
}

Rules:
- If a value is not visible or unclear, use null.
- Convert Urdu digits to English digits.
- Do not guess; only read what is printed.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    if (!user) return jsonError("Sign in to scan a marksheet", 401);

    if (!checkRateLimit(`ocr:${user.id}`, RATE_MAX, RATE_WINDOW_MS)) {
      return jsonError("Too many scans. Try again in a moment.", 429);
    }

    const declared = Number(req.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES)
      return jsonError("Request body is too large", 413);

    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return jsonError("Request body is too large", 413);

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return jsonError("Request body is not valid JSON", 400);
    }

    const { image } = (body ?? {}) as { image?: unknown };
    if (typeof image !== "string" || !image) {
      return jsonError("No image provided", 400);
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return jsonError("Image is too large", 413);
    }

    const { text: extracted } = await generateText({
      model,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Read this marksheet and extract the marks as JSON." },
            { type: "image", image },
          ],
        },
      ],
    });

    const cleaned = extracted.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const data = JSON.parse(cleaned.slice(start, end + 1));

    return jsonOk(data);
  } catch (err) {
    console.error("ocr error", err);
    return jsonError("OCR failed", 500);
  }
}