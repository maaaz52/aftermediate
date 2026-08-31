import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { buildSystemPrompt, type ChatStudent } from "@/lib/chat-prompt";
import { isPersona, type Persona } from "@/lib/chat-request";

export const MODEL = process.env.GOOGLE_MODEL || "gemini-flash-latest";

export const model = google(MODEL);

export interface ChatContext {
  persona: Persona;
  student?: ChatStudent;
}

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

export async function generateStructured<T>(
  prompt: string,
  system: string
): Promise<T> {
  const { text } = await generateText({
    model,
    system,
    prompt,
  });
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
