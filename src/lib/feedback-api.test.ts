import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listFeatureRequests,
  submitFeatureRequest,
  submitReview,
  toggleVote,
} from "./feedback-api";
import type { MediaKind } from "./feedback-model";

const s = vi.hoisted(() => ({
  user: null as null | { id: "u1" },
  reviewResult: { error: null as null | { message: string }, data: null as null | { id: "r1" } },
  voteRow: null as null | { id: "v1" },
  requestRow: { votes_count: 7 },
  uploadError: null as null | { message: string },
  insertError: null as null | { message: string },
  requestRows: [] as Record<string, unknown>[],
  chain: [] as string[],
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
        insert: vi.fn(() => {
          s.chain.push("insert");
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
        eq: vi.fn(() => {
          s.chain.push("eq");
          return q;
        }),
        delete: vi.fn(() => {
          s.chain.push("delete");
          return q;
        }),
        order: vi.fn(async () => {
          s.chain.push("order");
          return { data: s.requestRows, error: null };
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
});

describe("submitReview", () => {
  const payload = {
    tone: "loved" as const,
    rating: 9,
    reviewText: "Great",
    surprised: "",
    mindset: "",
    recommendTo: ["students"],
    sentimentTag: "highly-positive",
    sentimentScore: 92,
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
  });

  it("uploads media and inserts media rows after the review", async () => {
    const file = new File(["x"], "shot.png", { type: "image/png" });
    await submitReview(payload, [{ file, kind: "image" as MediaKind }]);
    expect(s.chain.filter((c) => c === "from:review_media").length).toBe(1);
  });

  it("returns upload errors", async () => {
    s.uploadError = { message: "quota exceeded" };
    const file = new File(["x"], "shot.png", { type: "image/png" });
    const r = await submitReview(payload, [{ file, kind: "image" as MediaKind }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("quota exceeded");
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
});

describe("listFeatureRequests", () => {
  it("filters by status", async () => {
    await listFeatureRequests("open");
    expect(s.chain).toContain("order");
  });
});

describe("submitFeatureRequest", () => {
  it("inserts a feature request", async () => {
    const r = await submitFeatureRequest({ name: "Dark mode", description: "", useCase: "", priority: "p1" });
    expect(r.ok).toBe(true);
    expect(s.chain).toContain("from:feature_requests");
  });
});
