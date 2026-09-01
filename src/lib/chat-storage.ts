/**
 * ============================================================
 *  PER-USER BROWSER STORAGE FOR THE CHAT BOTS
 * ============================================================
 *  localStorage belongs to a browser, not a student. On a shared
 *  family computer an un-namespaced key hands one sibling another's
 *  transcripts — and these transcripts contain marks, budgets and
 *  essay drafts — so every key below is suffixed with the signed-in
 *  user's id.
 *
 *  The older un-namespaced keys are deleted, never adopted: their
 *  contents may belong to a different person on this machine, and
 *  importing them would re-open the leak. Students see their chat
 *  scroll reset once after this ships.
 *
 *  With no signed-in user there is no key, so nothing is read or
 *  written; the thread still works in memory.
 */

import * as React from "react";
import { useAuth } from "@/lib/auth";
import type { ChatMessage } from "@/lib/chat-request";

export type { ChatMessage };

export const RATER_CHAT_BASE = "aftermediate:essays:rater-chat";
export const ESSAY_DRAFT_BASE = "aftermediate:essays:draft";

/** Keys that used to be shared by every account on the browser. */
export const LEGACY_SHARED_KEYS: string[] = [
  "aftermediate:rahbar-chat",
  "aftermediate:safar-chat",
  "aftermediate:skills:chat",
  "aftermediate:study-chat",
  RATER_CHAT_BASE,
  ESSAY_DRAFT_BASE,
];

export function chatKey(base: string, userId?: string | null): string | null {
  return userId ? `${base}:${userId}` : null;
}

export function clearLegacyKeys(bases: string[]): void {
  if (typeof window === "undefined") return;
  for (const base of bases) {
    try {
      window.localStorage.removeItem(base);
    } catch {
      /* ignore */
    }
  }
}

export function usePersonalKey(base: string): string | null {
  const { user } = useAuth();
  React.useEffect(() => {
    clearLegacyKeys(LEGACY_SHARED_KEYS);
  }, []);
  return chatKey(base, user?.id);
}

function readRaw(key: string | null): unknown {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function toMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const messages = raw.filter(
    (entry): entry is ChatMessage =>
      !!entry &&
      typeof entry === "object" &&
      ((entry as ChatMessage).role === "user" || (entry as ChatMessage).role === "assistant") &&
      typeof (entry as ChatMessage).content === "string"
  );
  return messages.length > 0 ? messages : null;
}

function toStringValue(raw: unknown): string | null {
  return typeof raw === "string" ? raw : null;
}

interface Slot<T> {
  key: string | null;
  value: T;
}

function load<T>(key: string | null, fallback: T, parse: (raw: unknown) => T | null): Slot<T> {
  return { key, value: parse(readRaw(key)) ?? fallback };
}

/**
 * The value is only ever written to the key it was loaded from, so a user
 * switching accounts without a remount cannot flush their thread into the
 * next student's key.
 */
function useStoredValue<T>(
  key: string | null,
  fallback: T,
  parse: (raw: unknown) => T | null
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [slot, setSlot] = React.useState<Slot<T>>({ key: null, value: fallback });

  // The personal key arrives once auth resolves and changes when the student
  // switches account, so the stored value is re-read as part of rendering.
  const current = slot.key === key ? slot : load(key, fallback, parse);
  if (current !== slot) setSlot(current);

  React.useEffect(() => {
    if (!key || slot.key !== key) return;
    writeRaw(key, slot.value);
  }, [key, slot]);

  function setValue(action: React.SetStateAction<T>): void {
    setSlot((prev) => {
      const from = prev.key === key ? prev : load(key, fallback, parse);
      const nextValue =
        typeof action === "function" ? (action as (previous: T) => T)(from.value) : action;
      return { key, value: nextValue };
    });
  }

  return [current.value, setValue];
}

export function useChatHistory(
  base: string,
  greeting: string
): [ChatMessage[], React.Dispatch<React.SetStateAction<ChatMessage[]>>] {
  return useStoredValue(
    usePersonalKey(base),
    [{ role: "assistant", content: greeting }],
    toMessages
  );
}

export function usePersonalString(
  base: string,
  initial: string
): [string, React.Dispatch<React.SetStateAction<string>>] {
  return useStoredValue(usePersonalKey(base), initial, toStringValue);
}
