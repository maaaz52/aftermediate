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
    expect(url).toContain("X-Amz-Expires=600");
    expect(url).toContain("X-Amz-Signature=");
    expect(url).toContain("/mdcat/lecture-01.mp4");
  });

  // Official AWS S3 presigned-URL worked example (SigV4 query-string auth).
  // Fixed host + date prove the canonical request, string-to-sign and signing
  // chain are spec-correct — a structural test can't catch a wrong HMAC order.
  it("matches the AWS S3 presigned-URL worked example signature", () => {
    const url = presignR2GetUrl(
      {
        accountId: "us-east-1",
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
    expect(sig).toBe("aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404");
  });
});