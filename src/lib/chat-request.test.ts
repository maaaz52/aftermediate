import { describe, expect, it } from "vitest";
import { PERSONAS, isPersona } from "@/lib/chat-request";
import { PERSONA_PROMPTS, streamChat } from "@/lib/ai";

describe("isPersona", () => {
  it("accepts every allowlisted persona", () => {
    for (const p of PERSONAS) {
      expect(isPersona(p), p).toBe(true);
    }
  });

  it("rejects look-alikes, junk and prototype keys", () => {
    for (const bad of [
      "Safar",
      "safar ",
      " assistant",
      "prototype",
      "__proto__",
      "constructor",
      "",
      null,
      undefined,
      123,
      {},
      [],
      true,
    ]) {
      expect(isPersona(bad), JSON.stringify(bad)).toBe(false);
    }
  });

  it("allows exactly the 7 shipped personas, no more", () => {
    expect([...PERSONAS].sort()).toEqual([
      "cv",
      "essay",
      "hunar",
      "qalam",
      "rahbar",
      "safar",
      "study",
    ]);
  });
});

describe("PERSONA_PROMPTS allowlist integrity", () => {
  it("has a prompt for every allowlisted persona and no extras", () => {
    expect(Object.keys(PERSONA_PROMPTS).sort()).toEqual([...PERSONAS].sort());
  });
});

describe("streamChat persona guard", () => {
  it("refuses to call the model with an unknown persona", () => {
    // Regression: an unvalidated persona resolved to PERSONA_PROMPTS["zzz"],
    // i.e. `system: undefined`, and Gemini answered with no persona at all.
    expect(() =>
      streamChat([{ role: "user", content: "hi" }], { persona: "zzz" as never })
    ).toThrow(/zzz/);
  });
});
