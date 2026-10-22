import { describe, expect, it } from "vitest";
import { adminReviewDigestSubject } from "./admin-review-alerts";

describe("admin source review digest", () => {
  it("uses singular and plural review wording", () => {
    expect(adminReviewDigestSubject(1)).toBe("1 source update needs review");
    expect(adminReviewDigestSubject(3)).toBe("3 source updates need review");
  });
});
