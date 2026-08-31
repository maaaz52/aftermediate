import { describe, expect, it } from "vitest";
import {
  analyzeSentiment,
  CLOSINGS,
  mediaKindFor,
  PERSONAS,
  PRIORITIES,
  TONE_META,
  validateMedia,
} from "./feedback-model";

describe("constants", () => {
  it("exposes 5 tone levels with icons in order", () => {
    expect(TONE_META).toHaveLength(5);
    expect(TONE_META.map((t) => t.icon)).toEqual(["Laugh", "Smile", "Meh", "Frown", "Angry"]);
    expect(TONE_META.map((t) => t.label)).toEqual([
      "Loved it", "Liked it", "Meh", "Disappointed", "Frustrated",
    ]);
  });

  it("exposes 4 personas", () => {
    expect(PERSONAS.map((p) => p.id)).toEqual(["students", "professionals", "beginners", "educators"]);
  });

  it("exposes p0/p1/p2 priorities", () => {
    expect(PRIORITIES.map((p) => p.id)).toEqual(["p0", "p1", "p2"]);
  });

  it("has a closing message for every tone", () => {
    for (const t of TONE_META) {
      expect(CLOSINGS[t.id]).toBeTruthy();
    }
  });
});

describe("analyzeSentiment", () => {
  it("maps tone base scores to tags", () => {
    expect(analyzeSentiment("loved", 10).tag).toBe("highly-positive");
    expect(analyzeSentiment("frustrated", 0).tag).toBe("critical");
  });

  it("shifts score by rating (full 40-point swing)", () => {
    const low = analyzeSentiment("meh", 0).score;
    const high = analyzeSentiment("meh", 10).score;
    expect(high - low).toBe(40);
  });

  it("boosts with positive lexicon", () => {
    expect(analyzeSentiment("meh", 10, "amazing incredible fantastic awesome").tag).toBe("highly-positive");
  });

  it("penalizes with negative lexicon", () => {
    expect(analyzeSentiment("frustrated", 5, "broken and confusing").score).toBeLessThanOrEqual(10);
  });

  it("applies a constructive-cue penalty", () => {
    const plain = analyzeSentiment("liked", 5, "it was great");
    const cued = analyzeSentiment("liked", 5, "it was great but could improve");
    expect(cued.score).toBeLessThan(plain.score);
  });

  it("clamps score to 0..100", () => {
    expect(analyzeSentiment("loved", 10, "amazing incredible fantastic").score).toBe(100);
    expect(analyzeSentiment("frustrated", 0, "terrible awful useless").score).toBe(0);
  });

  it("uses 85/60/40 tag boundaries", () => {
    expect(analyzeSentiment("loved", 5).score).toBeGreaterThanOrEqual(85);
    expect(analyzeSentiment("liked", 5).score).toBe(70);
    expect(analyzeSentiment("meh", 5).score).toBe(50);
    expect(analyzeSentiment("disappointed", 5).score).toBe(30);
    expect(analyzeSentiment("loved", 5).tag).toBe("highly-positive");
    expect(analyzeSentiment("liked", 5).tag).toBe("positive");
    expect(analyzeSentiment("meh", 5).tag).toBe("constructive");
    expect(analyzeSentiment("disappointed", 5).tag).toBe("critical");
  });

  it("summarizes with rating extremes first", () => {
    expect(analyzeSentiment("meh", 9, "whatever").summary).toBe("Rated 9/10");
    expect(analyzeSentiment("meh", 2, "whatever").summary).toBe("Rated 2/10");
  });

  it("summarizes with the first lexicon phrase", () => {
    const s = analyzeSentiment("meh", 5, "the mentor matching was amazing and I loved it");
    expect(s.summary).toContain("amazing");
    expect(s.summary.split(" ").length).toBeLessThanOrEqual(8);
  });

  it("falls back to a tone summary", () => {
    expect(analyzeSentiment("loved", 5, "nothing special here").summary).toBe("Shared a loved experience");
  });
});

describe("media validation", () => {
  it("detects media kinds", () => {
    expect(mediaKindFor({ type: "image/png" })).toBe("image");
    expect(mediaKindFor({ type: "video/mp4" })).toBe("video");
    expect(mediaKindFor({ type: "audio/mpeg" })).toBe("audio");
    expect(mediaKindFor({ type: "application/pdf" })).toBeNull();
  });

  it("rejects unsupported file types", () => {
    const r = validateMedia({ type: "application/pdf", size: 10 } as File);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Unsupported");
  });

  it("enforces image 5MB limit", () => {
    expect(validateMedia({ type: "image/png", size: 6 * 1024 * 1024 } as File).ok).toBe(false);
    expect(validateMedia({ type: "image/png", size: 4 * 1024 * 1024 } as File).ok).toBe(true);
  });

  it("allows video and audio up to 25MB", () => {
    expect(validateMedia({ type: "video/mp4", size: 25 * 1024 * 1024 } as File).ok).toBe(true);
    expect(validateMedia({ type: "audio/mpeg", size: 25 * 1024 * 1024 + 1 } as File).ok).toBe(false);
  });
});
