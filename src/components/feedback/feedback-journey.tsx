"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { analyzeSentiment, type SentimentResult, type ToneId } from "@/lib/feedback-model";
import { submitReview } from "@/lib/feedback-api";
import { useStudent } from "@/lib/store";
import { MoodMeter } from "./mood-meter";
import { RatingSlider } from "./rating-slider";
import { StoryStep } from "./story-step";
import { WishlistStep } from "./wishlist-step";
import { Celebration } from "./celebration";
import type { MediaItem } from "./media-uploader";

export const STEPS = [
  { id: 1, title: "How do you feel?" },
  { id: 2, title: "Rate the journey" },
  { id: 3, title: "Tell your story" },
  { id: 4, title: "Shape what's next" },
] as const;

export function FeedbackJourney({ onFeatureAdded }: { onFeatureAdded?: () => void }) {
  const { profile } = useStudent();
  const [step, setStep] = useState(1);
  const [tone, setTone] = useState<ToneId | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  void setReviewText; // wired to StoryStep in Task 4
  const [surprised, setSurprised] = useState("");
  const [mindset, setMindset] = useState("");
  const [recommendTo, setRecommendTo] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const stepMeta = STEPS.find((s) => s.id === step)!;

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const canContinue = step === 1 ? tone !== null : true;
  const first = profile.name.split(" ")[0] || "friend";

  const handleSend = useCallback(async () => {
    if (!tone || submitting) return;
    setSubmitting(true);
    setError(null);
    const sentiment = analyzeSentiment(tone, rating, reviewText);
    const res = await submitReview(
      {
        tone,
        rating,
        reviewText,
        surprised,
        mindset,
        recommendTo,
      },
      media
    );
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(sentiment);
    setSubmittedAt(new Date().toISOString());
  }, [tone, rating, reviewText, surprised, mindset, recommendTo, media, submitting]);

  const content = useMemo(() => {
    switch (step) {
      case 1:
        return <MoodMeter value={tone} onChange={(t) => setTone(t)} />;
      case 2:
        return <RatingSlider value={rating} onChange={setRating} />;
      case 3:
        return (
          <StoryStep
            surprised={surprised}
            mindset={mindset}
            recommendTo={recommendTo}
            media={media}
            onSurprised={setSurprised}
            onMindset={setMindset}
            onRecommendTo={setRecommendTo}
            onMedia={setMedia}
          />
        );
      case 4:
        return <WishlistStep onSubmitted={onFeatureAdded} />;
      default:
        return null;
    }
  }, [step, tone, rating, surprised, mindset, recommendTo, media, onFeatureAdded]);

  if (result && submittedAt) {
    return (
      <Celebration
        result={result}
        tone={tone!}
        rating={rating}
        quote={reviewText || result.summary}
        recommendTo={recommendTo}
        hasMedia={media.length > 0}
        submittedAt={submittedAt}
      />
    );
  }

  return (
    <section
      aria-label="Your voice journey"
      className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-8"
    >
      <div aria-live="polite" className="sr-only">
        Step {step} of 4: {stepMeta.title}
      </div>

      {/* progress comet */}
      <div className="mb-8 flex items-center gap-2" aria-hidden>
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              s.id < step ? "bg-emerald" : s.id === step ? "animate-pulse bg-saffron" : "bg-line"
            }`}
          />
        ))}
        <span className="ml-2 font-mono text-xs text-faint">
          {step}/4
        </span>
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-ink outline-none">
        {stepMeta.title}
      </h2>
      <div key={step} className="animate-step-in mt-6">
        {content}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-soft disabled:opacity-40"
          >
            Next <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald px-5 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            {submitting ? "Sending…" : "Send your voice"}
          </button>
        )}
      </div>

      {first && (
        <p className="mt-6 text-xs text-faint">
          Sharing as <span className="font-semibold text-muted">{first}</span>
        </p>
      )}
    </section>
  );
}
