import { describe, expect, it, vi } from "vitest";
import { encodeChatStreamEvent, readChatStreamResponse } from "./chat-stream-protocol";

function responseFrom(events: Parameters<typeof encodeChatStreamEvent>[0][]) {
  return new Response(new ReadableStream({
    start(controller) {
      for (const event of events) controller.enqueue(encodeChatStreamEvent(event));
      controller.close();
    },
  }), { status: 200 });
}

describe("chat stream protocol", () => {
  it("joins deltas only after an explicit completion event", async () => {
    const onText = vi.fn();
    await expect(readChatStreamResponse(responseFrom([
      { type: "delta", text: "Hello" },
      { type: "delta", text: " there" },
      { type: "done" },
    ]), onText)).resolves.toBe("Hello there");
    expect(onText).toHaveBeenLastCalledWith("Hello there");
  });

  it("discards an incomplete primary answer when the server switches providers", async () => {
    await expect(readChatStreamResponse(responseFrom([
      { type: "delta", text: "Applying is done through" },
      { type: "reset" },
      { type: "delta", text: "Apply through the official portal." },
      { type: "done" },
    ]), () => undefined)).resolves.toBe("Apply through the official portal.");
  });

  it("rejects a stream that closes without confirmation", async () => {
    await expect(readChatStreamResponse(responseFrom([
      { type: "delta", text: "Half an answer" },
    ]), () => undefined)).rejects.toThrow(/before completion/i);
  });
});
