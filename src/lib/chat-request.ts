export const PERSONAS = [
  "rahbar",
  "study",
  "essay",
  "cv",
  "safar",
  "hunar",
  "qalam",
  "manzil",
] as const;

export type Persona = (typeof PERSONAS)[number];

/** One turn on the wire between a chat UI and /api/chat. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Bodies bigger than this are refused before they are read. */
export const MAX_BODY_BYTES = 200_000;

/**
 * Older turns past this are dropped rather than rejected. A browser-saved
 * thread has no cap of its own, so a hard limit here would brick someone's
 * drawer on the first message after deploy.
 */
export const MAX_MESSAGES = 20;
export const MAX_MESSAGE_CHARS = 12_000;
export const MAX_TOTAL_CHARS = 30_000;

export interface ChatRequest {
  persona: Persona;
  messages: ChatMessage[];
}

export type ChatRequestResult =
  | { ok: true; value: ChatRequest }
  | { ok: false; status: number; error: string };

export function isPersona(value: unknown): value is Persona {
  return typeof value === "string" && (PERSONAS as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function reject(status: number, error: string): ChatRequestResult {
  return { ok: false, status, error };
}

type ParsedTurn = { message: ChatMessage } | { failure: ChatRequestResult };

function parseTurn(value: unknown): ParsedTurn {
  if (!isRecord(value)) return { failure: reject(400, "Each message must be an object") };

  const { role, content } = value;
  if (role !== "user" && role !== "assistant")
    return { failure: reject(400, 'Unsupported message role: only "user" and "assistant" are sent') };
  if (typeof content !== "string")
    return { failure: reject(400, "Message content must be text") };

  const text = content.trim();
  if (!text) return { failure: reject(400, "Message content is empty") };

  return { message: { role, content: text } };
}

/**
 * Validates the JSON a chat UI sends. Returns only the two fields it
 * understands, so nothing else in the body can reach the model.
 */
export function parseChatRequest(body: unknown): ChatRequestResult {
  if (!isRecord(body)) return reject(400, "Request body must be a JSON object");

  const persona = body.persona ?? "rahbar";
  if (!isPersona(persona)) return reject(400, "Unknown persona");

  if (!Array.isArray(body.messages) || body.messages.length === 0)
    return reject(400, "messages must be a non-empty array");

  const turns: ChatMessage[] = [];
  for (const raw of body.messages) {
    const parsed = parseTurn(raw);
    if ("failure" in parsed) return parsed.failure;
    turns.push(parsed.message);
  }

  const messages = turns.slice(-MAX_MESSAGES);
  if (messages[messages.length - 1].role !== "user")
    return reject(400, "The last message must be the student's question");

  for (const message of messages)
    if (message.content.length > MAX_MESSAGE_CHARS)
      return reject(413, `A message is too long: ${MAX_MESSAGE_CHARS} characters at most`);

  const total = messages.reduce((chars, message) => chars + message.content.length, 0);
  if (total > MAX_TOTAL_CHARS)
    return reject(413, `This conversation is too long: ${MAX_TOTAL_CHARS} characters at most`);

  return { ok: true, value: { persona, messages } };
}
