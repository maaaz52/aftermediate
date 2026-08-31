import { streamChat } from "@/lib/ai";
import { isPersona } from "@/lib/chat-request";
import { retrieveForMessages } from "@/lib/knowledge";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages as { role: "user" | "assistant"; content: string }[];
    const persona = body.persona ?? "rahbar";
    if (!isPersona(persona)) {
      return new Response(JSON.stringify({ error: "Invalid persona" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const { facts, covered } = retrieveForMessages(persona, messages);
    const result = streamChat(messages, { persona, facts, covered });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("chat error", err);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
