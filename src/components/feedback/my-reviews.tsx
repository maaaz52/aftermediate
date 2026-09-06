"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquareQuote } from "lucide-react";
import { TONE_META } from "@/lib/feedback-model";
import { listMyReviews, reviewMediaSignedUrl, type MyReview } from "@/lib/feedback-api";

const STATUS_LABEL: Record<string, string> = {
  pending: "In review",
  published: "Published",
  hidden: "Hidden",
};

function ReviewMedia({ path, mediaType }: { path: string; mediaType: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    reviewMediaSignedUrl(path).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [path]);

  if (!src) return null;

  if (mediaType === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, no next/image pipeline
      <img src={src} alt="" className="h-20 w-20 rounded-lg border border-line object-cover" />
    );
  }
  if (mediaType === "video") {
    return <video src={src} className="h-20 w-36 rounded-lg border border-line object-cover" controls />;
  }
  return <audio src={src} controls className="h-9 w-44" />;
}

function ReviewCard({ review }: { review: MyReview }) {
  const tone = TONE_META.find((t) => t.id === review.tone);
  const date = new Date(review.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <li className="rounded-xl border border-line bg-surface-2/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink">{tone?.label ?? review.tone}</span>
        <span className="rounded-full border border-line px-2 py-0.5 font-mono text-xs text-faint">
          {review.rating}/10
        </span>
        <span className="font-mono text-xs text-faint">{date}</span>
        <span
          className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
            review.status === "published"
              ? "border-emerald/40 bg-emerald/10 text-emerald"
              : "border-amber/40 bg-amber/10 text-amber"
          }`}
        >
          {STATUS_LABEL[review.status] ?? review.status}
        </span>
      </div>
      {review.review_text && <p className="mt-2 text-sm leading-relaxed text-muted">{review.review_text}</p>}
      {review.media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {review.media.map((m) => (
            <ReviewMedia key={m.id} path={m.url} mediaType={m.media_type} />
          ))}
        </div>
      )}
    </li>
  );
}

/** The signed-in user's own submitted reviews, with any media. */
export function MyReviews({ refreshKey = 0 }: { refreshKey?: number }) {
  const [reviews, setReviews] = useState<MyReview[] | null>(null);

  useEffect(() => {
    let alive = true;
    listMyReviews().then((rows) => {
      if (alive) setReviews(rows);
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return (
    <section aria-label="Your reviews" className="mt-10 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-ink">Your reviews</h2>
        <span className="font-mono text-xs text-faint">what you&apos;ve shared</span>
      </div>

      {reviews === null ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-faint">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading…
        </p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 flex items-start gap-2 text-sm text-faint">
          <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Nothing yet — share your experience in the form above and it&apos;ll show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </ul>
      )}
    </section>
  );
}