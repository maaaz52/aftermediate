import { streamChat } from "@/lib/ai";
import { isPersona } from "@/lib/chat-request";
import { retrieveForMessages } from "@/lib/knowledge";
import { buildStudentContext, type ProfileRow } from "@/lib/student-context";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Everything the bots are allowed to know about a student. Deliberately not
 * `*`: bio, practice, watchlist, education, skills and avatar stay out of
 * every prompt, and a wrong id cannot turn into a wide read.
 */
const PROFILE_COLUMNS = "name, stream, marks, interests, city, budget, quiz";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

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
    const supabase = await createClient();
    // getUser() verifies the JWT with Supabase and may refresh the session,
    // which writes cookies. HTTP cannot set cookies after streaming starts, so
    // auth and the profile read happen before the streaming response exists.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError("Sign in to chat", 401);

    const body = await req.json();
    const messages = body.messages as { role: "user" | "assistant"; content: string }[];
    const persona = body.persona ?? "rahbar";
    if (!isPersona(persona)) return jsonError("Invalid persona", 400);

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
