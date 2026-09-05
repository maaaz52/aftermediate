import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/require-user";
import { jsonError, jsonOk } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { presignR2GetUrl } from "@/lib/r2";
import contentJson from "@/data/test-prep-content.json";

export const runtime = "nodejs";

const KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
];

/** Only these R2 objects are ever signed — a request for any other key is rejected. */
const ALLOWED_KEYS = new Set(
  (contentJson as unknown as { content: { videos: { r2Key: string }[] }[] }).content.flatMap(
    (c) => c.videos.map((v) => v.r2Key)
  )
);

/**
 * Returns a short-lived presigned URL for a Cloudflare R2 video so signed-in
 * students can stream test-prep lectures without the bucket being public.
 *
 * The key must be one of the videos referenced in test-prep-content.json —
 * signing arbitrary keys would let a signed-in user read any object in the
 * bucket, not just test-prep content.
 *
 * GET /api/test-prep/video?key=<r2 key>
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    if (!user) return jsonError("Unauthorized", 401);

    // Signed URLs are cheap but per-user; a scripted client shouldn't be able
    // to mint thousands. 20/min is generous for a student browsing lectures.
    if (!checkRateLimit(`r2:${user.id}`, 20, 60_000)) {
      return jsonError("Too many requests", 429);
    }

    const key = new URL(req.url).searchParams.get("key");
    if (!key || typeof key !== "string" || key.length > 512 || !ALLOWED_KEYS.has(key)) {
      return jsonError("Invalid key", 400);
    }

    const missing = KEYS.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      console.error("R2 env not configured:", missing.join(", "));
      return jsonError("R2 not configured", 503);
    }

    const url = presignR2GetUrl(
      {
        accountId: process.env.R2_ACCOUNT_ID!,
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        bucket: process.env.R2_BUCKET!,
      },
      key,
      3600
    );
    return jsonOk({ url });
  } catch (err) {
    console.error("test-prep video error", err);
    return jsonError("Internal server error", 500);
  }
}