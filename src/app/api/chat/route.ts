import { streamChat } from "@/lib/ai";
import { MAX_BODY_BYTES, parseChatRequest } from "@/lib/chat-request";
import { retrieveForMessages } from "@/lib/knowledge";
import { buildStudentContext, type ProfileRow } from "@/lib/student-context";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody, requireAuth } from "@/lib/http";
import { jsonError } from "@/lib/api-response";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Allow 30 chat turns per user per minute — comfortable for a conversation. */
const RATE_MAX = 30;
const RATE_WINDOW_MS = 60 * 1000;

type ChatTiming = Record<string, number | string | boolean>;

/**
 * Deliberately contains timing metadata only. Never add user IDs, prompts,
 * student context, API keys, or model output to this performance event.
 */
function logChatTiming(event: string, timing: ChatTiming) {
  console.info("chat_performance", JSON.stringify({ event, ...timing }));
}

/**
 * Everything the bots are allowed to know about a student. Deliberately not
 * `*`: bio, practice, watchlist, education, skills, avatar_style, and
 * avatar_seed stay out of every prompt, and a wrong id cannot turn into a
 * wide read.
 */
const PROFILE_COLUMNS = "name, stream, marks, interests, city, budget, quiz";

type Supabase = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

/**
 * A profile read must never take a chat down, so a missing row or a failed
 * query means no student block rather than an error page.
 */
async function readStudent(supabase: Supabase, userId: string) {
  try {
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    return buildStudentContext(data as ProfileRow | null);
  } catch (err) {
    console.warn("chat profile read failed", err);
    return null;
  }
}

export async function POST(req: Request) {
  const requestStartedAt = performance.now();
  try {
    // getUser() verifies the JWT with Supabase and may refresh the session,
    // which writes cookies. HTTP cannot set cookies after streaming starts, so
    // auth and the profile read happen before the streaming response exists.
    const auth = await requireAuth("Sign in to chat");
    if (!auth.ok) return auth.error;
    const { supabase, user } = auth;
    const authMs = Math.round(performance.now() - requestStartedAt);

    // Authentication must finish before we know the user id. Once it does,
    // the independent limiter and profile read can overlap.
    const profileStartedAt = performance.now();
    const studentPromise = readStudent(supabase, user.id).then((student) => ({
      student,
      profileMs: Math.round(performance.now() - profileStartedAt),
    }));
    const rateLimitPromise = checkRateLimit(`chat:${user.id}`, RATE_MAX, RATE_WINDOW_MS);

    if (!(await rateLimitPromise)) {
      return jsonError("Too many messages. Try again in a moment.", 429);
    }

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;

    const parsed = parseChatRequest(bodyResult.value);
    if (!parsed.ok) return jsonError(parsed.error, parsed.status);
    const { persona, messages } = parsed.value;

    // The student is whatever our records say, taken from the token. A
    // "student" field in this request body is never read.
    const { student, profileMs } = await studentPromise;
    const retrievalStartedAt = performance.now();
    const { facts, covered } = retrieveForMessages(persona, messages);
    const retrievalMs = Math.round(performance.now() - retrievalStartedAt);
    const preStreamMs = Math.round(performance.now() - requestStartedAt);
    const result = streamChat(messages, { persona, student, facts, covered }, {
      onFirstToken: ({ provider, fallbackUsed, modelTtfbMs }) => {
        logChatTiming("first_token", {
          provider,
          fallbackUsed,
          authMs,
          profileMs,
          retrievalMs,
          preStreamMs,
          modelTtfbMs,
          totalMs: Math.round(performance.now() - requestStartedAt),
        });
      },
      onComplete: ({ provider, fallbackUsed, modelDurationMs }) => {
        logChatTiming("complete", {
          provider,
          fallbackUsed,
          authMs,
          profileMs,
          retrievalMs,
          preStreamMs,
          modelDurationMs,
          totalMs: Math.round(performance.now() - requestStartedAt),
        });
      },
      onError: ({ provider, fallbackUsed, modelDurationMs }) => {
        logChatTiming("stream_error", {
          provider,
          fallbackUsed,
          authMs,
          profileMs,
          retrievalMs,
          preStreamMs,
          modelDurationMs,
          totalMs: Math.round(performance.now() - requestStartedAt),
        });
      },
    });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("chat error", err);
    return jsonError("Failed to generate response", 500);
  }
}
