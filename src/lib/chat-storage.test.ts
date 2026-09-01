// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const auth = vi.hoisted(() => ({ user: null as { id: string } | null }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: auth.user }) }));

import {
  chatKey,
  clearLegacyKeys,
  LEGACY_SHARED_KEYS,
  useChatHistory,
  usePersonalString,
} from "@/lib/chat-storage";

const RAHBAR = "aftermediate:rahbar-chat";

const store = (key: string, value: unknown) =>
  window.localStorage.setItem(key, JSON.stringify(value));

const readMessages = (key: string) => JSON.parse(window.localStorage.getItem(key) ?? "null");

beforeEach(() => {
  window.localStorage.clear();
  auth.user = { id: "u1" };
});

afterEach(() => window.localStorage.clear());

describe("chatKey", () => {
  it("puts the user id in the key so two students never share a thread", () => {
    expect(chatKey(RAHBAR, "u1")).toBe("aftermediate:rahbar-chat:u1");
    expect(chatKey(RAHBAR, "u1")).not.toBe(chatKey(RAHBAR, "u2"));
  });

  it("returns null without a user instead of falling back to a shared key", () => {
    expect(chatKey(RAHBAR, null)).toBeNull();
    expect(chatKey(RAHBAR, undefined)).toBeNull();
  });
});

describe("clearLegacyKeys", () => {
  it("removes the un-namespaced keys and leaves per-user keys alone", () => {
    store(RAHBAR, [{ role: "user", content: "someone else's question" }]);
    store(chatKey(RAHBAR, "u1")!, [{ role: "user", content: "mine" }]);

    clearLegacyKeys([RAHBAR]);

    expect(window.localStorage.getItem(RAHBAR)).toBeNull();
    expect(readMessages(chatKey(RAHBAR, "u1")!)).toHaveLength(1);
  });
});

describe("useChatHistory", () => {
  it("loads the signed-in user's own thread", () => {
    store(`${RAHBAR}:u1`, [
      { role: "assistant", content: "hi A" },
      { role: "user", content: "my marks" },
    ]);
    store(`${RAHBAR}:u2`, [{ role: "user", content: "B's private question" }]);

    const { result } = renderHook(() => useChatHistory(RAHBAR, "Salam!"));

    expect(result.current[0]).toEqual([
      { role: "assistant", content: "hi A" },
      { role: "user", content: "my marks" },
    ]);
    expect(JSON.stringify(result.current[0])).not.toContain("B's private question");
  });

  it("saves under the signed-in user's key", () => {
    const { result } = renderHook(() => useChatHistory(RAHBAR, "Salam!"));

    act(() =>
      result.current[1]([
        { role: "assistant", content: "Salam!" },
        { role: "user", content: "what is merit?" },
      ])
    );

    expect(readMessages(`${RAHBAR}:u1`)).toEqual([
      { role: "assistant", content: "Salam!" },
      { role: "user", content: "what is merit?" },
    ]);
    expect(window.localStorage.getItem(RAHBAR)).toBeNull();
  });

  it("greets and saves nothing while no user is signed in", () => {
    auth.user = null;

    const { result } = renderHook(() => useChatHistory(RAHBAR, "Salam!"));
    expect(result.current[0]).toEqual([{ role: "assistant", content: "Salam!" }]);

    act(() => result.current[1]([{ role: "user", content: "anonymous question" }]));

    expect(window.localStorage.length).toBe(0);
  });

  it("switches to the next student's empty thread without writing theirs over", () => {
    store(`${RAHBAR}:u1`, [{ role: "user", content: "A's secret marks" }]);
    const { result, rerender } = renderHook(() => useChatHistory(RAHBAR, "Salam!"));

    auth.user = { id: "u2" };
    act(() => rerender());

    expect(result.current[0]).toEqual([{ role: "assistant", content: "Salam!" }]);
    expect(readMessages(`${RAHBAR}:u1`)).toEqual([{ role: "user", content: "A's secret marks" }]);
    expect(readMessages(`${RAHBAR}:u2`)).toEqual([{ role: "assistant", content: "Salam!" }]);
  });

  it("ignores stored junk that is not a message list", () => {
    store(`${RAHBAR}:u1`, ["nope", { role: "user" }, { role: "wizard", content: "x" }, null]);

    const { result } = renderHook(() => useChatHistory(RAHBAR, "Salam!"));

    expect(result.current[0]).toEqual([{ role: "assistant", content: "Salam!" }]);
  });

  it("survives unparseable stored JSON", () => {
    window.localStorage.setItem(`${RAHBAR}:u1`, "{not json");

    const { result } = renderHook(() => useChatHistory(RAHBAR, "Salam!"));

    expect(result.current[0]).toEqual([{ role: "assistant", content: "Salam!" }]);
  });

  it("drops every legacy shared key on mount", () => {
    for (const base of LEGACY_SHARED_KEYS) store(base, [{ role: "user", content: "leaked" }]);

    renderHook(() => useChatHistory(RAHBAR, "Salam!"));

    for (const base of LEGACY_SHARED_KEYS) {
      expect(window.localStorage.getItem(base), base).toBeNull();
    }
  });
});

describe("usePersonalString", () => {
  it("reads and writes the value under the signed-in user's key", () => {
    store("aftermediate:essays:draft:u1", "my hook");

    const { result } = renderHook(() => usePersonalString("aftermediate:essays:draft", ""));
    expect(result.current[0]).toBe("my hook");

    act(() => result.current[1]("my revised hook"));
    expect(readMessages("aftermediate:essays:draft:u1")).toBe("my revised hook");
  });

  it("keeps the value in memory only while signed out", () => {
    auth.user = null;

    const { result } = renderHook(() => usePersonalString("aftermediate:essays:draft", ""));
    act(() => result.current[1]("anonymous text"));

    expect(result.current[0]).toBe("anonymous text");
    expect(window.localStorage.getItem("aftermediate:essays:draft")).toBeNull();
  });
});
