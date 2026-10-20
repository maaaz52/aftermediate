import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/chat-request";

export type SessionPersona = "manzil" | "safar" | "study";

export interface ChatSession {
  id: string;
  persona: SessionPersona;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

type SessionRow = Partial<ChatSession> & { id: string; persona: SessionPersona };

function toSession(row: SessionRow): ChatSession {
  return {
    id: row.id,
    persona: row.persona,
    // Early chat-history installations did not have a title column. Retaining
    // a usable fallback lets those conversations remain accessible while the
    // database migration brings the schema up to date.
    title: typeof row.title === "string" && row.title.trim() ? row.title : "Untitled chat",
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? row.created_at ?? "",
  };
}

function isMissingColumnError(error: { code?: string; message?: string } | null, column: string) {
  return Boolean(
    error &&
      (error.code === "42703" || error.code === "PGRST204") &&
      error.message?.toLowerCase().includes(column.toLowerCase())
  );
}

export async function listSessions(persona: SessionPersona): Promise<ChatSession[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("persona", persona)
    .order("updated_at", { ascending: false });

  if (isMissingColumnError(error, "updated_at")) {
    ({ data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("persona", persona)
      .order("created_at", { ascending: false }));
  }

  if (error) throw error;
  return (data ?? []).map((row) => toSession(row as SessionRow));
}

export async function loadSession(id: string): Promise<ChatSessionWithMessages | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (sessionError) {
    if (sessionError.code === "PGRST116") return null;
    throw sessionError;
  }
  if (!session) return null;

  const { data: rows, error: messagesError } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) throw messagesError;
  return {
    ...toSession(session as SessionRow),
    messages: (rows ?? []) as ChatMessage[],
  };
}

export async function createSession(
  persona: SessionPersona,
  firstMessage?: string
): Promise<ChatSession> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const title = firstMessage
    ? firstMessage.slice(0, 80).replace(/\n/g, " ")
    : "New chat";

  let { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: user.id, persona, title })
    .select("*")
    .single();

  // Read compatibility for databases created before chat titles were added.
  if (isMissingColumnError(error, "title")) {
    ({ data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, persona })
      .select("*")
      .single());
  }

  if (error) throw error;
  return toSession(data as SessionRow);
}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const supabase = createClient();
  const { error: messageError } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role,
    content,
  });
  if (messageError) throw messageError;
  // Touch updated_at on the session
  const { error: touchError } = await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  // Older rows can still be read and receive messages if their legacy table
  // has no updated_at column. The migration adds it for normal ordering.
  if (touchError && !isMissingColumnError(touchError, "updated_at")) throw touchError;
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("chat_sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function renameSession(id: string, title: string): Promise<void> {
  const supabase = createClient();
  const normalized = title.trim();
  if (!normalized) throw new Error("Chat title cannot be empty");
  const { error } = await supabase
    .from("chat_sessions")
    .update({ title: normalized.slice(0, 80) })
    .eq("id", id);
  if (error) throw error;
}
