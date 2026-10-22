import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAuth } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  isFollowableEntity,
  isFollowEntityType,
  type FollowEntityType,
} from "@/lib/source-follow";

export const runtime = "nodejs";

const RATE_MAX = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

type FollowPayload = { entityType?: unknown; entityId?: unknown };

function parseFollowPayload(value: unknown): { type: FollowEntityType; id: string } | null {
  const payload = value as FollowPayload | null;
  if (!payload || !isFollowEntityType(payload.entityType)) return null;
  if (!isFollowableEntity(payload.entityType, payload.entityId)) return null;
  return { type: payload.entityType, id: payload.entityId };
}

async function rateLimit(userId: string) {
  return checkRateLimit(`source-follows:${userId}`, RATE_MAX, RATE_WINDOW_MS);
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;

    const { data, error } = await auth.supabase
      .from("source_follows")
      .select("entity_type, entity_id")
      .eq("user_id", auth.user.id);

    if (error) {
      console.error("source follows read error", error);
      return jsonError("Could not load your follows.", 500);
    }
    return jsonOk({ follows: data ?? [] });
  } catch (error) {
    console.error("source follows read error", error);
    return jsonError("Could not load your follows.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    if (!(await rateLimit(auth.user.id))) return jsonError("Too many requests. Try again in a moment.", 429);

    const body = await parseJsonBody(req, 2_000);
    if (!body.ok) return body.error;
    const follow = parseFollowPayload(body.value);
    if (!follow) return jsonError("That university or scholarship cannot be followed.", 400);

    const { error } = await auth.supabase.from("source_follows").upsert(
      { user_id: auth.user.id, entity_type: follow.type, entity_id: follow.id },
      { onConflict: "user_id,entity_type,entity_id", ignoreDuplicates: true }
    );
    if (error) {
      console.error("source follow create error", error);
      return jsonError("Could not save your follow.", 500);
    }
    return jsonOk({ following: true });
  } catch (error) {
    console.error("source follow create error", error);
    return jsonError("Could not save your follow.", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    if (!(await rateLimit(auth.user.id))) return jsonError("Too many requests. Try again in a moment.", 429);

    const body = await parseJsonBody(req, 2_000);
    if (!body.ok) return body.error;
    const follow = parseFollowPayload(body.value);
    if (!follow) return jsonError("That university or scholarship cannot be unfollowed.", 400);

    const { error } = await auth.supabase
      .from("source_follows")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("entity_type", follow.type)
      .eq("entity_id", follow.id);
    if (error) {
      console.error("source follow delete error", error);
      return jsonError("Could not update your follow.", 500);
    }
    return jsonOk({ following: false });
  } catch (error) {
    console.error("source follow delete error", error);
    return jsonError("Could not update your follow.", 500);
  }
}
