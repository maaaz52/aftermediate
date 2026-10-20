import { describe, expect, it } from "vitest";
import { presignR2GetUrl, r2Endpoint } from "./r2";

describe("r2 presigning", () => {
  it("builds the cloudflare endpoint", () => {
    expect(
      r2Endpoint({ accountId: "abc", accessKeyId: "a", secretAccessKey: "s", bucket: "b" })
    ).toBe("https://abc.r2.cloudflarestorage.com");
  });

  it("produces a well-formed presigned URL for a nested key", () => {
    const url = presignR2GetUrl(
      {
        accountId: "abc",
        accessKeyId: "keyid",
        secretAccessKey: "secret",
        bucket: "media",
      },
      "mdcat/lecture-01.mp4",
      600
    );
    expect(url).toMatch(/^https:\/\/media\.abc\.r2\.cloudflarestorage\.com\//);
    expect(url).toContain("X-Amz-Algorithm=AWS4-HMAC-SHA256");
    expect(url).toContain("X-Amz-Credential=keyid%2F");
    expect(decodeURIComponent(url)).toContain("/auto/s3/aws4_request");
    expect(url).toContain("X-Amz-Expires=600");
    expect(url).toContain("X-Amz-Signature=");
    expect(url).toContain("/mdcat/lecture-01.mp4");
  });

  it("uses the same AWS encoding in the signed path and returned URL", () => {
    const url = presignR2GetUrl(
      { accountId: "abc", accessKeyId: "keyid", secretAccessKey: "secret", bucket: "media" },
      "lectures/part 1+(intro).mp4",
      600,
      { date: new Date("2026-10-20T00:00:00.000Z") }
    );
    expect(url).toContain("/lectures/part%201%2B%28intro%29.mp4?");
  });

  it("uses R2's auto region in deterministic SigV4 credentials", () => {
    const url = presignR2GetUrl(
      {
        accountId: "example-account",
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        bucket: "examplebucket",
      },
      "test.txt",
      86400,
      {
        host: "examplebucket.s3.amazonaws.com",
        date: new Date("2013-05-24T00:00:00.000Z"),
      }
    );
    const sig = url.match(/X-Amz-Signature=([0-9a-f]{64})/)?.[1];
    expect(sig).toBe("f23a4f38e39d60326a7b7c72db5ebcc6d137bf2707c41815bd8037f785d98d93");
    expect(decodeURIComponent(url)).toContain("/auto/s3/aws4_request");
  });
});
