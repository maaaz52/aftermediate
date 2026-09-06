import { Avatar, Style } from "@dicebear/core";

import adventurer from "@dicebear/styles/adventurer.json" with { type: "json" };
import adventurerNeutral from "@dicebear/styles/adventurer-neutral.json" with { type: "json" };
import bottts from "@dicebear/styles/bottts.json" with { type: "json" };
import botttsNeutral from "@dicebear/styles/bottts-neutral.json" with { type: "json" };
import funEmoji from "@dicebear/styles/fun-emoji.json" with { type: "json" };
import lorelei from "@dicebear/styles/lorelei.json" with { type: "json" };
import loreleiNeutral from "@dicebear/styles/lorelei-neutral.json" with { type: "json" };
import notionists from "@dicebear/styles/notionists.json" with { type: "json" };
import bigSmile from "@dicebear/styles/big-smile.json" with { type: "json" };
import initials from "@dicebear/styles/initials.json" with { type: "json" };

export const AVATAR_STYLES = [
  { id: "adventurer", label: "Adventurer", definition: adventurer },
  { id: "adventurer-neutral", label: "Adventurer Neutral", definition: adventurerNeutral },
  { id: "bottts", label: "Bottts", definition: bottts },
  { id: "bottts-neutral", label: "Bottts Neutral", definition: botttsNeutral },
  { id: "fun-emoji", label: "Fun Emoji", definition: funEmoji },
  { id: "lorelei", label: "Lorelei", definition: lorelei },
  { id: "lorelei-neutral", label: "Lorelei Neutral", definition: loreleiNeutral },
  { id: "notionists", label: "Notionists", definition: notionists },
  { id: "big-smile", label: "Big Smile", definition: bigSmile },
  { id: "initials", label: "Initials", definition: initials },
];

export type AvatarStyleId = (typeof AVATAR_STYLES)[number]["id"];

const styleCache = new Map<string, Style>();

function getStyle(styleId: string, definition: (typeof AVATAR_STYLES)[number]["definition"]): Style {
  if (!styleCache.has(styleId)) {
    styleCache.set(styleId, new Style(definition as never));
  }
  return styleCache.get(styleId)!;
}

export function generateAvatarSvg(styleId: AvatarStyleId, seed: string): string {
  const styleDef = AVATAR_STYLES.find((s) => s.id === styleId) ?? AVATAR_STYLES[0];
  return new Avatar(getStyle(styleDef.id, styleDef.definition), { seed, size: 96 }).toString();
}