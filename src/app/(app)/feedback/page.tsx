"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FeedbackJourney } from "@/components/feedback/feedback-journey";
import { WishlistWall } from "@/components/feedback/wishlist-wall";

export default function FeedbackPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="violet">Your Voice</Badge>
        <span className="font-mono text-xs text-faint">review · reflect · shape what&apos;s next</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Your experience, <span className="text-violet">heard.</span>
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        Skip the boring form. Tell us how it felt, what surprised you, and what we should build next.
      </p>

      <FeedbackJourney onFeatureAdded={() => setRefreshKey((k) => k + 1)} />

      <div id="wishlist" className="mt-10 scroll-mt-6">
        <WishlistWall refreshKey={refreshKey} />
      </div>
    </div>
  );
}