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

function firstUserMessage(messages: ChatMessage[]): string | null {
  const first = messages.find((m) => m.role === "user");
  if (!first) return null;
  return first.content.slice(0, 80).replace(/\n/g, " ");
}

export async function listSessions(persona: SessionPersona): Promise<ChatSession[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("chat_sessions")
    .select("id, persona, title, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("persona", persona)
    .order("updated_at", { ascending: false });

  return (data ?? []) as ChatSession[];
}

export async function loadSession(id: string): Promise<ChatSessionWithMessages | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id, persona, title, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!session) return null;

  const { data: rows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

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
  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role,
    content,
  });
  // Touch updated_at on the session
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("chat_sessions").delete().eq("id", id);
}

export async function renameSession(id: string, title: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("chat_sessions").update({ title }).eq("id", id);
}
