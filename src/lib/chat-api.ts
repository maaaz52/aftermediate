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

export async function listSessions(persona: SessionPersona): Promise<ChatSession[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, persona, title, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("persona", persona)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ChatSession[];
}

export async function loadSession(id: string): Promise<ChatSessionWithMessages | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("id, persona, title, created_at, updated_at")
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
    ...(session as ChatSession),
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

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: user.id, persona, title })
    .select("id, persona, title, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as ChatSession;
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
  if (touchError) throw touchError;
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
