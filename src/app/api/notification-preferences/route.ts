import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAuth } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const defaults = {
  officialSourceUpdates: true,
  deadlineReminders: true,
  meritAndSelectionUpdates: true,
  weeklyActionDigest: false,
};

type PreferencePayload = Partial<typeof defaults>;

function validPayload(value: unknown): value is PreferencePayload {
  if (!value || typeof value !== "object") return false;
  const keys = Object.keys(value);
  const allowed = new Set(["officialSourceUpdates", "deadlineReminders", "meritAndSelectionUpdates", "weeklyActionDigest"]);
  return keys.every((key) => allowed.has(key)) && Object.values(value).every((item) => typeof item === "boolean");
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    const { data, error } = await auth.supabase
      .from("notification_preferences")
      .select("official_source_updates, deadline_reminders, merit_and_selection_updates, weekly_action_digest")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) return jsonError("Could not load notification preferences.", 500);
    return jsonOk({ preferences: data ? {
      officialSourceUpdates: data.official_source_updates,
      deadlineReminders: data.deadline_reminders,
      meritAndSelectionUpdates: data.merit_and_selection_updates,
      weeklyActionDigest: data.weekly_action_digest,
    } : defaults });
  } catch (error) {
    console.error("notification preferences read failed", error);
    return jsonError("Could not load notification preferences.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    if (!(await checkRateLimit(`notification-preferences:${auth.user.id}`, 30, 60 * 60 * 1000))) return jsonError("Too many updates. Try again shortly.", 429);
    const bodyResult = await parseJsonBody(request, 2_000);
    if (!bodyResult.ok) return bodyResult.error;
    const preferences = bodyResult.value as PreferencePayload;
    if (!validPayload(preferences) || Object.keys(preferences).length === 0) return jsonError("Choose valid notification preferences.", 400);

    const { data: existing, error: existingError } = await auth.supabase
      .from("notification_preferences")
      .select("official_source_updates, deadline_reminders, merit_and_selection_updates, weekly_action_digest")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (existingError) return jsonError("Could not save notification preferences.", 500);
    const next = {
      official_source_updates: preferences.officialSourceUpdates ?? existing?.official_source_updates ?? defaults.officialSourceUpdates,
      deadline_reminders: preferences.deadlineReminders ?? existing?.deadline_reminders ?? defaults.deadlineReminders,
      merit_and_selection_updates: preferences.meritAndSelectionUpdates ?? existing?.merit_and_selection_updates ?? defaults.meritAndSelectionUpdates,
      weekly_action_digest: preferences.weeklyActionDigest ?? existing?.weekly_action_digest ?? defaults.weeklyActionDigest,
    };
    const { error } = await auth.supabase.from("notification_preferences").upsert({ user_id: auth.user.id, ...next, updated_at: new Date().toISOString() });
    if (error) return jsonError("Could not save notification preferences.", 500);
    return jsonOk({ preferences: {
      officialSourceUpdates: next.official_source_updates,
      deadlineReminders: next.deadline_reminders,
      meritAndSelectionUpdates: next.merit_and_selection_updates,
      weeklyActionDigest: next.weekly_action_digest,
    } });
  } catch (error) {
    console.error("notification preferences update failed", error);
    return jsonError("Could not save notification preferences.", 500);
  }
}
