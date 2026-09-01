import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RetrievedFact } from "@/lib/knowledge";
import type { StudentContext } from "@/lib/student-context";

const { streamChat } = vi.hoisted(() => ({ streamChat: vi.fn() }));

/** What the route asked Supabase for, so the tests can assert on the query itself. */
const db = vi.hoisted(() => ({
  table: "",
  select: "",
  eq: [] as string[],
  fail: false,
}));
const auth = vi.hoisted(() => ({ user: null as { id: string } | null }));
const profile = vi.hoisted(() => ({ data: null as Record<string, unknown> | null }));

vi.mock("@/lib/ai", () => ({
  streamChat: (...args: unknown[]) => {
    streamChat(...args);
    return { toTextStreamResponse: () => new Response("streamed") };
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: auth.user }, error: null }) },
    from: (table: string) => {
      db.table = table;
      const builder = {
        select: (columns: string) => {
          db.select = columns;
          return builder;
        },
        eq: (column: string, value: string) => {
          db.eq = [column, value];
          return builder;
        },
        maybeSingle: async () => {
          if (db.fail) throw new Error("profile read failed");
          return { data: profile.data, error: null };
        },
      };
      return builder;
    },
  }),
}));

import { POST } from "@/app/api/chat/route";

interface SentContext {
  persona?: string;
  facts?: RetrievedFact[];
  covered?: boolean;
  student?: StudentContext | null;
}

const send = (body: Record<string, unknown>) =>
  POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );

const ask = (persona: string, content: string) =>
  send({ persona, messages: [{ role: "user", content }] });

const sentContext = (): SentContext => streamChat.mock.calls[0][1] as SentContext;

const ASPIRING = {
  name: "Ayesha Khan",
  stream: "pre-medical",
  marks: { fscObtained: 960, fscTotal: 1100 },
  interests: ["Medicine & Healthcare"],
  city: "Lahore",
  budget: "30000",
  quiz: { budgetMonthly: 50000 },
};

describe("POST /api/chat", () => {
  beforeEach(() => {
    streamChat.mockClear();
    db.table = "";
    db.select = "";
    db.eq = [];
    db.fail = false;
    auth.user = { id: "u1" };
    profile.data = ASPIRING;
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

  it("refuses a signed-out request without waking the model", async () => {
    auth.user = null;

    const res = await ask("safar", "What's my budget?");

    expect(res.status).toBe(401);
    expect(streamChat).not.toHaveBeenCalled();
  });

  it("answers with the signed-in student's own profile", async () => {
    await ask("rahbar", "What's my FSc percentage?");

    expect(db.table).toBe("profiles");
    expect(sentContext().student).toMatchObject({ name: "Ayesha Khan", stream: "pre-medical" });
    expect(sentContext().student?.fscPct).toBeCloseTo(87.3, 1);
  });

  it("prefers the quiz answer over the mirrored budget column", async () => {
    await ask("safar", "Can I afford Germany?");

    expect(sentContext().student?.budgetMonthly).toBe(50000);
  });

  it("ignores a student forged into the request body", async () => {
    const res = await send({
      persona: "rahbar",
      messages: [{ role: "user", content: "What's my budget?" }],
      student: { name: "Attacker", budgetMonthly: 9999999, stream: "pre-medical" },
    });

    expect(res.status).toBe(200);
    expect(sentContext().student?.name).toBe("Ayesha Khan");
    expect(sentContext().student?.budgetMonthly).toBe(50000);
  });

  it("scopes the profile read to the id on the token", async () => {
    await ask("rahbar", "What's my FSc percentage?");

    expect(db.eq).toEqual(["id", "u1"]);
  });

  it("selects only the columns the chat may repeat", async () => {
    await ask("rahbar", "What's my FSc percentage?");

    expect(db.select).toContain("marks");
    expect(db.select).toContain("quiz");
    for (const hidden of ["bio", "practice", "watchlist", "education", "skills", "avatar"]) {
      expect(db.select, hidden).not.toContain(hidden);
    }
  });

  it("sends no student block for a user who has not completed onboarding", async () => {
    profile.data = null;

    await ask("rahbar", "What can you do?");

    expect(sentContext().student ?? null).toBeNull();
  });

  it("keeps streaming when the profile read fails", async () => {
    db.fail = true;

    const res = await ask("rahbar", "What can you do?");

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("streamed");
    expect(sentContext().student ?? null).toBeNull();
  });
});
