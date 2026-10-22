import { NextResponse } from "next/server";
import { isConfiguredAdmin } from "@/lib/admin-access";
import { jsonError } from "@/lib/api-response";
import { requireAuth, parseJsonBody } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { dispatchSourceUpdateAlerts } from "@/lib/source-update-alerts";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 4 * 1024;
const CALENDAR_EVENT_TYPES = new Set(["announcement", "application", "test", "merit", "fee", "intake"]);

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    if (!isConfiguredAdmin(auth.user.email)) return jsonError("Forbidden", 403);
    if (!(await checkRateLimit(`source-review:${auth.user.id}`, 30, 60 * 60 * 1000))) {
      return jsonError("Too many review requests. Try again later.", 429);
    }

    const bodyResult = await parseJsonBody(request, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const body = bodyResult.value as {
      candidateId?: unknown;
      decision?: unknown;
      note?: unknown;
      eventType?: unknown;
      timingLabel?: unknown;
    };
    const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
    const decision = body.decision === "approved" || body.decision === "rejected" ? body.decision : null;
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const eventType = typeof body.eventType === "string" && CALENDAR_EVENT_TYPES.has(body.eventType) ? body.eventType : null;
    const timingLabel = typeof body.timingLabel === "string" ? body.timingLabel.trim() : null;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) {
      return jsonError("Invalid source update", 400);
    }
    if (!decision) return jsonError("Choose approve or reject", 400);
    if (note.length > 1000) return jsonError("Review note is too long", 400);
    if ((eventType === null) !== (timingLabel === null) || (timingLabel !== null && (timingLabel.length === 0 || timingLabel.length > 120))) {
      return jsonError("Enter a valid calendar event and confirmed timing together", 400);
    }
    if (eventType && decision !== "approved") return jsonError("Only approved updates can confirm a calendar date", 400);

    const { error } = await createAdminClient().rpc("review_source_update", {
      p_candidate_id: candidateId,
      p_status: decision,
      p_review_note: note,
      p_reviewer: auth.user.id,
      p_event_type: eventType,
      p_timing_label: timingLabel,
    });
    if (error) {
      console.error("source review failed", error.message);
      return jsonError(error.message.includes("already been reviewed") ? error.message : "Could not save this review", error.message.includes("already been reviewed") ? 409 : 500);
    }

    // The review is already committed above. Delivery failures remain queued
    // for the weekly monitor retry and never undo an administrator's review.
    const delivery = decision === "approved" ? await dispatchSourceUpdateAlerts() : null;
    return NextResponse.json({ ok: true, delivery });
  } catch (error) {
    console.error("source review route failed", error);
    return jsonError("Internal server error", 500);
  }
}
