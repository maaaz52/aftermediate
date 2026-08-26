import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { Illustration } from "@/components/pixel/illustrations";

export const metadata = {
  title: "Live soon",
};

export default function ComingSoon() {
  return (
    <div className="grid-bg relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <header className="absolute left-1/2 top-8 -translate-x-1/2">
        <Link href="/" aria-label="aftermediate home">
          <Brand />
        </Link>
      </header>

      <main className="animate-rise mx-auto flex w-full max-w-md flex-col items-center text-center">
        <div className="grid h-24 w-24 place-items-center border-2 border-ink bg-accent shadow-[6px_6px_0_0_var(--color-ink)]">
          <Illustration name="compass" scale={6} />
        </div>

        <p className="mt-8 inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
          <span className="h-2 w-2 animate-pulse bg-emerald" />
          In progress
        </p>

        <h1 className="mt-5 font-display text-4xl leading-tight tracking-wide text-ink sm:text-5xl">
          Live<span className="text-accent"> soon</span>.
        </h1>

        <p className="mt-4 font-sans text-base leading-relaxed text-muted">
          aftermediate is being polished. We&apos;re rolling it out in stages — and
          your stream is next. Check back shortly to see your merit, your Plan B
          and your roadmap.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border-2 border-ink bg-accent px-6 py-3 font-sans text-sm font-semibold text-white shadow-[4px_4px_0_0_var(--color-ink)] transition-all hover:bg-accent-soft active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the landing page
          </Link>
        </div>
      </main>
    </div>
  );
}
