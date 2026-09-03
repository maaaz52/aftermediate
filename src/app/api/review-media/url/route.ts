import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/require-user";
import { jsonError, jsonOk } from "@/lib/api-response";

export const runtime = "nodejs";

/**
 * Returns a short-lived signed URL for a review media object, but only when the
 * caller may see it: the review's owner, or a published review. The storage
 * bucket is private, so this is the only way the UI can render review media.
 *
 * GET /api/review-media/url?path=<storage path>
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    if (!user) return jsonError("Unauthorized", 401);

    const url = new URL(req.url);
    const path = url.searchParams.get("path");
    if (!path || typeof path !== "string" || path.length > 512) {
      return jsonError("path query param required", 400);
    }
    // Only objects inside the review-media bucket's user folder are allowed.
    if (!path.startsWith(`${user.id}/`)) {
      return jsonError("Forbidden", 403);
    }

    // The review must belong to the caller or be published.
    const { data: media } = await supabase
      .from("review_media")
      .select("review_id")
      .eq("url", path)
      .maybeSingle();

    if (!media) return jsonError("Not found", 404);

    const { data: review } = await supabase
      .from("reviews")
      .select("user_id, status")
      .eq("id", media.review_id)
      .maybeSingle();

    if (!review) return jsonError("Not found", 404);
    if (review.status !== "published" && review.user_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const { data: signed } = await supabase.storage
      .from("review-media")
      .createSignedUrl(path, 60); // 60 seconds

    if (!signed?.signedUrl) return jsonError("Could not create signed URL", 500);

    return jsonOk({ url: signed.signedUrl });
  } catch (err) {
    console.error("review media url error", err);
    return jsonError("Internal server error", 500);
  }
}