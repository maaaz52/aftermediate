import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAuth } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFollowEntityType } from "@/lib/source-follow";
import { isApplicationStatus } from "@/lib/application-tracker";

export const runtime = "nodejs";

type FollowRow = { entity_type: unknown; entity_id: unknown };
type MonitorRow = { entity_type: unknown; entity_id: unknown; label: unknown } | { entity_type: unknown; entity_id: unknown; label: unknown }[] | null;

function monitorValue(monitor: MonitorRow) {
  return Array.isArray(monitor) ? monitor[0] ?? null : monitor;
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;

    const { data: followRows, error: followsError } = await auth.supabase
      .from("source_follows")
      .select("entity_type, entity_id")
      .eq("user_id", auth.user.id);
    if (followsError) return jsonError("Could not load your followed items.", 500);

    const follows = ((followRows ?? []) as FollowRow[]).flatMap((follow) => (
      isFollowEntityType(follow.entity_type) && typeof follow.entity_id === "string"
        ? [{ entityType: follow.entity_type, entityId: follow.entity_id }]
        : []
    ));
    if (follows.length === 0) return jsonOk({ follows, deadlines: [], updates: [], plans: [] });

    const followed = new Set(follows.map((follow) => `${follow.entityType}:${follow.entityId}`));
    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    const [deadlinesResult, updatesResult, plansResult] = await Promise.all([
      admin
        .from("official_deadline_events")
        .select("entity_type, entity_id, label, due_date, official_url")
        .gte("due_date", today)
        .order("due_date", { ascending: true })
        .limit(100),
      admin
        .from("source_update_candidates")
        .select("summary, official_url, alert_kind, reviewed_at, source_monitors!inner(entity_type, entity_id, label)")
        .eq("status", "approved")
        .order("reviewed_at", { ascending: false })
        .limit(100),
      auth.supabase
        .from("application_tracker_entries")
        .select("entity_type, entity_id, status, note, updated_at")
        .eq("user_id", auth.user.id),
    ]);

    if (deadlinesResult.error || updatesResult.error || plansResult.error) {
      console.error("my updates lookup failed", deadlinesResult.error?.message ?? updatesResult.error?.message ?? plansResult.error?.message);
      return jsonError("Could not load your updates.", 500);
    }

    const deadlines = (deadlinesResult.data ?? []).flatMap((deadline) => (
      isFollowEntityType(deadline.entity_type) && typeof deadline.entity_id === "string" &&
      followed.has(`${deadline.entity_type}:${deadline.entity_id}`) &&
      typeof deadline.label === "string" && typeof deadline.due_date === "string" && typeof deadline.official_url === "string"
        ? [{ entityType: deadline.entity_type, entityId: deadline.entity_id, label: deadline.label, dueDate: deadline.due_date, officialUrl: deadline.official_url }]
        : []
    )).slice(0, 8);

    const updates = (updatesResult.data ?? []).flatMap((update) => {
      const monitor = monitorValue(update.source_monitors as MonitorRow);
      if (!monitor || !isFollowEntityType(monitor.entity_type) || typeof monitor.entity_id !== "string" || !followed.has(`${monitor.entity_type}:${monitor.entity_id}`)) return [];
      if (typeof update.summary !== "string" || typeof update.official_url !== "string" || typeof update.reviewed_at !== "string") return [];
      return [{
        entityType: monitor.entity_type,
        entityId: monitor.entity_id,
        entityLabel: typeof monitor.label === "string" ? monitor.label : "Official source update",
        summary: update.summary,
        officialUrl: update.official_url,
        alertKind: update.alert_kind === "merit-list" || update.alert_kind === "selection-update" ? update.alert_kind : "general",
        reviewedAt: update.reviewed_at,
      }];
    }).slice(0, 8);

    const plans = (plansResult.data ?? []).flatMap((plan) => (
      isFollowEntityType(plan.entity_type) && typeof plan.entity_id === "string" &&
      followed.has(`${plan.entity_type}:${plan.entity_id}`) && isApplicationStatus(plan.status) &&
      typeof plan.note === "string" && typeof plan.updated_at === "string"
        ? [{ entityType: plan.entity_type, entityId: plan.entity_id, status: plan.status, note: plan.note, updatedAt: plan.updated_at }]
        : []
    ));

    return jsonOk({ follows, deadlines, updates, plans });
  } catch (error) {
    console.error("my updates route failed", error);
    return jsonError("Could not load your updates.", 500);
  }
}
