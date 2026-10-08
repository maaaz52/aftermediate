"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { submitReply, type FeatureReply } from "@/lib/feedback-api";
import { useStudent } from "@/lib/store";

const DATE_OPTS = { day: "numeric", month: "short", year: "numeric" } as const;

export function ReplyThread({
  featureId,
  replies,
  onPosted,
}: {
  featureId: string;
  replies: FeatureReply[];
  onPosted: (reply: FeatureReply) => void;
}) {
  const { profile } = useStudent();
  const [authorName, setAuthorName] = useState(() => profile.name.trim());
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(authorName.trim() && body.trim());

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    const res = await submitReply({ featureId, body, authorName });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setBody("");
    onPosted(res.reply);
  };

  return (
    <div className="mt-3 space-y-2 border-l-2 border-line pl-3">
      {replies.length === 0 ? (
        <p className="text-xs text-faint">No replies yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {replies.map((r) => (
            <li key={r.id}>
              <p className="text-xs">
                <span className="font-semibold text-ink">{r.author_name}</span>
                <span className="ml-2 text-faint">
                  {new Date(r.created_at).toLocaleDateString("en-GB", DATE_OPTS)}
                </span>
              </p>
              <p className="text-sm text-muted">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 pt-1">
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          aria-label="Your name"
          placeholder="Your name"
          className="w-full rounded-lg border border-line bg-background px-3 py-2 text-xs text-ink placeholder:text-faint focus:border-saffron/60 focus:outline-none"
        />
        <div className="flex items-start gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-label="Your reply"
            maxLength={2000}
            rows={2}
            placeholder="Reply to this suggestion…"
            className="min-h-[52px] w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-saffron/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!ready || busy}
            aria-label="Post reply"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-soft disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            {busy ? "…" : "Reply"}
          </button>
        </div>
        {!authorName.trim() && (
          <p className="text-xs text-faint">Add your name — replies are never anonymous.</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
