import { generateText } from "ai";
import { model } from "@/lib/ai";
import { jsonError, jsonOk } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody, requireAuth } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Refuse bodies bigger than this before reading them. Matches Vercel's
 * 4.5MB default function payload limit, so the cap is actually reachable. */
const MAX_BODY_BYTES = 4.5 * 1024 * 1024;
/** A marksheet image data-URL should stay far below this. */
const MAX_IMAGE_CHARS = 4 * 1024 * 1024;

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
    const auth = await requireAuth("Sign in to scan a marksheet");
    if (!auth.ok) return auth.error;
    const { user } = auth;

    if (!checkRateLimit(`ocr:${user.id}`, RATE_MAX, RATE_WINDOW_MS)) {
      return jsonError("Too many scans. Try again in a moment.", 429);
    }

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;

    const { image } = (bodyResult.value ?? {}) as { image?: unknown };
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