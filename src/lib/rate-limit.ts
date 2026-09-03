/**
 * Lightweight per-user, per-endpoint rate limiter.
 *
 * Uses an in-memory sliding window (per server instance). Suitable for a
 * single-region Vercel deployment where a scripted client hits one warm
 * instance; a shared store (Redis/DB) would be needed for multi-region or
 * multi-instance enforcement. Fail-open on any internal error so a limiter
 * bug never blocks legitimate traffic.
 */

interface Bucket {
  windowStart: number;
  count: number;
}

const buckets = new Map<string, Bucket>();

/** Prune stale buckets occasionally to avoid unbounded growth. */
let lastPrune = 0;
function prune(now: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > 60_000) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}