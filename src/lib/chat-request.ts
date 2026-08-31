export const PERSONAS = [
  "rahbar",
  "study",
  "essay",
  "cv",
  "safar",
  "hunar",
  "qalam",
] as const;

export type Persona = (typeof PERSONAS)[number];

export function isPersona(value: unknown): value is Persona {
  return typeof value === "string" && (PERSONAS as readonly string[]).includes(value);
}
