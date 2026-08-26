import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { PixelCard } from "@/components/ui/pixel-card";
import { Illustration } from "@/components/pixel/illustrations";
import { MeritDemo } from "@/components/merit-demo";
import { RealityCard } from "@/components/reality-card";
import { StreamExplorer } from "@/components/stream-explorer";
import { UrgencyTicker } from "@/components/urgency-ticker";
import { PixelSeats } from "@/components/pixel-seats";
import { NustMeritBar } from "@/components/nust-merit-bar";
import { ExportsBars } from "@/components/exports-bars";
import { CountUp } from "@/components/count-up";
import { SiteFooter } from "@/components/landing/footer";
import { data } from "@/lib/data";

const rc = data.realities;
const mdcat = rc.find((r) => r.id === "mdcat-ratio")!;
const nust = rc.find((r) => r.id === "nust-aggregate")!;
const jobs = rc.find((r) => r.id === "youth-unemployment")!;
const it = rc.find((r) => r.id === "it-exports")!;

const steps = [
  { icon: "document" as const, title: "Upload your marksheet", desc: "Scan it or type it. We read your marks and stream automatically." },
  { icon: "magnifier" as const, title: "Get your merit and Plan B", desc: "Real aggregate math for NUST, FAST, UET and MDCAT — plus realistic alternatives." },
  { icon: "family" as const, title: "Convince your parents", desc: "A bilingual report with the data to turn \"doctor bano\" into a real conversation." },
];

const features = [
  { icon: "chart" as const, title: "Know your number", desc: "Aggregate engines for NUST, FAST, UET and MDCAT. No coaching-academy guesses.", href: "/merit" },
  { icon: "rocket" as const, title: "Find your Plan B", desc: "Pharm-D, DPT, CS, AI and more — with real salaries, demand and entry routes.", href: "/career" },
  { icon: "wallet" as const, title: "Plan the money", desc: "A budget agent, scholarships and study-abroad routes with real costs.", href: "/money" },
  { icon: "family" as const, title: "Convince your parents", desc: "A printable, bilingual report that makes the case with data, not arguments.", href: "/convince" },
];

const ctaLink =
  "inline-flex items-center gap-2 border-2 border-ink px-6 py-3 font-sans text-sm font-semibold transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/"><Brand /></Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <Link href="#how" className="hover:text-ink">How it works</Link>
            <Link href="#features" className="hover:text-ink">Features</Link>
            <Link href="#reality" className="hover:text-ink">Reality</Link>
            <Link href="#sources" className="hover:text-ink">Sources</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-ink hover:text-accent sm:block">Sign in</Link>
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center gap-2 border-2 border-ink bg-accent px-4 py-2 font-sans text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--color-ink)] transition-all hover:bg-accent-soft active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="grid-bg relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-20">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
                <span className="h-2 w-2 bg-emerald" />
                For Pakistani FSc · ICS · I.Com · A-Level
              </div>
              <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Finished FSc.
                <br />
                <span className="text-accent">Not sure what&apos;s next?</span>
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
                Upload your marksheet and get a real plan — your merit, your Plan B, and how to pay
                for it.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/login?mode=signup"
                  className={`${ctaLink} bg-accent text-white shadow-[4px_4px_0_0_var(--color-ink)] hover:bg-accent-soft`}
                >
                  Start free <ArrowRight />
                </Link>
                <Link
                  href="#how"
                  className={`${ctaLink} bg-surface text-ink shadow-[4px_4px_0_0_var(--color-ink)] hover:bg-surface-2`}
                >
                  See how it works
                </Link>
              </div>
              <p className="mt-6 font-mono text-xs text-faint">
                Backed by real data from PMDC, HEC, PBS &amp; P@SHA.
              </p>
            </div>

            <div className="animate-rise" style={{ animationDelay: "120ms" }}>
              <div className="relative">
                <div className="absolute -right-3 -top-3 z-10 animate-float">
                  <div className="border-2 border-ink bg-emerald p-2 shadow-[3px_3px_0_0_var(--color-ink)]">
                    <Illustration name="rocket" scale={2} />
                  </div>
                </div>
                <MeritDemo />
              </div>
            </div>
          </div>
        </section>

        <UrgencyTicker />

        {/* REALITY CHECK */}
        <section id="reality" className="border-y-2 border-ink bg-surface-2">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              The reality nobody tells you:
              <span className="text-danger"> the plan decides, not the marks.</span>
            </h2>
            <p className="mt-3 max-w-lg text-muted">
              One hard truth for every stream — medical, engineering, IT. Tap a card to flip it.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <RealityCard item={mdcat} value={mdcat.stat.value} label="Medical · candidates vs seats" />
              <RealityCard item={nust} value={nust.stat.value} label="Engineering · NUST formula" />
              <RealityCard item={it} value={it.stat.value} label="IT · fastest-growing export" />
              <RealityCard item={jobs} value={jobs.stat.value} label="Jobs · youth unemployment" />
            </div>
          </div>
        </section>

        {/* MOMENTUM / FOMO */}
        <section id="momentum" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
                The clock is <span className="text-danger">already running.</span>
              </h2>
              <p className="mt-4 max-w-md text-muted">
                Every month you wait, another merit list closes behind you. The plan matters more
                than the marks — and the window is open right now.
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex items-start gap-3 border-2 border-ink bg-danger/5 p-4">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-ink bg-danger font-mono text-xs text-white">✕</span>
                  <p className="text-sm text-ink">
                    Waiting for &quot;a better time&quot; to decide — while NET prep and deadlines pile up.
                  </p>
                </div>
                <div className="flex items-start gap-3 border-2 border-ink bg-surface p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-ink bg-emerald font-mono text-xs text-white">✓</span>
                  <p className="text-sm text-ink">
                    A 30-minute plan <span className="font-semibold text-accent">today</span> — you
                    know your number, your Plan B, and what to do next.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center gap-2 border-2 border-ink bg-accent px-6 py-3 font-sans text-sm font-semibold text-white shadow-[4px_4px_0_0_var(--color-ink)] transition-all hover:bg-accent-soft active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                >
                  Start free <ArrowRight />
                </Link>
              </div>
            </div>

            {/* 2x2 so each figure has room — a 4-up here squeezed them to 84px */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
                <p className="text-[11px] uppercase tracking-widest text-faint">Youth unemployment</p>
                <p className="mt-2 font-mono text-3xl font-bold text-danger">
                  <CountUp value={12.6} decimals={1} suffix="%" />
                </p>
                <p className="mt-auto pt-2 font-mono text-[10px] text-danger">a degree alone isn&apos;t a plan</p>
              </div>
              <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
                <p className="text-[11px] uppercase tracking-widest text-faint">HEC scholarships</p>
                <p className="mt-2 font-mono text-3xl font-bold text-emerald">
                  <CountUp value={4000} suffix="+" />
                </p>
                <p className="mt-auto pt-2 font-mono text-[10px] text-faint">most students never apply</p>
              </div>
              <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
                <p className="text-[11px] uppercase tracking-widest text-faint">Avg monthly income</p>
                <p className="mt-2 font-mono text-3xl font-bold text-ink">
                  <CountUp prefix="Rs " value={39042} />
                </p>
                <p className="mt-auto pt-2 font-mono text-[10px] text-faint">field choice changes it</p>
              </div>
              <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
                <p className="text-[11px] uppercase tracking-widest text-faint">MDCAT candidates</p>
                <p className="mt-2 font-mono text-3xl font-bold text-ink">
                  <CountUp value={180} suffix="k" />
                </p>
                <p className="mt-auto pt-2 font-mono text-[10px] text-faint">you&apos;re competing with them</p>
              </div>
            </div>
          </div>

          {/* full width: these three need real room for their charts */}
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
              <p className="font-mono text-[11px] uppercase tracking-widest text-danger">Pre-Med · the odds</p>
              <div className="mt-4"><PixelSeats /></div>
              <p className="mt-auto border-t-2 border-line pt-2 font-mono text-[10px] text-faint">
                ~180k candidates · ~11k seats · 1 in 15
              </p>
            </div>

            <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
              <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Pre-Eng · NUST merit</p>
              <div className="mt-4"><NustMeritBar /></div>
              <p className="mt-auto border-t-2 border-line pt-2 font-mono text-[10px] text-faint">
                your FSc is only 15% of the fight
              </p>
            </div>

            <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
              <p className="font-mono text-[11px] uppercase tracking-widest text-emerald">IT · the exports curve</p>
              <div className="mt-4"><ExportsBars /></div>
              <p className="mt-auto border-t-2 border-line pt-2 font-mono text-[10px] text-faint">
                fastest-growing export sector
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Three steps. No confusion.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <PixelCard key={s.title} className="p-6" shadow="accent">
                <div className="flex items-center justify-between">
                  <div className="border-2 border-ink bg-accent p-2.5">
                    <Illustration name={s.icon} scale={2} />
                  </div>
                  <span className="font-display text-4xl text-line">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </PixelCard>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="border-y-2 border-ink bg-surface-2">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Everything after the result.</h2>
            <p className="mt-3 max-w-lg text-muted">
              Four things every student actually needs — in one place, in plain words.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {features.map((f) => (
                <Link key={f.title} href={f.href} className="group">
                  <PixelCard className="h-full p-6 transition-all hover:-translate-y-1">
                    <div className="flex items-start justify-between">
                      <div className="border-2 border-ink bg-surface-2 p-2.5 group-hover:bg-accent/10">
                        <Illustration name={f.icon} scale={2} />
                      </div>
                      <ArrowRight className="h-5 w-5 text-faint transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-ink">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
                  </PixelCard>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* STREAM EXPLORER */}
        <section id="explore" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <span className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
                <span className="h-2 w-2 bg-accent" /> try it now
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Pick your stream. See what opens up.
              </h2>
              <p className="mt-3 max-w-md text-muted">
                Your FSc stream isn&apos;t a cage. Tap yours and watch the doors appear — with real
                pay and demand.
              </p>
            </div>
            <StreamExplorer />
          </div>
        </section>

        {/* SOURCES */}
        <section id="sources" className="border-t-2 border-ink bg-surface-2">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-20 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Every number is sourced.</h2>
              <p className="mt-3 max-w-md text-muted">
                No made-up stats. Every claim links to the official source, so you — and your
                parents — can verify it.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {["PMDC", "HEC", "PBS", "P@SHA", "SBP"].map((s) => (
                <span key={s} className="border-2 border-ink bg-surface px-4 py-2 font-mono text-sm text-ink shadow-[3px_3px_0_0_var(--color-line)]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="border-t-2 border-ink bg-accent">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
            <Illustration name="compass" scale={4} />
            <h2 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Your marksheet isn&apos;t the end. It&apos;s the start.
            </h2>
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center gap-2 border-2 border-ink bg-white px-7 py-3.5 font-sans text-base font-semibold text-ink shadow-[4px_4px_0_0_var(--color-ink)] transition-all hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Start free <ArrowRight />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}