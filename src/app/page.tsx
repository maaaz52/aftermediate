import Link from "next/link";
import { ArrowRight, Mail, ExternalLink } from "lucide-react";
import { ContactForm } from "@/components/landing/contact-form";
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
  { icon: "compass" as const, title: "Sign up", desc: "Create your account in 30 seconds. No credit card, no waiting — just get in.", bgClass: "bg-emerald" },
  { icon: "magnifier" as const, title: "Get the picture", desc: "Discover what's actually available — your real merit, the right universities, careers that pay, and scholarships you qualify for.", bgClass: "bg-accent" },
  { icon: "rocket" as const, title: "Act on it", desc: "Your personalised roadmap is ready. Execute it — with data, not guesswork.", bgClass: "bg-amber" },
];

const features = [
  { icon: "chart" as const, title: "Know your number", desc: "Aggregate engines for NUST, FAST, UET and MDCAT. No coaching-academy guesses.", href: "/login?mode=signup" },
  { icon: "rocket" as const, title: "Find your Plan B", desc: "Pharm-D, DPT, CS, AI and more — with real salaries, demand and entry routes.", href: "/login?mode=signup" },
  { icon: "wallet" as const, title: "Plan the money", desc: "A budget agent, scholarships and study-abroad routes with real costs.", href: "/login?mode=signup" },
  { icon: "family" as const, title: "Convince your parents", desc: "A printable, bilingual report that makes the case with data, not arguments.", href: "/login?mode=signup" },
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
            <Link href="#contact" className="hover:text-ink">Contact</Link>
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
          <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:pt-20">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
                <span className="h-2 w-2 bg-emerald" />
                For Pakistani FSc · ICS · I.Com · A-Level
              </div>
                <h1 className="mt-6 font-display text-3xl leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
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
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
            <h2 className="max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              The reality nobody tells you:
              <span className="text-danger"> the plan decides, not the marks.</span>
            </h2>
            <p className="mt-3 max-w-lg text-muted">
              One hard truth for every stream — medical, engineering, IT. Tap a card to flip it.
            </p>
            <div className="mt-6 sm:mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <RealityCard item={mdcat} value={mdcat.stat.value} label="Medical · candidates vs seats" />
              <RealityCard item={nust} value={nust.stat.value} label="Engineering · NUST formula" />
              <RealityCard item={it} value={it.stat.value} label="IT · fastest-growing export" />
              <RealityCard item={jobs} value={jobs.stat.value} label="Jobs · youth unemployment" />
            </div>
          </div>
        </section>

        {/* MOMENTUM / FOMO */}
        <section id="momentum" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
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
                <p className="mt-2 font-mono text-2xl font-bold text-danger">
                  <CountUp value={12.6} decimals={1} suffix="%" />
                </p>
                <p className="mt-auto pt-2 font-mono text-[10px] text-danger">a degree alone isn&apos;t a plan</p>
              </div>
              <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
                <p className="text-[11px] uppercase tracking-widest text-faint">HEC scholarships</p>
                <p className="mt-2 font-mono text-2xl font-bold text-emerald">
                  <CountUp value={4000} suffix="+" />
                </p>
                <p className="mt-auto pt-2 font-mono text-[10px] text-faint">most students never apply</p>
              </div>
              <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
                <p className="text-[11px] uppercase tracking-widest text-faint">Avg monthly income</p>
                <p className="mt-2 font-mono text-2xl font-bold text-ink">
                  <CountUp prefix="Rs " value={39042} />
                </p>
                <p className="mt-auto pt-2 font-mono text-[10px] text-faint">field choice changes it</p>
              </div>
              <div className="flex min-w-0 flex-col border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_var(--color-ink)]">
                <p className="text-[11px] uppercase tracking-widest text-faint">MDCAT candidates</p>
                <p className="mt-2 font-mono text-2xl font-bold text-ink">
                  <CountUp value={180} suffix="k" />
                </p>
                <p className="mt-auto pt-2 font-mono text-[10px] text-faint">you&apos;re competing with them</p>
              </div>
            </div>
          </div>

          {/* full width: these three need real room for their charts */}
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
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
        <section id="how" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">Three steps. Zero confusion.</h2>
          <p className="mt-3 max-w-lg text-muted">
            From sign-up to action — here&apos;s how it works.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-6 md:flex-row md:items-center md:gap-0">
            {steps.map((s, i) => (
              <div key={s.title} className="contents">
                <div className="relative flex-1 overflow-hidden border-2 border-ink bg-surface p-6 shadow-[4px_4px_0_0_var(--color-ink)]">
                  <span className="absolute -right-4 -top-8 font-display text-[100px] leading-none text-line">
                    0{i + 1}
                  </span>
                  <div className={`relative grid h-14 w-14 place-items-center border-2 border-ink ${s.bgClass}`}>
                    <Illustration name={s.icon} scale={2} />
                  </div>
                  <h3 className="relative mt-5 text-xl font-bold text-ink">{s.title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden shrink-0 items-center justify-center px-4 md:flex">
                    <ArrowRight className="h-6 w-6 text-faint" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="border-y-2 border-ink bg-surface-2">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">Everything after the result.</h2>
            <p className="mt-3 max-w-lg text-muted">
              Four things every student actually needs — in one place, in plain words.
            </p>
            <div className="mt-6 sm:mt-10 grid gap-6 sm:grid-cols-2">
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
        <section id="explore" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <span className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
                <span className="h-2 w-2 bg-accent" /> try it now
              </span>
              <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
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
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">Every number is sourced.</h2>
              <p className="mt-3 max-w-md text-muted">
                No made-up stats. Every claim links to the official source, so you — and your
                parents — can verify it.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "PMDC", url: "https://pmdc.pk/" },
                { name: "HEC", url: "https://www.hec.gov.pk/" },
                { name: "PBS", url: "https://www.pbs.gov.pk/" },
                { name: "P@SHA", url: "https://pasha.org.pk/" },
                { name: "SBP", url: "https://www.sbp.org.pk/" },
              ].map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border-2 border-ink bg-surface px-4 py-2 font-mono text-sm text-ink shadow-[3px_3px_0_0_var(--color-line)] transition-colors hover:bg-accent hover:text-white hover:shadow-none"
                >
                  {s.name} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="border-t-2 border-ink bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="grid items-start gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">Get in touch.</h2>
                <p className="mt-3 max-w-md text-muted">
                  Questions? Feedback? Want to collaborate? Drop us a message — we read every one.
                </p>
                <div className="mt-8 space-y-4">
                  <a
                    href="mailto:hello@aftermediate.com"
                    className="flex items-center gap-3 text-ink transition-colors hover:text-accent"
                  >
                    <div className="grid h-10 w-10 place-items-center border-2 border-ink bg-accent shadow-[2px_2px_0_0_var(--color-ink)]">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-mono text-xs text-faint uppercase">Email us</p>
                      <p className="text-sm font-semibold">hello@aftermediate.com</p>
                    </div>
                  </a>
                </div>
              </div>

              <ContactForm />
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="border-t-2 border-ink bg-accent">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6 sm:py-20">
            <Illustration name="compass" scale={4} />
            <h2 className="max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
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