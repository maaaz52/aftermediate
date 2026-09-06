import { Avatar, Style } from "@dicebear/core";
import type { StyleDefinition } from "@dicebear/core";

/**
 * Avatar styles. The SVG templates (each ~120KB+) are lazy-loaded on demand
 * via `loadAvatarStyle`, so the 1.2MB of style definitions never ships on
 * routes that only render the user's single chosen avatar.
 */
export const AVATAR_STYLES = [
  { id: "adventurer", label: "Adventurer" },
  { id: "adventurer-neutral", label: "Adventurer Neutral" },
  { id: "bottts", label: "Bottts" },
  { id: "bottts-neutral", label: "Bottts Neutral" },
  { id: "fun-emoji", label: "Fun Emoji" },
  { id: "lorelei", label: "Lorelei" },
  { id: "lorelei-neutral", label: "Lorelei Neutral" },
  { id: "notionists", label: "Notionists" },
  { id: "big-smile", label: "Big Smile" },
  { id: "initials", label: "Initials" },
] as const;

export type AvatarStyleId = (typeof AVATAR_STYLES)[number]["id"];

const styleLoaders: Record<string, () => Promise<{ default: unknown }>> = {
  adventurer: () => import("@dicebear/styles/adventurer.json", { with: { type: "json" } }),
  "adventurer-neutral": () => import("@dicebear/styles/adventurer-neutral.json", { with: { type: "json" } }),
  bottts: () => import("@dicebear/styles/bottts.json", { with: { type: "json" } }),
  "bottts-neutral": () => import("@dicebear/styles/bottts-neutral.json", { with: { type: "json" } }),
  "fun-emoji": () => import("@dicebear/styles/fun-emoji.json", { with: { type: "json" } }),
  lorelei: () => import("@dicebear/styles/lorelei.json", { with: { type: "json" } }),
  "lorelei-neutral": () => import("@dicebear/styles/lorelei-neutral.json", { with: { type: "json" } }),
  notionists: () => import("@dicebear/styles/notionists.json", { with: { type: "json" } }),
  "big-smile": () => import("@dicebear/styles/big-smile.json", { with: { type: "json" } }),
  initials: () => import("@dicebear/styles/initials.json", { with: { type: "json" } }),
};

const styleCache = new Map<string, Style>();

export async function loadAvatarStyle(styleId: string): Promise<Style> {
  const cached = styleCache.get(styleId);
  if (cached) return cached;
  const loader = styleLoaders[styleId] ?? styleLoaders.adventurer;
  const mod = await loader();
  const style = new Style(mod.default as StyleDefinition);
  styleCache.set(styleId, style);
  return style;
}

export async function generateAvatarSvg(styleId: AvatarStyleId, seed: string): Promise<string> {
  const style = await loadAvatarStyle(styleId);
  return new Avatar(style, { seed, size: 96 }).toString();
}