/**
 * Lightweight structured security-event logging.
 *
 * Emits a single redacted JSON line per event to stdout (captured by Vercel
 * and Sentry). Never log passwords, tokens, cookies or full sensitive bodies;
 * only stable identifiers like user ids and event names. All fields are
 * optional and safe to serialize.
 */
export function logSecurity(
  event: string,
  detail: Record<string, string | number | boolean | null | undefined> = {}
): void {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    event,
    ...detail,
  });
  console.log(`[security] ${line}`);
}