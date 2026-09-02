"use client";

import { useState } from "react";
import {
  Calculator,
  BookOpen,
  Bot,
  Compass,
  Globe,
  Bell,
} from "lucide-react";

const features = [
  {
    id: "merit",
    name: "Merit Calculator",
    desc: "See exact NUST, FAST & MDCAT aggregates instantly, with admission chances against real closing merit data.",
    icon: Calculator,
    bg: "bg-accent",
  },
  {
    id: "practice",
    name: "Test Practice",
    desc: "Full timed mock exams for MDCAT, NET, ECAT & more — with per-question explanations and score tracking.",
    icon: BookOpen,
    bg: "bg-emerald",
  },
  {
    id: "rahbar",
    name: "Rahbar AI",
    desc: "An always-available AI guide that answers any question about universities, admissions, careers and study abroad.",
    icon: Bot,
    bg: "bg-amber",
  },
  {
    id: "career",
    name: "Career Explorer",
    desc: "Browse every major with real salary data, demand scores, and an interactive \"day in the life\" scenario.",
    icon: Compass,
    bg: "bg-[#8a8788]",
  },
  {
    id: "abroad",
    name: "Study Abroad",
    desc: "Compare 13 countries by cost, visa rules & scholarships — with a financial planner that projects your 4-year budget in PKR.",
    icon: Globe,
    bg: "bg-[#a1bbfe]",
  },
  {
    id: "watchlist",
    name: "Watchlist",
    desc: "Track programs you care about and get notified the moment merit cutoffs change.",
    icon: Bell,
    bg: "bg-[#394881]",
  },
  {
    id: "more",
    name: "And Many More",
    desc: "Mock tests, AI tutors, CV builder, parent reports, webinars, mentors and everything else inside.",
    icon: null,
    bg: "bg-[#6b4c3b]",
  },
];

export function FeaturePanels() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex w-full gap-2 sm:gap-3" style={{ height: "clamp(320px, 45vw, 520px)" }}>
      {features.map((f) => {
        const Icon = f.icon;
        const isOpen = hovered === f.id;

        return (
          <div
            key={f.id}
            className={`${f.bg} relative flex cursor-pointer flex-col justify-end overflow-hidden rounded-2xl text-white transition-[flex] duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)] ${
              isOpen ? "flex-[5_1_0%]" : "flex-[1_1_0%]"
            }`}
            style={{ minWidth: 0 }}
            onMouseEnter={() => setHovered(f.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(f.id)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
            role="button"
            aria-label={f.name}
          >
            {/* Vertical label (collapsed) */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                isOpen ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <span className="-rotate-90 whitespace-nowrap font-display text-sm font-bold uppercase tracking-widest sm:text-base">
                {f.name}
              </span>
            </div>

            {/* Expanded content */}
            <div
              className={`flex h-full flex-col justify-end p-5 sm:p-6 transition-opacity duration-300 ${
                isOpen ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {Icon && <Icon className="mb-3 h-8 w-8 shrink-0 sm:h-10 sm:w-10" strokeWidth={1.5} />}
              <h3 className="font-display text-xl font-bold uppercase sm:text-2xl">
                {f.name}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/80">
                {f.desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                Learn more <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
