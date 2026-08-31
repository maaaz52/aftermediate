import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/chat-prompt";
import { PERSONAS } from "@/lib/chat-request";

const MARKERS: Record<string, string> = {
  rahbar: "Rahbar",
  study: "Ustaad",
  essay: "essay coach",
  cv: "ATS-friendly",
  safar: "Safar",
  hunar: "Hunar",
  qalam: "Qalam",
};

describe("buildSystemPrompt", () => {
  it("gives every persona its own identity", () => {
    for (const persona of PERSONAS) {
      const prompt = buildSystemPrompt({ persona });
      expect(prompt.length, persona).toBeGreaterThan(200);
      expect(prompt.includes(MARKERS[persona]), `${persona} marker`).toBe(true);
    }
  });

  it("never renders the words undefined or NaN", () => {
    for (const persona of PERSONAS) {
      const prompt = buildSystemPrompt({ persona });
      expect(prompt.includes("undefined"), persona).toBe(false);
      expect(prompt.includes("NaN"), persona).toBe(false);
    }
  });
});
