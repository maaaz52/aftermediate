import { createHmac, createHash } from "crypto";

/**
 * Cloudflare R2 is S3-compatible, so a presigned GET URL is just S3 SigV4
 * with the R2 endpoint. Hand-rolled here (no @aws-sdk dependency): the spec
 * is stable and R2 accepts standard SigV4.
 */

const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function iso8601(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export function r2Endpoint(cfg: R2Config): string {
  return `https://${cfg.accountId}.r2.cloudflarestorage.com`;
}

/** Signing inputs, overridable for known-answer testing (AWS SigV4 vectors). */
interface SignOptions {
  host?: string;
  date?: Date;
}

/**
 * Presign a GET request for an R2 object. The URL is valid for `expiresSecs`
 * and lets a signed-in student stream the object without public bucket access.
 */
export function presignR2GetUrl(
  cfg: R2Config,
  key: string,
  expiresSecs = 3600,
  opts: SignOptions = {}
): string {
  const host = opts.host ?? `${cfg.bucket}.${cfg.accountId}.r2.cloudflarestorage.com`;
  const now = opts.date ?? new Date();
  const amzDate = iso8601(now);
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${cfg.accountId}/s3/aws4_request`;

  const canonicalQuery = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${encodeURIComponent(`${cfg.accessKeyId}/${scope}`)}`,
    `X-Amz-Date=${amzDate}`,
    `X-Amz-Expires=${expiresSecs}`,
    `X-Amz-SignedHeaders=host`,
  ].join("&");

  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [
    "GET",
    `/${key}`,
    canonicalQuery,
    canonicalHeaders,
    "host",
    UNSIGNED_PAYLOAD,
  ].join("\n");

  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");

  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, cfg.accountId);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  return `https://${host}/${key}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}