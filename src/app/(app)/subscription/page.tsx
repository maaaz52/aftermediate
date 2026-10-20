import type { Metadata } from "next";
import { Check, Crown, LockKeyhole } from "lucide-react";
import { PixelCard } from "@/components/ui/pixel-card";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Aftermediate plans",
  description: "Choose between free Aftermediate access and Pro access to every crowned tool.",
  path: "/subscription",
});

const proFeatures = [
  "Pakistan: Self Assessment, Scholarships, and Manzil A.I",
  "Abroad: Scholarships, Self Assessment, Ivy League, and Safar A.I",
  "Skills: Courses and Hunar A.I",
  "Study and community: College Essays, Test Prep, Ustaad A.I, and Mentor Match",
];

export default function SubscriptionPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">Choose your plan</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">Start free, or unlock every crowned Aftermediate tool with Pro.</p>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Subscription plans">
        <PixelCard className="flex h-full flex-col p-5 sm:p-6" shadow="none">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">Basic</p>
          <p className="mt-3 font-display text-4xl tracking-tight text-ink">Free</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">Explore Aftermediate&apos;s core tools and build your path at no cost.</p>
          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-start gap-2 text-sm leading-relaxed text-ink">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
              Core Aftermediate tools
            </div>
            <div className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-ink">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
              Your profile, roadmap, and free resources
            </div>
          </div>
        </PixelCard>

        <PixelCard className="relative flex h-full flex-col overflow-hidden p-5 sm:p-6" shadow="accent">
          <div className="absolute right-0 top-0 grid h-14 w-14 place-items-center border-b-2 border-l-2 border-ink bg-saffron/10" aria-hidden="true">
            <Crown className="h-5 w-5 fill-amber text-amber" />
          </div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-saffron">Pro</p>
          <p className="mt-3 font-display text-4xl tracking-tight text-ink">PKR 300</p>
          <p className="mt-1 text-sm text-muted">One plan. Full access.</p>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm font-semibold text-ink">Everything in Basic, plus:</p>
            <ul className="mt-4 space-y-3">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
                  <Crown className="mt-0.5 h-4 w-4 shrink-0 fill-amber text-amber" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            disabled
            className="mt-auto flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 border-2 border-ink bg-surface-2 px-5 text-sm font-semibold text-muted opacity-80"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            Payments open soon
          </button>
        </PixelCard>
      </section>
    </main>
  );
}
