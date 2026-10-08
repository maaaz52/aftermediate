import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listFeatureRequests,
  listReplies,
  submitFeatureRequest,
  submitReply,
  submitReview,
  toggleVote,
} from "./feedback-api";
import type { MediaKind } from "./feedback-model";

const s = vi.hoisted(() => ({
  user: null as null | { id: "u1" },
  reviewResult: { error: null as null | { message: string }, data: null as null | { id: "r1" } },
  voteRow: null as null | { id: "v1" },
  requestRow: { votes_count: 7 } as Record<string, unknown> & { votes_count?: number },
  uploadError: null as null | { message: string },
  insertError: null as null | { message: string },
  requestRows: [] as Record<string, unknown>[],
  replyRows: [] as Record<string, unknown>[],
  chain: [] as string[],
  lastInsert: null as unknown,
  lastEq: null as [string, unknown] | null,
  reviewInsertError: null as null | { message: string },
  mediaInsertError: null as null | { message: string },
  voteInsertError: null as null | { message: string },
  voteDeleteError: null as null | { message: string },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: s.user } })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ error: s.uploadError })),
      })),
    },
    from: vi.fn((table: string) => {
      s.chain.push(`from:${table}`);
      const q = {
        insert: vi.fn((row?: unknown) => {
          s.chain.push("insert");
          s.lastInsert = row;
          if (table === "review_media" && s.mediaInsertError) return { error: s.mediaInsertError };
          if (table === "feature_votes" && s.voteInsertError) return { error: s.voteInsertError };
          return q;
        }),
        select: vi.fn(() => {
          s.chain.push("select");
          return q;
        }),
        single: vi.fn(async () => {
          s.chain.push("single");
          return table === "reviews" ? s.reviewResult : { data: s.requestRow, error: s.insertError };
        }),
        maybeSingle: vi.fn(async () => {
          s.chain.push("maybeSingle");
          return { data: s.voteRow, error: null };
        }),
        eq: vi.fn((col: string, val: unknown) => {
          s.chain.push("eq");
          s.lastEq = [col, val];
          if (col === "id" && s.voteDeleteError) return { error: s.voteDeleteError };
          return q;
        }),
        delete: vi.fn(() => {
          s.chain.push("delete");
          return q;
        }),
        order: vi.fn(async () => {
          s.chain.push("order");
          return { data: table === "feature_replies" ? s.replyRows : s.requestRows, error: null };
        }),
      };
      return q;
    }),
  }),
}));

beforeEach(() => {
  s.user = { id: "u1" };
  s.reviewResult = { error: null, data: { id: "r1" } };
  s.voteRow = null;
  s.requestRow = { votes_count: 7 };
  s.uploadError = null;
  s.insertError = null;
  s.requestRows = [{ id: "f1", name: "Dark mode", votes_count: 4, status: "open" }];
  s.replyRows = [];
  s.lastInsert = null;
  s.lastEq = null;
  s.reviewInsertError = null;
  s.mediaInsertError = null;
  s.voteInsertError = null;
  s.voteDeleteError = null;
  s.chain = [];
});

describe("submitReview", () => {
  const payload = {
    tone: "loved" as const,
    rating: 9,
    reviewText: "Great",
    surprised: "",
    mindset: "",
    recommendTo: ["students"],
  };

  it("rejects when signed out", async () => {
    s.user = null;
    const r = await submitReview(payload, []);
    expect(r.ok).toBe(false);
  });

  it("inserts the review with mapped columns", async () => {
    await submitReview(payload, []);
    expect(s.chain).toContain("from:reviews");
    expect(s.chain).toContain("insert");
    expect(s.chain).toContain("select");
    expect(s.chain).toContain("single");
    expect(s.lastInsert).toEqual({
      user_id: "u1",
      tone: "loved",
      rating: 9,
      review_text: "Great",
      surprised: "",
      mindset: "",
      recommend_to: ["students"],
    });
  });

  it("uploads media and inserts media rows after the review", async () => {
    const file = new File(["x"], "shot.png", { type: "image/png" });
    await submitReview(payload, [{ file, kind: "image" as MediaKind }]);
    expect(s.chain.filter((c) => c === "from:review_media").length).toBe(1);
    expect(s.lastInsert).toMatchObject({ review_id: "r1", media_type: "image", file_name: "shot.png" });
  });

  it("returns upload errors", async () => {
    s.uploadError = { message: "quota exceeded" };
    const file = new File(["x"], "shot.png", { type: "image/png" });
    const r = await submitReview(payload, [{ file, kind: "image" as MediaKind }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("quota exceeded");
  });

  it("returns review insert errors", async () => {
    s.reviewResult = { error: { message: "db down" }, data: null };
    const r = await submitReview(payload, []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("db down");
  });

  it("returns media row insert errors", async () => {
    s.mediaInsertError = { message: "row failed" };
    const file = new File(["x"], "shot.png", { type: "image/png" });
    const r = await submitReview(payload, [{ file, kind: "image" as MediaKind }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("row failed");
  });
});

describe("toggleVote", () => {
  it("inserts a vote when none exists and returns the new count", async () => {
    const r = await toggleVote("f1");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.voted).toBe(true);
      expect(r.count).toBe(7);
    }
  });

  it("deletes the vote when one exists", async () => {
    s.voteRow = { id: "v1" };
    const r = await toggleVote("f1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.voted).toBe(false);
  });

  it("rejects when signed out", async () => {
    s.user = null;
    expect((await toggleVote("f1")).ok).toBe(false);
  });

  it("returns vote insert errors", async () => {
    s.voteInsertError = { message: "duplicate" };
    const r = await toggleVote("f1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("duplicate");
  });

  it("returns vote delete errors", async () => {
    s.voteRow = { id: "v1" };
    s.voteDeleteError = { message: "forbidden" };
    const r = await toggleVote("f1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("forbidden");
  });
});

describe("listFeatureRequests", () => {
  it("filters by status", async () => {
    await listFeatureRequests("open");
    expect(s.chain).toContain("order");
    expect(s.lastEq).toEqual(["status", "open"]);
  });
});

describe("submitFeatureRequest", () => {
  const input = { name: "Dark mode", authorName: "Hira Ahmed", description: "", useCase: "", priority: "p1" as const };

  it("inserts the suggestion with its author name", async () => {
    const r = await submitFeatureRequest(input);
    expect(r.ok).toBe(true);
    expect(s.chain).toContain("from:feature_requests");
    expect(s.lastInsert).toMatchObject({ author_name: "Hira Ahmed" });
  });

  it("rejects a blank author name before touching the database", async () => {
    const r = await submitFeatureRequest({ ...input, authorName: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/name/i);
    expect(s.chain).not.toContain("insert");
  });
});

describe("listReplies", () => {
  it("reads every reply in one ordered query", async () => {
    s.replyRows = [{ id: "r1", feature_id: "f1", author_name: "Ali", body: "ship it" }];
    const rows = await listReplies();
    expect(s.chain).toContain("from:feature_replies");
    expect(rows).toHaveLength(1);
    expect(rows[0].author_name).toBe("Ali");
  });
});

describe("submitReply", () => {
  it("inserts the reply with the author name and feature id", async () => {
    s.requestRow = { id: "r1", feature_id: "f1", author_name: "Ali", body: "ship it" };
    const r = await submitReply({ featureId: "f1", body: "  ship it  ", authorName: "  Ali  " });
    expect(r.ok).toBe(true);
    expect(s.chain).toContain("from:feature_replies");
    expect(s.lastInsert).toEqual({
      feature_id: "f1",
      user_id: "u1",
      author_name: "Ali",
      body: "ship it",
    });
  });

  it("rejects a blank name without hitting the database", async () => {
    const r = await submitReply({ featureId: "f1", body: "hi", authorName: "" });
    expect(r.ok).toBe(false);
    expect(s.chain).not.toContain("insert");
  });

  it("rejects an empty body without hitting the database", async () => {
    const r = await submitReply({ featureId: "f1", body: "   ", authorName: "Ali" });
    expect(r.ok).toBe(false);
    expect(s.chain).not.toContain("insert");
  });

  it("rejects when signed out", async () => {
    s.user = null;
    const r = await submitReply({ featureId: "f1", body: "hi", authorName: "Ali" });
    expect(r.ok).toBe(false);
    expect(s.chain).not.toContain("insert");
  });
});
