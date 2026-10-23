import { describe, expect, it } from "vitest";
import { normalizeChatMarkdown } from "@/components/message-content";

describe("normalizeChatMarkdown", () => {
  it("repairs heading markers that have no following space", () => {
    expect(normalizeChatMarkdown("##Next steps\n###Important note")).toBe(
      "## Next steps\n### Important note"
    );
  });

  it("repairs common compact list markers without changing emphasis", () => {
    expect(normalizeChatMarkdown("-First item\n1.First step\n**Keep this bold**")).toBe(
      "- First item\n1. First step\n**Keep this bold**"
    );
  });

  it("normalizes LaTeX display delimiters emitted by different providers", () => {
    expect(normalizeChatMarkdown("\\[x^2 + y^2\\]")).toBe("$$\nx^2 + y^2\n$$");
  });
});
