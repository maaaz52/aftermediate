import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RetrievedFact } from "@/lib/knowledge";

const { streamChat } = vi.hoisted(() => ({ streamChat: vi.fn() }));

vi.mock("@/lib/ai", () => ({
  streamChat: (...args: unknown[]) => {
    streamChat(...args);
    return { toTextStreamResponse: () => new Response("streamed") };
  },
}));

import { POST } from "@/app/api/chat/route";

interface SentContext {
  persona?: string;
  facts?: RetrievedFact[];
  covered?: boolean;
}

const ask = (persona: string, content: string) =>
  POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ persona, messages: [{ role: "user", content }] }),
    })
  );

const sentContext = (): SentContext => streamChat.mock.calls[0][1] as SentContext;

describe("POST /api/chat", () => {
  beforeEach(() => {
    streamChat.mockClear();
  });

  it("retrieves for the question asked before handing off to the model", async () => {
    const res = await ask(
      "safar",
      "How much money do I have to park in a blocked account for Germany?"
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("streamed");
    const ctx = sentContext();
    expect(ctx.persona).toBe("safar");
    expect(ctx.covered).toBe(true);
    expect(ctx.facts?.map((f) => f.topicId)).toContain("bank-statements");
  });

  it("sends no facts to a persona that owns no knowledge base", async () => {
    await ask("rahbar", "How do I edit my profile?");
    const ctx = sentContext();
    expect(ctx.persona).toBe("rahbar");
    expect(ctx.facts).toEqual([]);
    expect(ctx.covered).toBeFalsy();
  });
});
