"use client";

import { useState } from "react";
import { ArrowUpRight, MessageCircle, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeedbackJourney } from "@/components/feedback/feedback-journey";
import { MyReviews } from "@/components/feedback/my-reviews";
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

      <MyReviews refreshKey={refreshKey} />

      <section
        aria-labelledby="community-heading"
        className="relative mt-10 overflow-hidden rounded-2xl border border-emerald/30 bg-emerald/10 p-5 sm:p-7"
      >
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[18px] border-emerald/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-2xl gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald text-white shadow-sm">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="community-heading" className="text-xl font-extrabold tracking-tight text-ink">Aftermediate community</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald/15 px-2.5 py-1 text-xs font-semibold text-emerald">
                  <UsersRound className="h-3.5 w-3.5" aria-hidden="true" /> Students only
                </span>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Join fellow Aftermediate students to swap ideas, ask questions, share opportunities, and stay connected.
              </p>
            </div>
          </div>
          <a
            href="https://chat.whatsapp.com/Fr9E1Lo3OIy5OFa0BPwdUU?s=cl&p=a&mlu=4&ilr=4"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald/90 active:translate-y-0"
          >
            Join on WhatsApp
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <div id="wishlist" className="mt-10 scroll-mt-6">
        <WishlistWall refreshKey={refreshKey} />
      </div>
    </div>
  );
}
