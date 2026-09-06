/**
 * Minimal HTML escaper for values interpolated into server-rendered HTML
 * (e.g. email bodies). Always escape client-controlled strings before they
 * reach an HTML template.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Allow only safe URL schemes for user-supplied links (external profile links,
 * exported HTML hrefs). `javascript:` and other schemes become a no-op "#".
 */
export function safeExternalUrl(value: unknown): string {
  const s = String(value ?? "").trim();
  if (/^(https?:|mailto:)/i.test(s)) return s;
  return "#";
}