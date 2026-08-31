"use client";

import { useState } from "react";
import { FileUp, X } from "lucide-react";
import { mediaKindFor, validateMedia, type MediaKind } from "@/lib/feedback-model";

export type MediaItem = { file: File; kind: MediaKind; url: string };

export function MediaUploader({
  items,
  onChange,
}: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    let sawError = false;
    const next: MediaItem[] = [];
    for (const f of Array.from(files)) {
      const v = validateMedia(f);
      if (!v.ok) {
        sawError = true;
        setError(v.error);
        continue;
      }
      const kind = mediaKindFor(f)!;
      const url = URL.createObjectURL(f);
      next.push({ file: f, kind, url });
    }
    if (next.length) {
      if (!sawError) setError(null);
      onChange([...items, ...next]);
    }
  };

  const remove = (url: string) => {
    URL.revokeObjectURL(url);
    onChange(items.filter((i) => i.url !== url));
  };

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#333] bg-[#111118] px-4 py-6 text-center transition-colors hover:border-blue-500/50 focus-within:border-blue-500/50">
        <FileUp className="h-6 w-6 text-faint" aria-hidden />
        <span className="text-sm font-medium text-[#a1a1b5]">Attach a screenshot, clip, or voice note</span>
        <span className="font-mono text-xs text-faint">images ≤ 5MB · video/audio ≤ 25MB</span>
        {/* no accept list: userEvent's applyAccept silently drops files before validateMedia can show an error */}
        <input
          type="file"
          multiple
          aria-label="Attach media"
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.url} className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#111118] p-3">
              {item.kind === "image" && (
                // eslint-disable-next-line @next/next/no-img-element -- blob: URLs are transient, next/image provides no benefit
                <img src={item.url} alt="" className="h-14 w-14 rounded object-cover" />
              )}
              {item.kind === "video" && (
                <video src={item.url} className="h-14 w-24 rounded object-cover" controls />
              )}
              {item.kind === "audio" && (
                <audio src={item.url} controls className="h-9 w-40" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{item.file.name}</p>
                <p className="font-mono text-xs text-faint">
                  {(item.file.size / 1024 / 1024).toFixed(1)}MB · {item.kind}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.url)}
                aria-label={`Remove ${item.file.name}`}
                className="rounded-md p-1.5 text-faint transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-faint">
        Media is reviewed before it appears publicly — we keep everything private until then.
      </p>
    </div>
  );
}
