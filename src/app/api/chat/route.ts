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
  try {
    // getUser() verifies the JWT with Supabase and may refresh the session,
    // which writes cookies. HTTP cannot set cookies after streaming starts, so
    // auth and the profile read happen before the streaming response exists.
    const auth = await requireAuth("Sign in to chat");
    if (!auth.ok) return auth.error;
    const { supabase, user } = auth;

    if (!checkRateLimit(`chat:${user.id}`, RATE_MAX, RATE_WINDOW_MS)) {
      return jsonError("Too many messages. Try again in a moment.", 429);
    }

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;

    const parsed = parseChatRequest(bodyResult.value);
    if (!parsed.ok) return jsonError(parsed.error, parsed.status);
    const { persona, messages } = parsed.value;

    // The student is whatever our records say, taken from the token. A
    // "student" field in this request body is never read.
    const student = await readStudent(supabase, user.id);
    const { facts, covered } = retrieveForMessages(persona, messages);
    const result = streamChat(messages, { persona, student, facts, covered });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("chat error", err);
    return jsonError("Failed to generate response", 500);
  }
}
