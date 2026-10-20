/**
 * Shared fixed-window limiter backed by Supabase in production. Tests and
 * local environments without server credentials use the in-process fallback.
 * If Supabase's limiter RPC is temporarily unavailable, preserve application
 * availability with the same conservative per-instance fallback instead of
 * taking every protected feature offline.
 */

import { createAdminClient } from "@/lib/supabase/admin";

interface Bucket {
  windowStart: number;
  windowMs: number;
  count: number;
}

const buckets = new Map<string, Bucket>();

/** Prune stale buckets occasionally to avoid unbounded growth. */
let lastPrune = 0;
function prune(now: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > bucket.windowMs) buckets.delete(key);
  }
}

function checkLocalRateLimit(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { windowStart: now, windowMs, count: 1 });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  if (
    process.env.NODE_ENV === "test" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return checkLocalRateLimit(key, max, windowMs);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_ms: windowMs,
    });
    if (error) {
      console.error("rate limit backend failed", error.message);
      return checkLocalRateLimit(key, max, windowMs);
    }
    return data === true;
  } catch (error) {
    console.error("rate limit backend failed", error);
    return checkLocalRateLimit(key, max, windowMs);
  }
}
