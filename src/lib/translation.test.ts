import { describe, expect, it } from "vitest";
import { isTranslatableText, normalizeTranslations } from "@/lib/translation";

describe("translation input validation", () => {
  it("accepts reader-facing text and excludes identifiers that must not be translated", () => {
    expect(isTranslatableText("Compare scholarships for your future")).toBe(true);
    expect(isTranslatableText("PKR 250,000")).toBe(false);
    expect(isTranslatableText("https://www.aftermediate.site")).toBe(false);
    expect(isTranslatableText("student@example.com")).toBe(false);
    expect(isTranslatableText("aftermediate")).toBe(false);
  });

  it("only keeps complete, safe translated values", () => {
    expect(normalizeTranslations({ "0": "جامعات", "1": 123, "extra": "نظر انداز" }, ["0", "1"])).toEqual({ "0": "جامعات" });
  });
});
