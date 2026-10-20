import type { Metadata } from "next";
import Link from "next/link";
import { Check, Crown, LockKeyhole, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PixelCard } from "@/components/ui/pixel-card";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Aftermediate Pro",
  description: "One plan that includes every crowned Aftermediate tool for PKR 300.",
  path: "/subscription",
});

const proCollections = [
  {
    title: "Pakistan",
    items: [
      { label: "Self Assessment", href: "/pakistan/self-assessment" },
      { label: "Scholarships", href: "/pakistan/scholarships" },
      { label: "Manzil A.I", href: "/pakistan/assistant" },
    ],
  },
  {
    title: "Abroad",
    items: [
      { label: "Scholarships", href: "/abroad/scholarships" },
      { label: "Self Assessment", href: "/abroad/self-assessment" },
      { label: "Ivy League", href: "/abroad/ivy-league" },
      { label: "Safar A.I", href: "/abroad/assistant" },
    ],
  },
  {
    title: "Skills",
    items: [
      { label: "Courses", href: "/skills/courses" },
      { label: "Hunar A.I", href: "/skills/chat" },
    ],
  },
  {
    title: "Study and community",
    items: [
      { label: "College Essays", href: "/college-essays" },
      { label: "Test Prep", href: "/study/test-prep" },
      { label: "Ustaad A.I", href: "/study" },
      { label: "Mentor Match", href: "/mentors" },
    ],
  },
];

export default function SubscriptionPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-12">
        <div className="animate-reveal self-center">
          <div className="flex items-center gap-2">
            <Badge variant="saffron">Subscription</Badge>
            <Crown className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
          </div>
          <h1 className="mt-4 max-w-xl font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
            One plan. Every crowned tool.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Aftermediate Pro gives you access to every page marked with a crown, from guided practice to specialised A.I. support.
          </p>
          <div className="mt-7 flex items-start gap-3 border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <p>One clear membership. No separate add-ons or hidden tiers.</p>
          </div>
        </div>

        <PixelCard className="animate-rise relative overflow-hidden p-5 sm:p-6" shadow="accent">
          <div className="absolute top-0 right-0 h-20 w-20 border-b-2 border-l-2 border-ink bg-saffron/10" aria-hidden="true" />
          <div className="relative">
            <div className="grid h-11 w-11 place-items-center border-2 border-ink bg-amber text-ink shadow-[3px_3px_0_0_var(--color-ink)]">
              <Crown className="h-5 w-5 fill-current" aria-hidden="true" />
            </div>
            <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">Aftermediate Pro</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-5xl leading-none tracking-tight text-ink">PKR 300</span>
            </div>
            <p className="mt-2 text-sm text-muted">One plan with full access to every crowned page.</p>

            <div className="mt-6 border-y-2 border-ink py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Check className="h-4 w-4 text-emerald" aria-hidden="true" />
                All 13 crowned experiences included
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <Check className="h-4 w-4 text-emerald" aria-hidden="true" />
                One membership, no add-ons
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-6 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 border-2 border-ink bg-surface-2 px-5 text-sm font-semibold text-muted opacity-80"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Payments open soon
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-faint">
              This is a preview. Payment and account access will be added next.
            </p>
          </div>
        </PixelCard>
      </section>

      <section className="mt-12 animate-reveal" style={{ animationDelay: "120ms" }}>
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">Everything included in Pro.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            These are the tools marked with a crown throughout Aftermediate. Your one plan unlocks all of them.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {proCollections.map((collection, index) => (
            <div
              key={collection.title}
              className={index === 0 ? "border-2 border-ink bg-saffron/10 p-5" : "border-2 border-ink bg-surface p-5"}
            >
              <h3 className="font-display text-xl tracking-tight text-ink">{collection.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {collection.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-1.5 border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-saffron hover:text-saffron"
                  >
                    <Crown className="h-3.5 w-3.5 fill-amber text-amber" aria-hidden="true" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
