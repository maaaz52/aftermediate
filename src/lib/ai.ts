import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText, type FinishReason, type LanguageModel } from "ai";
import { buildSystemPrompt, type ChatPromptInput } from "@/lib/chat-prompt";
import { isPersona } from "@/lib/chat-request";
import { encodeChatStreamEvent } from "@/lib/chat-stream-protocol";

export const MODEL = process.env.GOOGLE_MODEL || "gemini-flash-latest";
export const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";
export const CHAT_PRIMARY_PROVIDER = process.env.CHAT_PRIMARY_PROVIDER === "nvidia" ? "nvidia" : "gemini";
export const CHAT_MAX_OUTPUT_TOKENS = 1_200;
export const CHAT_PRIMARY_TIMEOUT_MS = 35_000;
export const CHAT_FALLBACK_TIMEOUT_MS = 18_000;

export const model = google(MODEL);

const nvidiaApiKey = process.env.NVIDIA_API_KEY;
const nvidia = nvidiaApiKey
  ? createOpenAICompatible({
      name: "nvidia",
      apiKey: nvidiaApiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    })
  : null;

export type ChatContext = ChatPromptInput;
type ChatProvider = "gemini" | "nvidia";

export interface ChatStreamTelemetry {
  onFirstToken?: (event: { provider: ChatProvider; fallbackUsed: boolean; modelTtfbMs: number }) => void;
  onComplete?: (event: { provider: ChatProvider; fallbackUsed: boolean; modelDurationMs: number; finishReason: FinishReason }) => void;
  onError?: (event: { provider: ChatProvider; fallbackUsed: boolean; modelDurationMs: number }) => void;
}

class IncompleteChatStreamError extends Error {
  constructor(readonly finishReason: FinishReason) {
    super(`Chat stream finished with ${finishReason}`);
  }
}

function nvidiaModel(): LanguageModel | null {
  return nvidia?.languageModel(NVIDIA_MODEL) ?? null;
}

function primaryChatModel(): { provider: ChatProvider; model: LanguageModel } {
  const nvidiaPrimary = CHAT_PRIMARY_PROVIDER === "nvidia" ? nvidiaModel() : null;
  return nvidiaPrimary
    ? { provider: "nvidia", model: nvidiaPrimary }
    : { provider: "gemini", model };
}

function fallbackChatModel(provider: ChatProvider): { provider: ChatProvider; model: LanguageModel } | null {
  if (provider === "nvidia") return { provider: "gemini", model };
  const fallback = nvidiaModel();
  return fallback ? { provider: "nvidia", model: fallback } : null;
}

function shouldUseNvidiaFallback(error: unknown): boolean {
  if (error instanceof IncompleteChatStreamError) {
    return error.finishReason !== "content-filter";
  }
  if (!error || typeof error !== "object") return true;
  const status = "statusCode" in error && typeof error.statusCode === "number"
    ? error.statusCode
    : "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;

  // Do not hide a malformed request or an invalid Gemini credential by
  // switching providers. NVIDIA is reserved for transient upstream failures.
  return status === undefined || status === 408 || status === 429 || status >= 500;
}

async function withNvidiaFallback<T>(run: (languageModel: LanguageModel) => Promise<T>): Promise<T> {
  try {
    return await run(model);
  } catch (error) {
    if (!shouldUseNvidiaFallback(error)) throw error;
    const fallback = nvidiaModel();
    if (!fallback) throw error;
    console.warn("Gemini request failed; retrying with NVIDIA fallback", { model: NVIDIA_MODEL });
    return run(fallback);
  }
}

export function streamChat(
  messages: { role: "user" | "assistant"; content: string }[],
  context: ChatContext,
  telemetry?: ChatStreamTelemetry
) {
  if (!isPersona(context.persona)) {
    throw new Error(`Unknown persona: ${String(context.persona)}`);
  }
  const system = buildSystemPrompt(context);
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentText = false;
      let emittedFirstToken = false;
      const primary = primaryChatModel();
      const streamProvider = async (
        selected: { provider: ChatProvider; model: LanguageModel },
        fallbackUsed: boolean
      ) => {
        const startedAt = performance.now();
        const result = streamText({
          model: selected.model,
          system,
          messages,
          // A retry adds seconds before users see a character. For chat, fail
          // over to the other configured provider immediately instead.
          maxRetries: 0,
          maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
          // Keep enough of the 60-second route budget for a second provider
          // if the first one stalls after sending only part of an answer.
          abortSignal: AbortSignal.timeout(fallbackUsed ? CHAT_FALLBACK_TIMEOUT_MS : CHAT_PRIMARY_TIMEOUT_MS),
        });
        try {
          for await (const text of result.textStream) {
            if (!emittedFirstToken) {
              emittedFirstToken = true;
              telemetry?.onFirstToken?.({
                provider: selected.provider,
                fallbackUsed,
                modelTtfbMs: Math.round(performance.now() - startedAt),
              });
            }
            sentText = true;
            controller.enqueue(encodeChatStreamEvent({ type: "delta", text }));
          }
          const finishReason = await result.finishReason;
          if (finishReason !== "stop") throw new IncompleteChatStreamError(finishReason);
          telemetry?.onComplete?.({
            provider: selected.provider,
            fallbackUsed,
            modelDurationMs: Math.round(performance.now() - startedAt),
            finishReason,
          });
        } catch (error) {
          telemetry?.onError?.({
            provider: selected.provider,
            fallbackUsed,
            modelDurationMs: Math.round(performance.now() - startedAt),
          });
          throw error;
        }
      };

      try {
        await streamProvider(primary, false);
      } catch (error) {
        const fallback = fallbackChatModel(primary.provider);
        if (!fallback || !shouldUseNvidiaFallback(error)) {
          controller.enqueue(encodeChatStreamEvent({ type: "error", message: "The chatbot could not finish its response. Please try again." }));
          controller.close();
          return;
        }
        try {
          console.warn("Chat provider did not complete; retrying with fallback", {
            primaryProvider: primary.provider,
            fallbackProvider: fallback.provider,
          });
          if (sentText) {
            // The client discards the incomplete primary answer before the
            // backup starts, so users never see two responses joined together.
            controller.enqueue(encodeChatStreamEvent({ type: "reset" }));
            sentText = false;
          }
          await streamProvider(fallback, true);
        } catch (fallbackError) {
          console.error("Chat fallback could not complete", fallbackError);
          controller.enqueue(encodeChatStreamEvent({ type: "error", message: "The chatbot could not finish its response. Please try again." }));
          controller.close();
          return;
        }
      }
      controller.enqueue(encodeChatStreamEvent({ type: "done" }));
      controller.close();
    },
  });

  return {
    toTextStreamResponse: () => new Response(body, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-cache, no-transform",
      },
    }),
  };
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

export function parseStructuredJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  // A prose reply ("I cannot help with that") has no brace, and the old
  // slice(-1, 0) handed JSON.parse an empty string — surfacing as
  // "Unexpected end of JSON input", which names neither the model nor us.
  if (start === -1 || end <= start) {
    throw new Error(`Model returned no JSON object (${text.length} chars)`);
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as unknown;
}

export async function generateStructured<T = unknown>(
  prompt: string,
  system: string,
  validate?: (value: unknown) => T
): Promise<T> {
  const { text } = await withNvidiaFallback((languageModel) => generateText({
    model: languageModel,
    system,
    prompt,
    maxRetries: AI_MAX_RETRIES,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
  }));
  const value = parseStructuredJson(text);
  return validate ? validate(value) : (value as T);
}
