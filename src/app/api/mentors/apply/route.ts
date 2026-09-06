import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Per-IP cap so a scripted client cannot bury the mentor-review queue. */
const IP_APPLY_MAX = 5;
const IP_WINDOW_MS = 60 * 60 * 1000;

/**
 * Receives a mentor application, stores it in mentor_applications. The anon
 * role is revoked from the table (RLS), so this validated, rate-limited route
 * is the only insert path.
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(`mentor-apply:${ip}`, IP_APPLY_MAX, IP_WINDOW_MS)) {
      return jsonError("Too many applications from this device. Try again later.", 429);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const body = bodyResult.value as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const institution = typeof body.institution === "string" ? body.institution.trim() : "";
    const degree = typeof body.degree === "string" ? body.degree.trim() : "";
    const field = typeof body.field === "string" ? body.field.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const topics = typeof body.topics === "string" ? body.topics.trim() : "";
    const socialLink = typeof body.socialLink === "string" ? body.socialLink.trim() : "";

    if (!name || name.length > 100) return jsonError("Enter your name.", 400);
    if (!EMAIL_RE.test(email) || email.length > 200) return jsonError("Enter a valid email address.", 400);
    if (!institution || !degree || !field || !bio || !topics || !socialLink) {
      return jsonError("All fields are required.", 400);
    }

    const { error } = await supabase.rpc("insert_mentor_application", {
      p_user_id: user?.id ?? null,
      p_name: name,
      p_email: email,
      p_institution: institution,
      p_degree: degree,
      p_field: field,
      p_bio: bio,
      p_topics: topics,
      p_social_link: socialLink,
    });
    if (error) {
      console.error("mentor apply: insert error", error.message);
      return jsonError("Could not save your application.", 500);
    }

    return jsonOk({ ok: true });
  } catch (err) {
    console.error("mentor apply error", err);
    return jsonError("Internal server error", 500);
  }
}