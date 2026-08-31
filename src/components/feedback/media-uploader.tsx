"use client";

import type { MediaKind } from "@/lib/feedback-model";

export type MediaItem = { file: File; kind: MediaKind; url: string };

export function MediaUploader(props: Record<string, unknown>) {
  void props; // placeholder — implemented in Task 4
  return null;
}
