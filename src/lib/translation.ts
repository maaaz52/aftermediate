export const TRANSLATION_BATCH_MAX_ITEMS = 20;
export const TRANSLATION_BATCH_MAX_CHARS = 3_600;

export function isTranslatableText(value: string) {
  const text = value.trim();
  if (!text || text.length > 600) return false;
  if (/^[\d\s.,:/%+−–-]+$/.test(text)) return false;
  if (/^[A-Z]{2,6}\s*[\d,.]+(?:\s*[A-Z]{2,6})?$/i.test(text)) return false;
  if (/^(https?:\/\/|www\.)/i.test(text) || /^\S+@\S+\.\S+$/.test(text)) return false;
  return !/^aftermediate$/i.test(text);
}

export function normalizeTranslations(
  values: Record<string, unknown>,
  expected: readonly string[]
): Record<string, string> {
  const translated: Record<string, string> = {};
  for (const key of expected) {
    const value = values[key];
    if (typeof value === "string" && value.trim() && value.length <= 1_200) {
      translated[key] = value.trim();
    }
  }
  return translated;
}
