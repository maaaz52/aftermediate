import { generateText } from "ai";
import { model } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    const { image } = (await req.json()) as { image: string };

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const { text } = await generateText({
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

    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const data = JSON.parse(cleaned.slice(start, end + 1));

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("ocr error", err);
    return new Response(JSON.stringify({ error: "OCR failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
