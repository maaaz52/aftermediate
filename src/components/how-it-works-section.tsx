"use client";

import { useRef, useEffect } from "react";

function StepIllustration({ icon }: { icon: string }) {
  if (icon === "chart") {
    return (
      <svg viewBox="0 0 120 100" fill="none" className="h-24 w-24">
        <rect x="10" y="70" width="16" height="20" stroke="currentColor" strokeWidth="1.5" />
        <rect x="32" y="50" width="16" height="40" stroke="currentColor" strokeWidth="1.5" />
        <rect x="54" y="30" width="16" height="60" stroke="currentColor" strokeWidth="1.5" />
        <rect x="76" y="10" width="16" height="80" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="95" x2="100" y2="95" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  if (icon === "rocket") {
    return (
      <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24">
        <path d="M60 15 L75 50 L60 45 L45 50 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M45 50 L35 70 L60 55 L85 70 L75 50" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="60" cy="38" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M50 75 L60 90 L70 75" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 100" fill="none" className="h-24 w-24">
      <rect x="15" y="25" width="90" height="55" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="15" y="25" width="90" height="15" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="85" cy="55" r="5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="15" y1="55" x2="70" y2="55" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  );
}

function StepCard({ s, index }: { s: { num: string; title: string; desc: string; color: string; icon: string }; index: number }) {
  return (
    <div
      className={`step-card overflow-hidden border-2 border-ink ${s.color} shadow-[4px_4px_0_0_var(--color-ink)]`}
      style={{ transitionDelay: `${index * 0.15}s` }}
    >
      <div className="p-6">
        <span className="font-mono text-xs text-ink/60">[{s.num}]</span>
        <h3 className="mt-1 text-xl font-bold text-ink">{s.title}</h3>

        <div className="step-content">
          <div className="step-illustration mt-6 text-ink/70">
            <StepIllustration icon={s.icon} />
          </div>
          <div className="mt-4 border-t border-ink/20 pt-4">
            <p className="text-sm leading-relaxed text-ink/80">{s.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const card01 = { num: "01", title: "Know your number", desc: "Aggregate engines for NUST, FAST, UET and MDCAT. No coaching-academy guesses.", color: "bg-emerald", icon: "chart" };
const card02 = { num: "02", title: "Find your Plan B", desc: "Pharm-D, DPT, CS, AI and more — with real salaries, demand and entry routes.", color: "bg-accent", icon: "rocket" };
const card03 = { num: "03", title: "Plan the money", desc: "A budget agent, scholarships and study-abroad routes with real costs.", color: "bg-amber", icon: "wallet" };

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const cards = section.querySelectorAll<HTMLElement>(".step-card");
    cards.forEach((card) => card.classList.add("step-card-enter"));

    // Wait two frames after collapsing so the browser paints the hidden state
    // before observing. Otherwise a card already in view gets both classes in
    // one paint and the expand transition never animates.
    let observer: IntersectionObserver | null = null;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                observer?.unobserve(entry.target);
              }
            }
          },
          { rootMargin: "0px 0px -15% 0px" }
        );
        cards.forEach((card) => observer?.observe(card));
      })
    );

    return () => observer?.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="border-y-2 border-ink bg-surface-2">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
        {/* Desktop: 2-col grid, row 1 = heading + card01, row 2 = card03 + card02 */}
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-12">
          {/* Row 1 left: heading */}
          <div className="lg:self-start">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-4xl uppercase">
              How it works.
            </h2>
            <p className="mt-3 max-w-sm text-muted">
              From sign-up to action — here&apos;s how it works.
            </p>
          </div>

          {/* Row 1 right: card 01 */}
          <StepCard s={card01} index={0} />

          {/* Row 2 left: card 03 — parallel to card 02 */}
          <StepCard s={card03} index={1} />

          {/* Row 2 right: card 02 */}
          <StepCard s={card02} index={2} />
        </div>
      </div>
    </section>
  );
}