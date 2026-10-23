export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "reset" }
  | { type: "done" }
  | { type: "error"; message: string };

export function encodeChatStreamEvent(event: ChatStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

function parseEvent(line: string): ChatStreamEvent {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new Error("The chatbot returned an invalid stream.");
  }
  if (!value || typeof value !== "object" || !("type" in value)) {
    throw new Error("The chatbot returned an invalid stream.");
  }
  const event = value as Record<string, unknown>;
  if (event.type === "reset" || event.type === "done") return { type: event.type };
  if (event.type === "delta" && typeof event.text === "string") return { type: "delta", text: event.text };
  if (event.type === "error" && typeof event.message === "string") return { type: "error", message: event.message };
  throw new Error("The chatbot returned an invalid stream.");
}

/**
 * Reads the framed chat stream and only resolves after the server explicitly
 * confirms completion. A platform timeout can no longer masquerade as a
 * successful half-answer.
 */
export async function readChatStreamResponse(
  response: Response,
  onText: (text: string) => void
): Promise<string> {
  if (!response.ok || !response.body) throw new Error("Chat request failed");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let completed = false;

  const consumeLine = (line: string) => {
    if (!line.trim()) return;
    const event = parseEvent(line);
    if (event.type === "delta") {
      answer += event.text;
      onText(answer);
    } else if (event.type === "reset") {
      answer = "";
      onText(answer);
    } else if (event.type === "done") {
      completed = true;
    } else {
      throw new Error(event.message);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) consumeLine(line);
  }
  buffer += decoder.decode();
  if (buffer.trim()) consumeLine(buffer);

  if (!completed) throw new Error("The chatbot response ended before completion.");
  if (!answer.trim()) throw new Error("The chatbot returned an empty response.");
  return answer;
}
