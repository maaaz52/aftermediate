import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateText(...args),
  streamText: vi.fn(),
}));

vi.mock("@ai-sdk/google", () => ({ google: () => "mock-model" }));

import { generateStructured } from "@/lib/ai";

type CallOptions = {
  maxRetries?: number;
  abortSignal?: AbortSignal;
};

const optionsOfFirstCall = (): CallOptions =>
  generateText.mock.calls[0][0] as CallOptions;

describe("generateStructured", () => {
  beforeEach(() => {
    generateText.mock.calls.length = 0;
    generateText.mockReset();
  });

  it("bounds the call so an upstream outage cannot hold the request for minutes", async () => {
    // Gemini answers 503 "high demand" under load, and every attempt is
    // retryable. With the SDK's default of 2 retries and no deadline, one
    // spike kept /api/demand running for 2.4 minutes before failing anyway.
    generateText.mockResolvedValue({ text: '{"ok":true}' });

    await generateStructured("prompt", "system");

    const options = optionsOfFirstCall();
    expect(options.maxRetries, "retries must be capped below the SDK default of 2").toBeLessThanOrEqual(1);
    expect(options.abortSignal, "a deadline must bound total wall time").toBeInstanceOf(AbortSignal);
    expect(options.abortSignal?.aborted).toBe(false);
  });

  it("reports a model reply that contains no JSON object instead of throwing SyntaxError", async () => {
    // indexOf("{") returns -1 on a prose reply, so the old slice produced ""
    // and JSON.parse died with "Unexpected end of JSON input" — a message
    // that says nothing about which upstream call actually misbehaved.
    generateText.mockResolvedValue({ text: "Sorry, I cannot help with that." });

    await expect(generateStructured("prompt", "system")).rejects.toThrow(/no JSON object/i);
  });

  it("reports an empty model reply the same way", async () => {
    generateText.mockResolvedValue({ text: "" });

    await expect(generateStructured("prompt", "system")).rejects.toThrow(/no JSON object/i);
  });

  it("still parses a fenced json block", async () => {
    generateText.mockResolvedValue({ text: '```json\n{"insights":[{"country":"Germany"}]}\n```' });

    await expect(generateStructured("prompt", "system")).resolves.toEqual({
      insights: [{ country: "Germany" }],
    });
  });

  it("still parses a bare object with surrounding prose", async () => {
    generateText.mockResolvedValue({ text: 'Here you go: {"insights":[]} hope that helps' });

    await expect(generateStructured("prompt", "system")).resolves.toEqual({ insights: [] });
  });
});
