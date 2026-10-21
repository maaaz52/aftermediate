import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateText, streamText, createOpenAICompatible } = vi.hoisted(() => {
  process.env.NVIDIA_API_KEY = "nvidia-test-key";
  const nvidiaProvider = Object.assign(() => "nvidia-model", { languageModel: () => "nvidia-model" });
  return {
    generateText: vi.fn(),
    streamText: vi.fn(),
    createOpenAICompatible: vi.fn((options: unknown) => {
      void options;
      return nvidiaProvider;
    }),
  };
});

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateText(...args),
  streamText: (...args: unknown[]) => streamText(...args),
}));

vi.mock("@ai-sdk/google", () => ({ google: () => "mock-model" }));
vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: (options: unknown) => createOpenAICompatible(options),
}));

import { CHAT_MAX_OUTPUT_TOKENS, generateStructured, streamChat } from "@/lib/ai";

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
    streamText.mockReset();
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

  it("lets callers reject structurally invalid model JSON", async () => {
    generateText.mockResolvedValue({ text: '{"insights":"not-an-array"}' });

    await expect(
      generateStructured("prompt", "system", (value) => {
        if (!value || typeof value !== "object" || !Array.isArray((value as { insights?: unknown }).insights)) {
          throw new Error("invalid shape");
        }
        return value;
      })
    ).rejects.toThrow("invalid shape");
  });

  it("uses NVIDIA only after a retryable Gemini failure", async () => {
    generateText
      .mockRejectedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce({ text: '{"ok":true}' });

    await expect(generateStructured("prompt", "system")).resolves.toEqual({ ok: true });

    expect(generateText).toHaveBeenCalledTimes(2);
    expect(generateText.mock.calls[0][0].model).toBe("mock-model");
    expect(generateText.mock.calls[1][0].model).toBe("nvidia-model");
    expect(createOpenAICompatible).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: "https://integrate.api.nvidia.com/v1",
      name: "nvidia",
    }));
  });

  it("does not send invalid Gemini requests to NVIDIA", async () => {
    generateText.mockRejectedValue({ statusCode: 400 });

    await expect(generateStructured("prompt", "system")).rejects.toMatchObject({ statusCode: 400 });
    expect(generateText).toHaveBeenCalledTimes(1);
  });
});

describe("streamChat", () => {
  beforeEach(() => {
    streamText.mockReset();
  });

  it("uses a short-output, no-retry stream so provider failover can begin promptly", async () => {
    streamText.mockReturnValue({
      textStream: (async function* () {
        yield "Hello";
      })(),
    });

    const response = streamChat(
      [{ role: "user", content: "hi" }],
      { persona: "rahbar" }
    ).toTextStreamResponse();

    expect(await response.text()).toBe("Hello");
    expect(streamText).toHaveBeenCalledWith(expect.objectContaining({
      maxRetries: 0,
      maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
    }));
  });

  it("switches providers when the primary stream fails before emitting text", async () => {
    streamText
      .mockReturnValueOnce({
        textStream: (async function* () {
          throw { statusCode: 503 };
        })(),
      })
      .mockReturnValueOnce({
        textStream: (async function* () {
          yield "Recovered";
        })(),
      });

    const response = streamChat(
      [{ role: "user", content: "hi" }],
      { persona: "rahbar" }
    ).toTextStreamResponse();

    expect(await response.text()).toBe("Recovered");
    expect(streamText).toHaveBeenCalledTimes(2);
    expect(streamText.mock.calls[0][0].model).toBe("mock-model");
    expect(streamText.mock.calls[1][0].model).toBe("nvidia-model");
  });
});
