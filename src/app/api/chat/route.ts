import { streamChat } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages as { role: "user" | "assistant"; content: string }[];
    const persona = (body.persona as "rahbar" | "study" | "essay" | "cv" | "safar" | "hunar" | "qalam") || "rahbar";

    const result = streamChat(messages, { persona });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("chat error", err);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
