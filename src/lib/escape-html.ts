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