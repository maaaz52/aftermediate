import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { buildSystemPrompt, type ChatPromptInput } from "@/lib/chat-prompt";
import { isPersona } from "@/lib/chat-request";

export const MODEL = process.env.GOOGLE_MODEL || "gemini-flash-latest";

export const model = google(MODEL);

export type ChatContext = ChatPromptInput;

export function streamChat(
  messages: { role: "user" | "assistant"; content: string }[],
  context: ChatContext
) {
  if (!isPersona(context.persona)) {
    throw new Error(`Unknown persona: ${String(context.persona)}`);
  }
  return streamText({
    model,
    system: buildSystemPrompt(context),
    messages,
  });
}

/**
 * Deadline for one structured generation, retries included.
 *
 * Gemini answers 503 "experiencing high demand" during capacity spikes, and
 * every such error is retryable. Left at the SDK's defaults — 2 retries, no
 * deadline — a single spike kept /api/demand running for 2.4 minutes and then
 * failed anyway. Callers of this helper degrade gracefully when it rejects, so
 * failing fast costs nothing and holding the request costs a server slot.
 */
export const AI_TIMEOUT_MS = 20_000;

/** One retry, not two: a spike that survives a fast retry needs a later request, not a longer one. */
export const AI_MAX_RETRIES = 1;

export async function generateStructured<T>(
  prompt: string,
  system: string
): Promise<T> {
  const { text } = await generateText({
    model,
    system,
    prompt,
    maxRetries: AI_MAX_RETRIES,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  // A prose reply ("I cannot help with that") has no brace, and the old
  // slice(-1, 0) handed JSON.parse an empty string — surfacing as
  // "Unexpected end of JSON input", which names neither the model nor us.
  if (start === -1 || end <= start) {
    throw new Error(`Model returned no JSON object (${text.length} chars)`);
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
