import { jsonError, jsonOk } from "@/lib/api-response";
import { isApplicationStatus } from "@/lib/application-tracker";
import { parseJsonBody, requireAuth } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { isFollowableEntity, isFollowEntityType } from "@/lib/source-follow";
import { validCompletedTaskIds } from "@/lib/application-checklist";

export const runtime = "nodejs";

type TrackerPayload = { entityType?: unknown; entityId?: unknown; status?: unknown; note?: unknown; completedTaskIds?: unknown };

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    const { data, error } = await auth.supabase
      .from("application_tracker_entries")
      .select("entity_type, entity_id, status, note, completed_task_ids, updated_at")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false });
    if (error) return jsonError("Could not load your application plan.", 500);
    return jsonOk({ entries: data ?? [] });
  } catch (error) {
    console.error("application tracker read failed", error);
    return jsonError("Could not load your application plan.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    if (!(await checkRateLimit(`application-tracker:${auth.user.id}`, 60, 60 * 60 * 1000))) {
      return jsonError("Too many updates. Try again in a moment.", 429);
    }
    const bodyResult = await parseJsonBody(request, 3_000);
    if (!bodyResult.ok) return bodyResult.error;
    const body = bodyResult.value as TrackerPayload | null;
    if (!body || !isFollowEntityType(body.entityType) || !isFollowableEntity(body.entityType, body.entityId) || !isApplicationStatus(body.status)) {
      return jsonError("Choose a valid followed item and status.", 400);
    }
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length > 1000) return jsonError("Your note is too long.", 400);
    const completedTaskIds = validCompletedTaskIds(body.entityType, body.entityId, body.completedTaskIds ?? []);
    if (!completedTaskIds) return jsonError("Your checklist contains an invalid task.", 400);

    const { data: follow, error: followError } = await auth.supabase
      .from("source_follows")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("entity_type", body.entityType)
      .eq("entity_id", body.entityId)
      .maybeSingle();
    if (followError) return jsonError("Could not verify the followed item.", 500);
    if (!follow) return jsonError("Follow this item before adding it to your plan.", 400);

    const now = new Date().toISOString();
    const { error } = await auth.supabase.from("application_tracker_entries").upsert(
      { user_id: auth.user.id, entity_type: body.entityType, entity_id: body.entityId, status: body.status, note, completed_task_ids: completedTaskIds, updated_at: now },
      { onConflict: "user_id,entity_type,entity_id" }
    );
    if (error) return jsonError("Could not save your application plan.", 500);
    return jsonOk({ ok: true, updatedAt: now });
  } catch (error) {
    console.error("application tracker update failed", error);
    return jsonError("Could not save your application plan.", 500);
  }
}
