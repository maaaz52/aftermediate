"use client";

import * as React from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What exactly is aftermediate?",
    a: "Aftermediate is a planning platform for Pakistani students who just finished FSc, ICS, I.Com, or A-Level. Upload your marksheet and get your merit number, a ranked list of realistic options, Plan Bs, and how to fund them.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The core plan — merit calculation, stream fit, and a personal roadmap — is free. There are no hidden charges to see your numbers.",
  },
  {
    q: "Which boards and streams do you support?",
    a: "All Pakistani boards — Federal, Punjab, Sindh, KPK, Balochistan, AJK, Gilgit — and every stream: Pre-Medical, Pre-Engineering, ICS, I.Com, and A-Level equivalence.",
  },
  {
    q: "Where does my merit number come from?",
    a: "Your FSc marks are combined with the weightings each university actually uses — like NUST&apos;s NET formula where FSc is only 15% — using the published criteria from PMDC, HEC, and each institution.",
  },
  {
    q: "What if my marks are low?",
    a: "That&apos;s exactly what the Plan B engine is for. You&apos;ll get the fields where your numbers still work, alternative paths like private seats, allied health, IT, and abroad options — ranked by your actual chances.",
  },
  {
    q: "Do you help with entry tests like MDCAT, NET, ECAT?",
    a: "Yes. You get a prep roadmap for your target tests — timelines, what carries weight, and where each mark counts. Practice content is part of the plan.",
  },
  {
    q: "Can I really afford the options you suggest?",
    a: "Each option comes with real fee ranges plus scholarship and loan routes — HEC scholarships, need-based aid, and self-finance plans — so the decision isn&apos;t made blind.",
  },
  {
    q: "Is my marksheet data safe?",
    a: "Your data is used only to build your plan. We never sell it, and you can delete it anytime. Your marksheet image is processed to read your subjects and grades, then you stay in control.",
  },
  {
    q: "What makes this better than asking a cousin or a counsellor?",
    a: "A counsellor gives you one opinion. We give you every verified path with the actual numbers behind them — and you can check every claim against its official source on the page.",
  },
  {
    q: "How long does it take to get my plan?",
    a: "About 30 minutes. Upload your marksheet, and your merit, your Plan Bs, and your funding routes are laid out — ready to act on today.",
  },
];

export function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section id="faq" className="border-t-2 border-ink bg-surface-2">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <span className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
          <span className="h-2 w-2 bg-accent" /> questions, answered
        </span>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl uppercase">
          Everything you&apos;re wondering.
        </h2>
        <p className="mt-3 max-w-md text-muted">
          Straight answers, no jargon. Still stuck? Drop us a line.
        </p>

        <div className="mt-8 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className={cn("border-2 border-ink bg-surface transition-shadow", isOpen && "shadow-[4px_4px_0_0_var(--color-ink)]")}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-ink sm:text-base">{f.q}</span>
                  <span className={cn("grid h-6 w-6 shrink-0 place-items-center border-2 border-ink", isOpen ? "bg-accent text-white" : "bg-surface")}>
                    {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>
                {isOpen && <p className="border-t-2 border-line px-5 py-4 text-sm leading-relaxed text-muted">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}